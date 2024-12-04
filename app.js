const express = require("express");
const sequelize = require("./config/database");
const User = require("./models/User");
const bcrypt = require("bcrypt");
const userrouter = require("./routes/auth");

const app = express();

app.use(express.json());
app.use("/user", userrouter);

sequelize
  .sync({ force: false })
  .then(() => {
    console.log("Database synced!");
  })
  .catch((error) => {
    console.error("Database sync failed:", error);
  });

app.listen(3000, () => console.log("Server running on port 3000"));
