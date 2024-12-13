import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";
import User from "./User";
import SpeakerProfile from "./Speaker";

interface BookingAttributes {
  id: string;
  userId: string;
  speakerId: string;
  date: string;
  timeSlot: string;
}

interface BookingCreationAttributes extends Optional<BookingAttributes, "id"> {}

class Booking
  extends Model<BookingAttributes, BookingCreationAttributes>
  implements BookingAttributes
{
  public id!: string;
  public userId!: string;
  public speakerId!: string;
  public date!: string;
  public timeSlot!: string;
}

Booking.init(
  {
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
      type: DataTypes.ENUM(
        "9:00 AM - 10:00 AM",
        "10:00 AM - 11:00 AM",
        "11:00 AM - 12:00 PM",
        "12:00 PM - 1:00 PM",
        "1:00 PM - 2:00 PM",
        "2:00 PM - 3:00 PM",
        "3:00 PM - 4:00 PM"
      ),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Booking",
  }
);

export default Booking;
