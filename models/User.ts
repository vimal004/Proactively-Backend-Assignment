import { DataTypes, Model, Optional } from "sequelize";
import sequelize from "../config/database";

interface UserAttributes {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  userType: "user" | "speaker";
  isVerified: boolean;
  otp?: string;
  otpExpiration?: Date;
}

interface UserCreationAttributes extends Optional<UserAttributes, "id" | "isVerified" | "otp" | "otpExpiration"> {}

class User extends Model<UserAttributes, UserCreationAttributes> implements UserAttributes {
  public id!: string;
  public firstName!: string;
  public lastName!: string;
  public email!: string;
  public password!: string;
  public userType!: "user" | "speaker";
  public isVerified!: boolean;
  public otp?: string;
  public otpExpiration?: Date;
}

User.init(
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    firstName: { type: DataTypes.STRING, allowNull: false },
    lastName: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    userType: { type: DataTypes.ENUM("user", "speaker"), allowNull: false },
    isVerified: { type: DataTypes.BOOLEAN, defaultValue: false },
    otp: { type: DataTypes.STRING, allowNull: true },
    otpExpiration: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: "User",
  }
);

export default User;
