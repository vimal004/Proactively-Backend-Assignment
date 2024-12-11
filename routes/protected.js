const express = require("express");
const protectedRouter = express.Router();
const authorize = require("../middlewares/authMiddleware");
const SpeakerProfile = require("../models/speaker");
const Booking = require("../models/Booking");
const User = require("../models/user");
const GoogleService = require("../utils/googleService");
const transporter = require("../config/emailConfig");
const convertTo24Hour = require("../utils/convertTo24Hour");
const googleService = new GoogleService();

// Sample route that requires 'user' role
protectedRouter.get("/user-dashboard", authorize(["user"]), (req, res) => {
  res
    .status(200)
    .json({ message: "Welcome to the User Dashboard", user: req.user });
});

// Sample route that requires 'speaker' role
protectedRouter.get(
  "/speaker-dashboard",
  authorize(["speaker"]),
  (req, res) => {
    res
      .status(200)
      .json({ message: "Welcome to the Speaker Dashboard", user: req.user });
  }
);

// Sample route that allows both 'user' and 'speaker' roles
protectedRouter.get(
  "/general-dashboard",
  authorize(["user", "speaker"]),
  (req, res) => {
    res
      .status(200)
      .json({ message: "Welcome to the General Dashboard", user: req.user });
  }
);

// Route to create speaker profile
protectedRouter.post(
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
protectedRouter.post("/book", authorize(["user"]), async (req, res) => {
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

module.exports = protectedRouter;
