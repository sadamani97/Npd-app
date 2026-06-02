import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const Hostel = sequelize.define("Hostel", {
  hostel_name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: "Name of the hostel"
  },
  hostel_code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: "Unique code auto-generated from hostel name"
  },
  owner_name: {
    type: DataTypes.STRING,
    allowNull: true
  },
  owner_phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  owner_email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  city: {
    type: DataTypes.STRING,
    allowNull: true
  },
  state: {
    type: DataTypes.STRING,
    allowNull: true
  },
  total_beds: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: "Total bed capacity"
  },
  occupied_beds: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    comment: "Currently occupied beds"
  },
  registration_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    comment: "When hostel registered for the platform"
  },
  status: {
    type: DataTypes.ENUM("PENDING", "ACTIVE", "INACTIVE", "SUSPENDED"),
    defaultValue: "PENDING",
    comment: "PENDING: awaiting SuperAdmin approval, ACTIVE: approved and active, INACTIVE: not in use, SUSPENDED: temporarily disabled"
  },
  subscription_plan: {
    type: DataTypes.ENUM("BASIC", "PREMIUM", "ENTERPRISE"),
    defaultValue: "BASIC",
    comment: "Subscription tier"
  },
  subscription_status: {
    type: DataTypes.ENUM("ACTIVE", "EXPIRED", "CANCELLED"),
    defaultValue: "ACTIVE",
    comment: "Current subscription status"
  },
  subscription_end_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "When subscription expires"
  },
  approval_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "When SuperAdmin approved this hostel"
  },
  approved_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "SuperAdmin user ID who approved"
  },
  metadata: {
    type: DataTypes.JSON,
    defaultValue: {},
    comment: "Custom configuration and metadata"
  }
});
