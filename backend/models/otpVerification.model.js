// models/otpVerification.model.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const OtpVerification = sequelize.define("OtpVerification", {
  phone_number: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "Phone number for which OTP is sent"
  },
  otp: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "OTP code"
  },
  attempts: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: "Number of verification attempts"
  },
  is_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Whether OTP has been verified"
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "Timestamp when OTP was verified"
  },
  expires_at: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: "OTP expiration timestamp"
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Reference to User if OTP is for existing user"
  }
}, {
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ["phone_number", "is_verified"]
    }
  ]
});
