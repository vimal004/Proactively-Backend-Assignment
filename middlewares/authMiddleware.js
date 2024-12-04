const jwt = require("jsonwebtoken");

// Authentication Middleware
function authenticateToken(req, res, next) {
  const token = req.headers["authorization"];

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token." });

    req.user = user; // Attach user data to request
    next();
  });
}

module.exports = authenticateToken;
