// models/index.js
import sequelize from "../config/db.js";
import { User } from "./user.model.js";
import { Complaint } from "./complaint.model.js";
import { VacatedUser } from "./vacateduser.model.js";
import { Circular } from "./circular.model.js";
import { Room } from "./room.model.js";
import { Payment } from "./payment.model.js";
import { ElectricityMeter } from "./electricityMeter.model.js";
import { FoodMenu } from "./foodMenu.model.js";
import { FoodConfirmation } from "./foodConfirmation.model.js";
import { OtpVerification } from "./otpVerification.model.js";
import { Hostel } from "./hostel.model.js";
import { SuperAdmin } from "./superAdmin.model.js";

// Define Associations Here

// User & Hostel
User.belongsTo(Hostel, { foreignKey: "hostel_id", as: "hostel" });
Hostel.hasMany(User, { foreignKey: "hostel_id", as: "users" });

// Complaint & User
Complaint.belongsTo(User, { foreignKey: "userId", as: "user" });
User.hasMany(Complaint, { foreignKey: "userId", as: "complaints" });

// Complaint & Hostel (Multi-tenancy)
Complaint.belongsTo(Hostel, { foreignKey: "hostel_id", as: "hostel" });
Hostel.hasMany(Complaint, { foreignKey: "hostel_id", as: "complaints" });

// FoodConfirmation & User
FoodConfirmation.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(FoodConfirmation, { foreignKey: "user_id", as: "foodConfirmations" });

// Export all models
export {
  sequelize,
  User,
  Complaint,
  VacatedUser,
  Circular,
  Room,
  Payment,
  ElectricityMeter,
  FoodMenu,
  FoodConfirmation,
  OtpVerification,
  Hostel,
  SuperAdmin
};