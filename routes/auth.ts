import express, { Request, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import User from "../models/User";
import sendOTP from "../utils/sendOTP";
import { validateEmail, validatePassword } from "../utils/validators";

const userRouter = express.Router();
const otpExpirationTime = 10 * 60 * 1000;

interface SignupRequest extends Request {
  body: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    userType: "user" | "speaker";
  };
}

interface VerifyRequest extends Request {
  body: {
    email: string;
    otp: string;
  };
}

interface LoginRequest extends Request {
  body: {
    email: string;
    password: string;
  };
}

interface DeleteUserRequest extends Request {
  body: {
    email: string;
  };
}

// Signup Route
userRouter.post("/signup", async (req: SignupRequest, res: Response) => {
  const { firstName, lastName, email, password, userType } = req.body;

  if (!validateEmail(email)) {
    res.status(400).json({ message: "Invalid email format." });
    return;
  }

  if (!validatePassword(password)) {
    res.status(400).json({
      message:
        "Password must be at least 8 characters long, contain at least one uppercase letter, one lowercase letter, one digit, and one special character.",
    });
    return;
  }

  if (!["user", "speaker"].includes(userType)) {
    res.status(400).json({ message: "Invalid user type." });
    return;
  }

  try {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(400).json({ message: "Email is already registered." });
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
userRouter.post("/verify", async (req: VerifyRequest, res: Response) => {
  const { email, otp } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    if (user.otpExpiration && new Date() > new Date(user.otpExpiration)) {
      res.status(400).json({ message: "OTP has expired." });
      return;
    }

    if (user.otp !== otp) {
      res.status(400).json({ message: "Invalid OTP." });
      return;
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
userRouter.post("/login", async (req: LoginRequest, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      res.status(400).json({ message: "Invalid email or password." });
      return;
    }

    if (!user.isVerified) {
      res
        .status(403)
        .json({ message: "Please verify your email to activate the account." });
      return;
    }

    const token = jwt.sign(
      { id: user.id, userType: user.userType },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    res.status(200).json({ message: "Login successful.", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Login failed. Please try again later." });
  }
});

// Delete User Route
userRouter.delete("/deleteuser", async (req: DeleteUserRequest, res: Response) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    await user.destroy();
    res.status(200).json({ message: "User deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete user." });
  }
});

export default userRouter;
