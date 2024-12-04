const express = require("express");
const protectedrouter = express.protectedrouter();
const authorize = require("../middlewares/authMiddleware/authorize");

// Sample route that requires 'user' role
protectedrouter.get("/user-dashboard", authorize(["user"]), (req, res) => {
  res
    .status(200)
    .json({ message: "Welcome to the User Dashboard", user: req.user });
});

// Sample route that requires 'speaker' role
protectedrouter.get("/speaker-dashboard", authorize(["speaker"]), (req, res) => {
  res
    .status(200)
    .json({ message: "Welcome to the Speaker Dashboard", user: req.user });
});

// Sample route that allows both 'user' and 'speaker' roles
protectedrouter.get("/general-dashboard", authorize(["user", "speaker"]), (req, res) => {
  res
    .status(200)
    .json({ message: "Welcome to the General Dashboard", user: req.user });
});

module.exports = protectedrouter;
