const express = require("express");
const sequelize = require("./config/database");
const bcrypt = require("bcryptjs");
const userrouter = require("./routes/auth");
const protectedrouter = require("./routes/protected");
const publicrouter = require("./routes/public");
const { User, SpeakerProfile } = require("./models/associations");

const app = express();

app.use(express.json());
app.use("/user", userrouter);
app.use("/protected", protectedrouter);
app.use("/public", publicrouter);

app.get("/", (req, res) => {
  res.send("Welcome to the home page!");
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
