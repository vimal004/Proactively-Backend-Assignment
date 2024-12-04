const express = require("express");
const bcrypt = require("bcrypt");
const User = require("../models/User");
const router = express.Router();
const nodemailer = require("nodemailer");

// Signup Route
router.post("/signup", async (req, res) => {
  const { firstName, lastName, email, password, userType } = req.body;

  if (!["user", "speaker"].includes(userType)) {
    return res.status(400).json({ message: "Invalid user type." });
  }

  try {
    // Check if the email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered." });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashedPassword,
      userType,
    });

    res
      .status(201)
      .json({ message: "Signup successful! Please verify your email.", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Signup failed. Please try again later." });
  }
});

// Configure nodemailer
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, // Your Gmail address
    pass: process.env.EMAIL_PASS, // Your Gmail app password
  },
});

// Generate and send OTP
function sendOTP(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Verify Your Account",
    text: `Your OTP for account verification is: ${otp}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
}

router.post("/verify", async (req, res) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Verify OTP
    if (user.otp !== otp) {
      return res.status(400).json({ message: "Invalid OTP." });
    }

    // Activate the account
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

module.exports = router;
