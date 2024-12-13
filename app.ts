import express, { Request, Response } from "express";
import sequelize from "./config/database";
import bcrypt from "bcryptjs";
import userRouter from "./routes/auth";
//import protectedRouter from "./routes/protected";
//import publicRouter from "./routes/public";
import { User, SpeakerProfile } from "./models/associations";
import dotenv from "dotenv";

dotenv.config({ path: "../.env" });

const app = express();

app.use(express.json());
app.use("/user", userRouter);
//app.use("/protected", protectedRouter);
//app.use("/public", publicRouter);

app.get("/", (req: Request, res: Response) => {
  res.send("Test Route");
});

// Sync database
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Database synced!");
  })
  .catch((err: Error) => {
    console.error("Error syncing database:", err);
  });

app.listen(3000, () => console.log("Server running on port 3000"));
