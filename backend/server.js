const { requireAuth } = require("./middleware/auth");
require("dotenv").config();
require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Oriental Inventory API is Running");
});

app.use("/api/books", requireAuth, require("./routes/books"));
app.use("/api/invoices", requireAuth, require("./routes/invoices"));
app.use("/api/auth", require("./routes/auth"));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected");
    app.listen(process.env.PORT || 5000, () => {
      console.log("server is running");
    });
  })
  .catch((err) => console.log("DB Error:", err.message));