const express = require("express");
const bcrypt = require("bcryptjs");
const User = require("../models/user");
const router = express.Router();
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const sendOTP = require("../utils/sendOTP");
const { emailValidator, passwordValidator } = require("../utils/validators");

const otpExpirationTime = 10 * 60 * 1000;


// Signup Route
router.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password, userType } = req.body;

  if (!emailValidator(email)) {
    return res.status(400).json({ message: "Invalid email format." });
  }

  if (!passwordValidator(password)) {
    return res.status(400).json({
      message:
        "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one digit, and one special character.",
    });
  }

  if (!["user", "speaker"].includes(userType)) {
    return res.status(400).json({ message: "Invalid user type." });
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiration = new Date(Date.now() + otpExpirationTime);

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      userType,
      otp,
      isVerified: false,
      otpExpiration,
    });

    sendOTP(email, otp);

    res
      .status(201)
      .json({ message: "Signup successful! Please verify your email.", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Signup failed. Please try again later." });
  }
});

// OTP Verification Route
router.post("/verify", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (user.otpExpiration && new Date() > new Date(user.otpExpiration)) {
      return res.status(400).json({ message: "OTP has expired." });
    }

    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({ message: "Account verified successfully!" });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Verification failed. Please try again later." });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: "Invalid email or password." });
    }

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ message: "Please verify your email to activate the account." });
    }

    const token = jwt.sign(
      { id: user.id, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.status(200).json({ message: "Login successful.", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed. Please try again later." });
  }
});

// Delete User Route
router.delete("/deleteuser", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    await user.destroy();
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete user." });
  }
});

module.exports = router;
