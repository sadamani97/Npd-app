// models/foodConfirmation.model.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";
import { User } from "./user.model.js";

export const FoodConfirmation = sequelize.define("FoodConfirmation", {
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: "Reference to User"
  },
  confirmation_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: "Date for which user is confirming/declining food"
  },
  breakfast: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: "User wants breakfast"
  },
  lunch: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: "User wants lunch"
  },
  dinner: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: "User wants dinner"
  },
  is_confirmed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: "true = user confirmed meals, false = not confirmed"
  },
  confirmed_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "Timestamp when user submitted confirmation"
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Any additional notes from user"
  }
}, {
  timestamps: true,
  underscored: true,
  indexes: [
    {
      unique: true,
      fields: ["user_id", "confirmation_date"]
    }
  ]
});

// Note: Associations are defined in app.js to avoid circular dependency issues
// FoodConfirmation.belongsTo(User, { foreignKey: "user_id" });
// User.hasMany(FoodConfirmation, { foreignKey: "user_id" });
