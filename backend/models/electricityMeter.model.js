// models/electricityMeter.model.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const ElectricityMeter = sequelize.define("ElectricityMeter", {
  meter_number: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  room_id: DataTypes.INTEGER,
  block_number: DataTypes.STRING,
  floor_number: DataTypes.STRING,
  room_number: DataTypes.STRING,
  current_reading: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  previous_reading: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  units_consumed: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  rate_per_unit: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 14.00
  },
  monthly_charge: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  last_reading_date: DataTypes.DATE,
  status: {
    type: DataTypes.ENUM("ACTIVE", "INACTIVE"),
    defaultValue: "ACTIVE"
  }
});
