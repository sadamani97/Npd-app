// models/circular.model.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const Circular = sequelize.define("Circular", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  sentVia: {
    type: DataTypes.ENUM("WHATSAPP", "EMAIL", "BOTH"),
    defaultValue: "WHATSAPP"
  },
  sentAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  status: {
    type: DataTypes.ENUM("PENDING", "SENT", "FAILED"),
    defaultValue: "PENDING"
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: "Stores sending statistics and failed phone numbers"
  },
  hostel_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Hostel this circular belongs to"
  }
});
