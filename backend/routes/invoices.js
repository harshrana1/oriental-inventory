const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const Invoice = require("../models/Invoice");

// Naya bill: har line ka alag discount, foreign currency ka conversion, stock apne aap kam
router.post("/", async (req, res) => {
  const { customerName, customerAddress, customerPhone, customerGstin, orderNo, orderDate, items } = req.body;
  const rates = req.body.rates || {};
  const R = { INR: 1, ...rates };
  if (!customerName || !Array.isArray(items) || !items.length) {
    return res.status(400).json({ error: "Customer ka naam aur kam se kam ek book chahiye" });
  }
  const done = []; // rollback ke liye
  try {
    const lines = [];
    for (const it of items) {
      const qty = Number(it.qty), disc = Number(it.disc) || 0;
      if (!Number.isInteger(qty) || qty < 1) throw new Error("Quantity galat hai");
      if (disc < 0 || disc > 100) throw new Error("Discount 0 se 100 ke beech hona chahiye");
      const b0 = await Book.findById(it.book);
      if (!b0) throw new Error("Book nahi mili");
      const conv = R[b0.currency];
      if (!conv) throw new Error("Conversion rate daalo: " + b0.currency);
      const book = await Book.findOneAndUpdate(
        { _id: it.book, stock: { $gte: qty } },
        { $inc: { stock: -qty } },
        { new: true }
      );
      if (!book) throw new Error("Stock kam hai: " + b0.title);
      done.push({ id: book._id, qty });
      const amount = +(book.listPrice * conv * qty * (1 - disc / 100)).toFixed(2);
      const gst = +((amount * book.gstRate) / 100).toFixed(2);
      lines.push({
        book: book._id, title: book.title, author: book.author, qty,
        unit: it.unit || "cps", currency: book.currency, price: book.listPrice,
        conv, disc, gstRate: book.gstRate, amount, gst,
      });
    }
    const subtotal = +lines.reduce((s, l) => s + l.amount, 0).toFixed(2);
    const gstTotal = +lines.reduce((s, l) => s + l.gst, 0).toFixed(2);
    const raw = subtotal + gstTotal;
    const total = Math.round(raw);
    const count = await Invoice.countDocuments();
    const invoice = await Invoice.create({
      invoiceNo: "OI-" + String(count + 1).padStart(5, "0"),
      customerName, customerAddress, customerPhone, customerGstin, orderNo, orderDate,
      rates: { USD: rates.USD, GBP: rates.GBP, EUR: rates.EUR, DM: rates.DM },
      items: lines, subtotal, gstTotal, roundOff: +(total - raw).toFixed(2), total,
    });
    res.status(201).json(invoice);
  } catch (err) {
    for (const d of done) await Book.findByIdAndUpdate(d.id, { $inc: { stock: d.qty } });
    res.status(400).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    res.json(await Invoice.find().sort({ date: -1 }).limit(100));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const inv = await Invoice.findById(req.params.id);
    if (!inv) return res.status(404).json({ error: "Bill nahi mila" });
    res.json(inv);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
