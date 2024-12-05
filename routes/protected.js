const express = require("express");
const protectedrouter = express.Router();
const authorize = require("../middlewares/authMiddleware");
const SpeakerProfile = require("../models/Speaker");

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

module.exports = protectedrouter;
