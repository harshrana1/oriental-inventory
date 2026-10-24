const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
  book: { type: mongoose.Schema.Types.ObjectId, ref: "Book", required: true },
  title: String, author: String,
  qty: { type: Number, required: true, min: 1 },
  unit: { type: String, default: "cps" },
  currency: String, price: Number, conv: Number,
  disc: { type: Number, default: 0 },
  gstRate: { type: Number, default: 0 },
  amount: Number, gst: Number,
});

const invoiceSchema = new mongoose.Schema({
  invoiceNo: { type: String, unique: true },
  date: { type: Date, default: Date.now },
  orderNo: String, orderDate: String,
  customerName: { type: String, required: true },
  customerAddress: String, customerPhone: String, customerGstin: String,
  rates: { USD: Number, GBP: Number, EUR: Number, DM: Number },
  items: [itemSchema],
  subtotal: Number, gstTotal: Number, roundOff: Number, total: Number,
});

module.exports = mongoose.model("Invoice", invoiceSchema);
