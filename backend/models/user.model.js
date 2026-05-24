// models/user.model.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const User = sequelize.define("User", {
  name: DataTypes.STRING,
  phone: DataTypes.STRING,
  email: DataTypes.STRING,
  block_number: DataTypes.STRING,
  floor_number: DataTypes.STRING,
  room_number: DataTypes.STRING,
  room_type: {
    type: DataTypes.ENUM("SINGLE_SHARE", "DOUBLE_SHARE", "TRIPLE_SHARE", "FOUR_SHARE", "FIVE_SHARE", "SIX_SHARE"),
    defaultValue: "DOUBLE_SHARE"
  },
  ac_status: {
    type: DataTypes.ENUM("AC", "NON_AC"),
    defaultValue: "NON_AC"
  },
  father_name: DataTypes.STRING,
  father_phone: DataTypes.STRING,
  mother_name: DataTypes.STRING,
  emergency_name: DataTypes.STRING,
  emergency_phone: DataTypes.STRING,
  guardian_name: DataTypes.STRING,
  guardian_phone: DataTypes.STRING,
  occupation: DataTypes.ENUM("WORKING", "STUDYING"),
  company_name: DataTypes.STRING,
  college_name: DataTypes.STRING,
  password: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: "Deprecated - Use OTP instead"
  },
  is_phone_verified: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
    comment: "Whether phone number has been verified via OTP"
  },
  role: {
    type: DataTypes.ENUM("ADMIN", "USER"),
    defaultValue: "USER"
  },
  status: {
    type: DataTypes.ENUM("ACTIVE", "VACATED"),
    defaultValue: "ACTIVE"
  },
  join_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  rent_amount: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  electricity_charges: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  total_charges: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  electricity_meter_number: DataTypes.STRING,
  photo: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Base64 encoded photo or photo URL"
  }
});