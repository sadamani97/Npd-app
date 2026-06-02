import { DataTypes } from "sequelize";
import sequelize from "../config/db.js";

export const SuperAdmin = sequelize.define("SuperAdmin", {
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    comment: "SuperAdmin email for login"
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: "Bcrypt hashed password"
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: true
  },
  role: {
    type: DataTypes.ENUM("SUPER_ADMIN", "SUPPORT_TEAM"),
    defaultValue: "SUPER_ADMIN",
    comment: "SUPER_ADMIN: full platform access, SUPPORT_TEAM: limited access"
  },
  permissions: {
    type: DataTypes.JSON,
    defaultValue: ["view_hostels", "manage_hostels", "view_analytics", "manage_approvals"],
    comment: "Array of permission strings"
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: "Last login timestamp"
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
    comment: "Whether this Super Admin account is active"
  }
});
