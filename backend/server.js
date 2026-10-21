require('dotenv').config();
require("dns").setServers(["8.8.8.8", "1.1.1.1"]);
const express = require("express");
const mangoose = require("mongoose");

const app = express();
app.use(express.json());
app.get("/", (req, res) => {
    res.send("Oreintal Inventory API is Running");
});
mangoose
.connect(process.env.MONGO_URI)
.then(() => {
    console.log("MongoDB Connected");
    app.listen(process.env.PORT || 5000,() => {
        console.log("server is running")
    });
})
.catch((err) => console.log("DB Error:", err.message));