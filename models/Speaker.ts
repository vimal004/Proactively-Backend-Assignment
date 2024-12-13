import { Model, DataTypes } from "sequelize";
import sequelize from "../config/database";
import User from "./User"; // Import the User model

class SpeakerProfile extends Model {
  public id!: string;
  public userId!: string;
  public name!: string;
  public bio!: string;
  public expertise!: string;
  public pricePerSession!: number;
}

SpeakerProfile.init(
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
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    bio: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    expertise: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    pricePerSession: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "SpeakerProfile",
    indexes: [
      {
        fields: ["userId"],
        unique: true, // Add unique index on userId
      },
    ],
  }
);

export default SpeakerProfile;
