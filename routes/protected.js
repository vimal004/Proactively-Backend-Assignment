const express = require("express");
const protectedrouter = express.Router();
const authorize = require("../middlewares/authMiddleware");
const SpeakerProfile = require("../models/Speaker");
const Booking = require("../models/Booking");
const User = require("../models/User");
const nodemailer = require("nodemailer");
const { google } = require("googleapis");
const GoogleService = require("../utils/googleService");
const googleService = new GoogleService();
require("dotenv").config({ path: "../.env" });

// Utility function to convert time to 24-hour format
const convertTo24Hour = (time) => {
  const [timePart, period] = time.split(" ");
  let [hours, minutes] = timePart.split(":").map(Number);

  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }

  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
};

// Email configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

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

// Route to create speaker profile
protectedrouter.post(
  "/createspeakerprofile",
  authorize(["speaker"]),
  async (req, res) => {
    try {
      const { expertise, pricePerSession } = req.body;
      const userId = req.user.id;

      const speakerProfileExists = await SpeakerProfile.findOne({
        where: { userId },
      });

      if (speakerProfileExists) {
        return res
          .status(400)
          .json({ message: "Speaker Profile already exists!" });
      }

      const speakerProfile = await SpeakerProfile.create({
        userId,
        expertise,
        pricePerSession,
      });

      res
        .status(200)
        .json({ message: "Speaker Profile Created!", speakerProfile });
    } catch (error) {
      console.error(error);
      res.status(500).json({ message: "Internal Server Error" });
    }
  }
);

// Route to book a session
protectedrouter.post("/book", authorize(["user"]), async (req, res) => {
  let calendarLink = "";
  try {
    const { speakerId, date, timeSlot } = req.body;
    const userId = req.user.id;

    const speakerProfile = await SpeakerProfile.findOne({
      where: { userId: speakerId },
    });

    if (!speakerProfile) {
      return res.status(404).json({ message: "Speaker not found!" });
    }

    const bookingExists = await Booking.findOne({
      where: { speakerId, date, timeSlot },
    });

    if (bookingExists) {
      return res.status(400).json({ message: "Slot already booked!" });
    }

    const booking = await Booking.create({ userId, speakerId, date, timeSlot });

    const user = await User.findByPk(userId);
    const speaker = await User.findByPk(speakerId);

    try {
      const [start, end] = booking.timeSlot.split(" - ");
      const bookingDetails = {
        date: booking.date,
        startTime: convertTo24Hour(start),
        endTime: convertTo24Hour(end),
        userEmail: user.email,
        speakerEmail: speaker.email,
      };

      calendarLink = await googleService.createCalendarEvent(bookingDetails);
      console.log("Calendar Link:", calendarLink);
    } catch (error) {
      console.error("Booking confirmation failed:", error);
    }

    const mailOptionsForUser = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Booking Confirmation",
      text: `Your session with ${speaker.firstName} ${speaker.lastName} on ${date} at ${timeSlot} has been successfully booked. Calendar Link: ${calendarLink}`,
    };

    const mailOptionsForSpeaker = {
      from: process.env.EMAIL_USER,
      to: speaker.email,
      subject: "New Booking Notification",
      text: `You have a new booking from ${user.firstName} ${user.lastName} on ${date} at ${timeSlot}. Calendar Link: ${calendarLink}`,
    };

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
