// backend/seed.js
// This file creates initial admin user. Run with: node seed.js

import sequelize from "./config/db.js";
import { User } from "./models/user.model.js";
import { Complaint } from "./models/complaint.model.js";
import { VacatedUser } from "./models/vacateduser.model.js";
import { Circular } from "./models/circular.model.js";
import { SuperAdmin } from "./models/superAdmin.model.js";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

dotenv.config();

const seedDatabase = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("✅ Database connected");

    // Sync database
    await sequelize.sync({ alter: true });
    console.log("✅ Database synced");

    // Check if admin exists
    const adminExists = await User.findOne({ where: { email: "admin@hostel.com" } });

    if (adminExists) {
      console.log("ℹ️ Admin user already exists");
    } else {
      // Create admin user
      const hashedPassword = await bcrypt.hash("admin123", 10);

      await User.create({
        name: "Admin User",
        email: "admin@hostel.com",
        password: hashedPassword,
        phone: "8760154772",
        role: "ADMIN",
        status: "ACTIVE"
      });

      console.log("\n✅ Admin user created successfully!");
      console.log("📝 Email: admin@hostel.com");
      console.log("🔑 Password: admin123");
      console.log("\n⚠️ Please change the password after first login!");
    }

      // Check if a SuperAdmin exists and create one if missing
      const superAdminExists = await SuperAdmin.findOne({ where: { email: "superadmin@hostel.com" } });
      if (superAdminExists) {
        console.log("ℹ️ SuperAdmin already exists");
      } else {
        const superAdminPassword = await bcrypt.hash("superadmin123", 10);
        await SuperAdmin.create({
          name: "Super Admin",
          email: "superadmin@hostel.com",
          password: superAdminPassword,
          phone: "0000000000",
          role: "SUPER_ADMIN",
          is_active: true
        });
        console.log("\n✅ SuperAdmin account created successfully!");
        console.log("📝 Email: superadmin@hostel.com");
        console.log("🔑 Password: superadmin123");
      }

    // Check if test user exists
    const userExists = await User.findOne({ where: { email: "user@hostel.com" } });

    if (userExists) {
      console.log("ℹ️ Test user already exists");
    } else {
      // Create test user
      const userPassword = await bcrypt.hash("user1234", 10);

      await User.create({
        name: "Test User",
        email: "user@hostel.com",
        password: userPassword,
        phone: "8760154772",
        block_number: "A",
        floor_number: 2,
        room_number: 201,
        room_type: "DOUBLE",
        role: "USER",
        status: "ACTIVE"
      });

      console.log("\n✅ Test user created successfully!");
      console.log("📝 Email: user@hostel.com");
      console.log("🔑 Password: user1234");
      console.log("📱 Phone: 8760154772 (for OTP login)");
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding error:", err.message);
    process.exit(1);
  }
};

seedDatabase();
