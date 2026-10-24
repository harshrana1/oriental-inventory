const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const Book = require("../models/Book");
const Invoice = require("../models/Invoice");
const Counter = require("../models/Counter");

const FOREIGN = ["USD", "GBP", "EUR", "DM"];
const UNITS = ["cps", "set", "vol"];

// Ye error user ki galti hai (400). Baaki sab server ki dikkat (500).
class BadRequest extends Error {}

// Conversion rate ki jaanch: sirf positive number chalega
function cleanRates(input) {
  const R = { INR: 1 };
  for (const c of FOREIGN) {
    if (input[c] === undefined || input[c] === null || input[c] === "") continue;
    const n = Number(input[c]);
    if (!Number.isFinite(n) || n <= 0) throw new BadRequest("Conversion rate galat hai: " + c);
    R[c] = n;
  }
  return R;
}

// Naya bill: sab kuch ek transaction me (ya to poora hoga, ya kuch bhi nahi)
router.post("/", async (req, res) => {
  const session = await mongoose.startSession();
  try {
    const b = req.body;
    const customerName = String(b.customerName || "").trim();
    if (!customerName || !Array.isArray(b.items) || b.items.length === 0 || b.items.length > 200) {
      throw new BadRequest("Customer ka naam aur 1 se 200 books chahiye");
    }
    const R = cleanRates(b.rates || {});

    let invoice;
    await session.withTransaction(async () => {
      const lines = [];
      let subP = 0; // paise me (integer)
      let gstP = 0;

      for (const it of b.items) {
        const qty = Number(it.qty);
        const disc = Number(it.disc) || 0;
        if (!Number.isInteger(qty) || qty < 1) throw new BadRequest("Quantity galat hai");
        if (disc < 0 || disc > 100) throw new BadRequest("Discount 0 se 100 ke beech hona chahiye");
        if (!mongoose.isValidObjectId(it.book)) throw new BadRequest("Book ki ID galat hai");
        if (it.unit && !UNITS.includes(it.unit)) throw new BadRequest("Unit galat hai (cps, set ya vol)");

        const book = await Book.findOneAndUpdate(
          { _id: it.book, stock: { $gte: qty } },
          { $inc: { stock: -qty } },
          { new: true, session }
        );
        if (!book) {
          const exists = await Book.findById(it.book).session(session);
          throw new BadRequest(exists ? "Stock kam hai: " + exists.title : "Book nahi mili");
        }
        const conv = R[book.currency];
        if (!conv) throw new BadRequest("Conversion rate daalo: " + book.currency);

        const amountP = Math.round(book.listPrice * conv * qty * (1 - disc / 100) * 100);
        const lineGstP = Math.round((amountP * book.gstRate) / 100);
        subP += amountP;
        gstP += lineGstP;

        lines.push({
          book: book._id, title: book.title, author: book.author, qty,
          unit: it.unit || "cps", currency: book.currency, price: book.listPrice,
          conv, disc, gstRate: book.gstRate,
          amount: amountP / 100, gst: lineGstP / 100,
        });
      }

      const rawP = subP + gstP;
      const totalP = Math.round(rawP / 100) * 100; // nearest rupaya
      const roundOffP = totalP - rawP;

      // Pehli baar counter ko purane bills ki ginti se shuru karo
      await Counter.updateOne(
        { _id: "invoice" },
        { $setOnInsert: { seq: await Invoice.countDocuments().session(session) } },
        { upsert: true, session }
      );
      const counter = await Counter.findOneAndUpdate(
        { _id: "invoice" },
        { $inc: { seq: 1 } },
        { new: true, session }
      );

      const [created] = await Invoice.create(
        [{
          invoiceNo: "OI-" + String(counter.seq).padStart(5, "0"),
          customerName,
          customerAddress: b.customerAddress,
          customerPhone: b.customerPhone,
          customerGstin: b.customerGstin,
          orderNo: b.orderNo,
          orderDate: b.orderDate,
          rates: { USD: R.USD, GBP: R.GBP, EUR: R.EUR, DM: R.DM },
          items: lines,
          subtotal: subP / 100,
          gstTotal: gstP / 100,
          roundOff: roundOffP / 100,
          total: totalP / 100,
        }],
        { session }
      );
      invoice = created;
    });

    res.status(201).json(invoice);
  } catch (err) {
    if (err instanceof BadRequest) return res.status(400).json({ error: err.message });
    console.error(err);
    res.status(500).json({ error: "Server me dikkat aayi, dobara try karo" });
  } finally {
    await session.endSession();
  }
});

router.get("/", async (req, res) => {
  try {
    res.json(await Invoice.find().sort({ date: -1 }).limit(100));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Bills nahi mil paye" });
  }
});

router.get("/:id", async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).json({ error: "Bill ki ID galat hai" });
    }
    const inv = await Invoice.findById(req.params.id);
    if (!inv) return res.status(404).json({ error: "Bill nahi mila" });
    res.json(inv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Bill nahi mil paya" });
  }
});

module.exports = router;