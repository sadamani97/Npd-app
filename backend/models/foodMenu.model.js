// models/foodMenu.model.js
import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const FoodMenu = sequelize.define("FoodMenu", {
  menu_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    comment: "Date for which the menu is applicable"
  },
  meal_type: {
    type: DataTypes.ENUM("BREAKFAST", "LUNCH", "DINNER"),
    allowNull: false
  },
  item_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  is_veg: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  is_available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  created_by: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Admin user ID who created the menu"
  },
  hostel_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: "Hostel this menu belongs to"
  }
}, {
  timestamps: true,
  underscored: true
});
