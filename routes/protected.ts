import { Router, Request, Response } from "express";
import authorize from "../middlewares/authMiddleware";
import SpeakerProfile from "../models/Speaker";
import Booking from "../models/Booking";
import User from "../models/User";
import GoogleService from "../utils/googleService";
import transporter from "../config/emailConfig";
import convertTo24Hour from "../utils/convertTo24Hour";

const protectedRouter = Router();
const googleService = new GoogleService();

// Route to create speaker profile
protectedRouter.post(
  "/createspeakerprofile",
  authorize(["speaker"]),
  async (req: Request, res: Response) => {
    try {
      const { expertise, pricePerSession } = req.body;
      const userId = req.user.id;

      const speakerProfileExists = await SpeakerProfile.findOne({
        where: { userId },
      });

      if (speakerProfileExists) {
        res.status(400).json({ message: "Speaker Profile already exists!" });
        return;
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
protectedRouter.post(
  "/book",
  authorize(["user"]),
  async (req: Request, res: Response) => {
    let calendarLink = "";
    try {
      const { speakerId, date, timeSlot } = req.body;
      const userId = req.user.id;

      const speakerProfile = await SpeakerProfile.findOne({
        where: { userId: speakerId },
      });

      if (!speakerProfile) {
        res.status(404).json({ message: "Speaker not found!" });
        return;
      }

      const bookingExists = await Booking.findOne({
        where: { speakerId, date, timeSlot },
      });

      if (bookingExists) {
        res.status(400).json({ message: "Slot already booked!" });
        return;
      }

      const booking = await Booking.create({
        userId,
        speakerId,
        date,
        timeSlot,
      });

      const user = await User.findByPk(userId);
      const speaker = await User.findByPk(speakerId);

      try {
        const [start, end] = booking.timeSlot.split(" - ");
        const bookingDetails = {
          date: booking.date,
          startTime: convertTo24Hour(start),
          endTime: convertTo24Hour(end),
          userEmail: user?.email!,
          speakerEmail: speaker?.email!,
        };

        calendarLink = await googleService.createCalendarEvent(bookingDetails);
        console.log("Calendar Link:", calendarLink);
      } catch (error) {
        console.error("Booking confirmation failed:", error);
      }

      const mailOptionsForUser = {
        from: process.env.EMAIL_USER,
        to: user?.email!,
        subject: "Booking Confirmation",
        text: `Your session with ${speaker?.firstName} ${speaker?.lastName} on ${date} at ${timeSlot} has been successfully booked. Calendar Link: ${calendarLink}`,
      };

      const mailOptionsForSpeaker = {
        from: process.env.EMAIL_USER,
        to: speaker?.email!,
        subject: "New Booking Notification",
        text: `You have a new booking from ${user?.firstName} ${user?.lastName} on ${date} at ${timeSlot}. Calendar Link: ${calendarLink}`,
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
  }
);

export default protectedRouter;
