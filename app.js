const express = require("express");
const sequelize = require("./config/database");
const bcrypt = require("bcryptjs");
const userRouter = require("./routes/auth");
const protectedRouter = require("./routes/protected");
const publicRouter = require("./routes/public");
const { User, SpeakerProfile } = require("./models/associations");
require("dotenv").config({ path: "../.env" });

const app = express();

app.use(express.json());
app.use("/user", userRouter);
app.use("/protected", protectedRouter);
app.use("/public", publicRouter);

app.get("/", (req, res) => {
  res.send("Test Route");
});

// Sync database
sequelize
  .sync({ alter: true })
  .then(() => {
    console.log("Database synced!");
  })
  .catch((err) => {
    console.error("Error syncing database:", err);
  });

app.listen(3000, () => console.log("Server running on port 3000"));
