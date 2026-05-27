// models/room.model.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const Room = sequelize.define("Room", {
  block_number: {
    type: DataTypes.STRING,
    allowNull: false
  },
  floor_number: {
    type: DataTypes.STRING,
    allowNull: false
  },
  room_number: {
    type: DataTypes.STRING,
    allowNull: false
  },
  room_type: {
    type: DataTypes.ENUM("SINGLE_SHARE", "DOUBLE_SHARE", "TRIPLE_SHARE", "FOUR_SHARE", "FIVE_SHARE", "SIX_SHARE"),
    defaultValue: "DOUBLE_SHARE"
  },
  ac_status: {
    type: DataTypes.ENUM("AC", "NON_AC"),
    defaultValue: "NON_AC"
  },
  capacity: {
    type: DataTypes.INTEGER,
    defaultValue: 1
  },
  base_rent: {
    type: DataTypes.DECIMAL(10, 2),
    defaultValue: 0.00
  },
  status: {
    type: DataTypes.ENUM("AVAILABLE", "OCCUPIED", "MAINTENANCE"),
    defaultValue: "AVAILABLE"
  },
  electricity_meter_number: DataTypes.STRING,
  description: DataTypes.TEXT,
  hostel_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Hostel this room belongs to"
  }
});
