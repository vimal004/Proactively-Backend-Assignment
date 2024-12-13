import express, { Request, Response } from "express";
import { Model } from "sequelize";
import SpeakerProfile from "../models/Speaker";
import User from "../models/User";

const publicRouter = express.Router();

// Route to fetch all speakers
publicRouter.get("/speakers", async (req: Request, res: Response) => {
  try {
    const speakers = await SpeakerProfile.findAll({
      include: [
        {
          model: User, // Join with the User table
          attributes: ["firstName", "lastName", "email"], // Include only relevant user details
        },
      ],
    });

    res
      .status(200)
      .json({ message: "Speakers fetched successfully", speakers });
  } catch (error) {
    console.error("Error fetching speakers:", error);
    res.status(500).json({ message: "Failed to fetch speakers." });
  }
});

export default publicRouter;
