const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: String,
  publisher: String,
  edition: String,
  subject: String,
  language: { type: String, default: "English" },
  itemType: { type: String, default: "Book" },
  isbn: String,
  pages: Number,
  volumes: String,
  hsn: { type: String, default: "4901" },
  gstRate: { type: Number, default: 0 },
  currency: { type: String, enum: ["INR", "USD", "GBP", "EUR", "DM"], default: "INR" },
  listPrice: { type: Number, required: true, min: 0 },
  stock: { type: Number, default: 0, min: 0 },
  lowStockLimit: { type: Number, default: 5 },
});

module.exports = mongoose.model("Book", bookSchema);