const express = require("express");
const protectedrouter = express.Router();
const authorize = require("../middlewares/authMiddleware");
const SpeakerProfile = require("../models/Speaker");
const Booking = require("../models/Booking");
const User = require("../models/User"); 
const nodemailer = require("nodemailer");

// Sample route that requires 'user' role
protectedrouter.get("/user-dashboard", authorize(["user"]), (req, res) => {
  res
    .status(200)
    .json({ message: "Welcome to the User Dashboard", user: req.user });
});

// Sample route that requires 'speaker' role
protectedrouter.get(
  "/speaker-dashboard",
  authorize(["speaker"]),
  (req, res) => {
    res
      .status(200)
      .json({ message: "Welcome to the Speaker Dashboard", user: req.user });
  }
);

// Sample route that allows both 'user' and 'speaker' roles
protectedrouter.get(
  "/general-dashboard",
  authorize(["user", "speaker"]),
  (req, res) => {
    res
      .status(200)
      .json({ message: "Welcome to the General Dashboard", user: req.user });
  }
);

protectedrouter.post(
  "/createspeakerprofile",
  authorize(["speaker"]), // Only speakers are allowed
  async (req, res) => {
    try {
      const { expertise, pricePerSession } = req.body;

      // Get the userId from req.user (set by the authorize middleware)
      const userId = req.user.id;

      // Check if the speaker profile already exists
      const speakerProfileExists = await SpeakerProfile.findOne({
        where: { userId },
      });

      if (speakerProfileExists) {
        return res
          .status(400)
          .json({ message: "Speaker Profile already exists!" });
      }

      // Create the speaker profile
      const speakerProfile = await SpeakerProfile.create({
        userId,
        expertise,
        pricePerSession,
      });

      res.status(200).json({
        message: "Speaker Profile Created!",
        speakerProfile,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

protectedrouter.post("/book", authorize(["user"]), async (req, res) => {
  try {
    const { speakerId, date, timeSlot } = req.body;
    const userId = req.user.id;

    // Check if the speaker exists
    const speakerProfile = await SpeakerProfile.findOne({
      where: { userId: speakerId },
    });

    if (!speakerProfile) {
      return res.status(404).json({ message: "Speaker not found!" });
    }

    // Check if the slot is already booked
    const bookingExists = await Booking.findOne({
      where: { speakerId, date, timeSlot },
    });

    if (bookingExists) {
      return res.status(400).json({ message: "Slot already booked!" });
    }

    // Create the booking
    const booking = await Booking.create({
      userId,
      speakerId,
      date,
      timeSlot,
    });

    // Fetch user and speaker details
    const user = await User.findByPk(userId);
    const speaker = await User.findByPk(speakerId);

    // Email configuration
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptionsForUser = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Booking Confirmation",
      text: `Your session with ${speaker.firstName} ${speaker.lastName} on ${date} at ${timeSlot} has been successfully booked.`,
    };

    const mailOptionsForSpeaker = {
      from: process.env.EMAIL_USER,
      to: speaker.email,
      subject: "New Booking Notification",
      text: `You have a new booking from ${user.firstName} ${user.lastName} on ${date} at ${timeSlot}.`,
    };

    // Send emails to both user and speaker
    await transporter.sendMail(mailOptionsForUser);
    await transporter.sendMail(mailOptionsForSpeaker);

    res
      .status(200)
      .json({ message: "Session Booked and Notifications Sent!", booking });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = protectedrouter;
