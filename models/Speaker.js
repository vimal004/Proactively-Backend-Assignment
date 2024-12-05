const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");
const User = require("./User"); // Import the User model

const SpeakerProfile = sequelize.define("SpeakerProfile", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User, // Reference the User model
      key: "id", // Use the `id` field from the User model
    },
    onDelete: "CASCADE", // Delete the speaker profile if the user is deleted
  },
  expertise: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  pricePerSession: {
    type: DataTypes.DECIMAL(10, 2), // Adjust precision as needed
    allowNull: false,
  },
});

module.exports = SpeakerProfile;
