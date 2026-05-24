// models/payment.model.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const Payment = sequelize.define("Payment", {
  user_id: DataTypes.INTEGER,
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  payment_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  month: {
    type: DataTypes.STRING,
    comment: "Format: YYYY-MM (e.g., 2024-05)"
  },
  rent_amount: DataTypes.DECIMAL(10, 2),
  electricity_amount: DataTypes.DECIMAL(10, 2),
  payment_status: {
    type: DataTypes.ENUM("PAID", "PENDING", "OVERDUE"),
    defaultValue: "PENDING"
  },
  payment_method: {
    type: DataTypes.ENUM("CASH", "ONLINE", "CHEQUE"),
    defaultValue: "CASH"
  },
  description: DataTypes.TEXT,
  receipt_number: DataTypes.STRING,
  paid_date: DataTypes.DATE,
  notes: DataTypes.TEXT
});
