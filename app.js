const express = require("express");
const sequelize = require("./config/database");
const User = require("./models/User");
const bcrypt = require("bcryptjs");
const userrouter = require("./routes/auth");
const protectedrouter = require("./routes/protected");

const app = express();

app.use(express.json());
app.use("/user", userrouter);
app.use("/protected", protectedrouter);

sequelize
  .sync({ force: false })
  .then(() => {
    console.log("Database synced!");
  })
  .catch((error) => {
    console.error("Database sync failed:", error);
  });

app.listen(3000, () => console.log("Server running on port 3000"));
