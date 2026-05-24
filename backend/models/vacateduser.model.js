// models/vacateduser.model.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const VacatedUser = sequelize.define("VacatedUser", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: DataTypes.STRING,
  phone: DataTypes.STRING,
  email: DataTypes.STRING,
  father_name: DataTypes.STRING,
  father_phone: DataTypes.STRING,
  mother_phone: DataTypes.STRING,
  emergency_name: DataTypes.STRING,
  emergency_phone: DataTypes.STRING,
  guardian_name: DataTypes.STRING,
  guardian_phone: DataTypes.STRING,
  occupation: DataTypes.ENUM("WORKING", "STUDYING"),
  company_name: DataTypes.STRING,
  college_name: DataTypes.STRING,
  role: {
    type: DataTypes.ENUM("ADMIN", "USER"),
    defaultValue: "USER"
  },
  vacatedAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});
