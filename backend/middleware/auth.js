const jwt = require("jsonwebtoken");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const [type, token] = header.split(" ");
  if (type !== "Bearer" || !token) {
    return res.status(401).json({ error: "Login karo" });
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = { id: payload.id, role: payload.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Token galat ya expire ho gaya" });
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Sirf admin ye kar sakta hai" });
  }
  next();
}

module.exports = { requireAuth, requireAdmin };