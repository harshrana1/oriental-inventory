const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

// Pehla admin: sirf tab chalega jab database me ek bhi user na ho
router.post("/setup", async (req, res) => {
  try {
    if ((await User.countDocuments()) > 0) {
      return res.status(403).json({ error: "Setup ho chuka hai" });
    }
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    if (username.length < 3 || password.length < 8) {
      return res.status(400).json({ error: "Username 3+ aur password 8+ akshar ka chahiye" });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await User.create({ username, passwordHash, role: "admin" });
    res.status(201).json({ message: "Admin ban gaya" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server me dikkat aayi" });
  }
});

// Login: sahi username-password par token (parchi) milta hai
router.post("/login", async (req, res) => {
  try {
    const username = String(req.body.username || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await User.findOne({ username });
    const ok = user && (await bcrypt.compare(password, user.passwordHash));
    if (!ok) return res.status(401).json({ error: "Username ya password galat hai" });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
    res.json({ token, username: user.username, role: user.role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server me dikkat aayi" });
  }
});

module.exports = router;