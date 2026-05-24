// models/complaint.model.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { User } from "./user.model.js";

export const Complaint = sequelize.define("Complaint", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  category: {
    type: DataTypes.ENUM("MAINTENANCE", "CLEANLINESS", "FOOD", "NOISE", "OTHER"),
    defaultValue: "OTHER"
  },
  status: {
    type: DataTypes.ENUM("OPEN", "IN_PROGRESS", "RESOLVED"),
    defaultValue: "OPEN"
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

Complaint.belongsTo(User, { foreignKey: "userId" });
User.hasMany(Complaint, { foreignKey: "userId" });
