const express = require("express");
const router = express.Router();
const Book = require("../models/Book");

// Nayi book add
router.post("/", async (req, res) => {
  try {
    const book = await Book.create(req.body);
    res.status(201).json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Saari books (search + pagination)
router.get("/", async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [
        { title: rx }, { author: rx }, { isbn: rx },
        { publisher: rx }, { subject: rx },
      ];
    }
    const books = await Book.find(filter)
      .sort({ title: 1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));
    const total = await Book.countDocuments(filter);
    res.json({ books, total, page: Number(page) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Low stock wali books (/:id se pehle hona zaroori hai)
router.get("/low-stock", async (req, res) => {
  try {
    const books = await Book.find({ $expr: { $lte: ["$stock", "$lowStockLimit"] } });
    res.json(books);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Ek book
router.get("/:id", async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) return res.status(404).json({ error: "Book nahi mili" });
    res.json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Book edit
router.put("/:id", async (req, res) => {
  try {
    const book = await Book.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!book) return res.status(404).json({ error: "Book nahi mili" });
    res.json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Stock in/out: { "change": 10 } ya { "change": -2 }
router.patch("/:id/stock", async (req, res) => {
  try {
    const change = Number(req.body.change);
    if (!Number.isFinite(change)) {
      return res.status(400).json({ error: "change ek number hona chahiye" });
    }
    const book = await Book.findOneAndUpdate(
      { _id: req.params.id, stock: { $gte: -change } },
      { $inc: { stock: change } },
      { new: true }
    );
    if (!book) return res.status(400).json({ error: "Book nahi mili ya stock kam hai" });
    res.json(book);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Book delete
router.delete("/:id", async (req, res) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) return res.status(404).json({ error: "Book nahi mili" });
    res.json({ message: "Book delete ho gayi" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;