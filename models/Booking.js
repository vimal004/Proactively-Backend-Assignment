const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");    
const User = require("./User"); 
const SpeakerProfile = require("./Speaker");

// Define the Booking model
const Booking = sequelize.define("Booking", {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: User,
      key: "id",
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  },
  speakerId: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: SpeakerProfile,
      key: "userId",
    },
    onDelete: "CASCADE",
    onUpdate: "CASCADE",
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  timeSlot: {
    type: DataTypes.STRING,
    allowNull: false,
  },
});

module.exports = Booking;
