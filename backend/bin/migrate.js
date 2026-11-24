#!/usr/bin/env node
/**
 * Industrial Standard Database Migration & Seed CLI
 * 
 * Usage:
 *   node bin/migrate.js up       - Synchronize tables and create performance indexes
 *   node bin/migrate.js seed     - Populate initial data (SuperAdmin, Admin, User, Hostel, Rooms)
 *   node bin/migrate.js status   - Display DB connection status and table row counts
 *   node bin/migrate.js reset    - Clear and reseed the database
 */

import "dotenv/config";
import bcrypt from "bcryptjs";
import sequelize from "../config/db.js";
import {
  User,
  Complaint,
  VacatedUser,
  Circular,
  Room,
  Payment,
  ElectricityMeter,
  FoodMenu,
  FoodConfirmation,
  Hostel,
  SuperAdmin
} from "../models/index.js";

// Helper to safely execute index creation without crashing if already exists
const createIndexSafely = async (tableName, indexName, columns) => {
  try {
    await sequelize.query(`CREATE INDEX \`${indexName}\` ON \`${tableName}\` (${columns});`);
    console.log(`  ✓ Index ${indexName} created on ${tableName}`);
  } catch (err) {
    if (err.message.includes("Duplicate key name") || err.message.includes("already exists")) {
      console.log(`  ℹ Index ${indexName} already exists on ${tableName}`);
    } else {
      console.log(`  ℹ Note on index ${indexName}: ${err.message}`);
    }
  }
};

export const up = async () => {
  console.log("\n=======================================================");
  console.log("  HOSTEL MANAGEMENT SYSTEM - DATABASE MIGRATION CLI");
  console.log("=======================================================\n");

  try {
    await sequelize.authenticate();
    console.log("✓ Connected to Database successfully.");

    // Sync schema safely without destructive alter table locking
    await sequelize.sync({ alter: false, force: false });
    console.log("✓ All tables synchronized successfully.");

    console.log("\n-> Optimizing Database Tables & Creating Performance Indexes...");
    await createIndexSafely("Users", "idx_users_email", "`email`");
    await createIndexSafely("Users", "idx_users_phone", "`phone`");
    await createIndexSafely("Users", "idx_users_status_role", "`status`, `role`");
    await createIndexSafely("Users", "idx_users_hostel", "`hostel_id`");
    await createIndexSafely("Users", "idx_users_block_room", "`block_number`, `room_number`");

    await createIndexSafely("Rooms", "idx_rooms_block_room", "`block_number`, `room_number`");
    await createIndexSafely("Rooms", "idx_rooms_hostel", "`hostel_id`");
    await createIndexSafely("Rooms", "idx_rooms_status", "`status`");

    await createIndexSafely("Payments", "idx_payments_user", "`user_id`");
    await createIndexSafely("Payments", "idx_payments_month_status", "`month`, `payment_status`");
    await createIndexSafely("Payments", "idx_payments_hostel", "`hostel_id`");

    await createIndexSafely("Complaints", "idx_complaints_user", "`userId`");
    await createIndexSafely("Complaints", "idx_complaints_hostel", "`hostel_id`");
    await createIndexSafely("Complaints", "idx_complaints_status", "`status`");

    await createIndexSafely("ElectricityMeters", "idx_meters_block_room", "`block_number`, `room_number`");

    console.log("\n✓ Migration completed successfully.\n");
  } catch (err) {
    console.error("❌ Migration error:", err.message);
    process.exit(1);
  }
};

export const seed = async () => {
  try {
    await sequelize.authenticate();
    console.log("✓ Database connected for seeding.");

    // 1. Ensure Default Hostel
    let hostel = await Hostel.findOne();
    if (!hostel) {
      hostel = await Hostel.create({
        hostel_name: "Green Valley Premier Hostel",
        hostel_code: "GVH01",
        owner_name: "Hostel Management Group",
        owner_email: "owner@hostel.com",
        owner_phone: "9876543210",
        address: "123 University Campus Road, Knowledge Park",
        city: "Bangalore",
        state: "Karnataka",
        total_beds: 100,
        occupied_beds: 1,
        subscription_status: "ACTIVE",
        subscription_plan: "PREMIUM",
        status: "ACTIVE"
      });
      console.log(`✓ Default Hostel created: ${hostel.hostel_name} (ID: ${hostel.id})`);
    } else {
      console.log(`ℹ Default Hostel exists: ${hostel.hostel_name} (ID: ${hostel.id})`);
    }

    // 2. Ensure SuperAdmin
    const superAdminExists = await SuperAdmin.findOne({ where: { email: "superadmin@hostel.com" } });
    if (!superAdminExists) {
      const superAdminPass = await bcrypt.hash("superadmin123", 10);
      await SuperAdmin.create({
        name: "Super Administrator",
        email: "superadmin@hostel.com",
        password: superAdminPass,
        phone: "9999999999",
        role: "SUPER_ADMIN",
        is_active: true
      });
      console.log("✓ SuperAdmin account created: superadmin@hostel.com | superadmin123");
    } else {
      console.log("ℹ SuperAdmin already exists: superadmin@hostel.com");
    }

    // 3. Ensure Admin User
    const adminExists = await User.findOne({ where: { email: "admin@hostel.com" } });
    if (!adminExists) {
      const adminPass = await bcrypt.hash("admin123", 10);
      await User.create({
        name: "Hostel Admin",
        email: "admin@hostel.com",
        password: adminPass,
        phone: "8760154772",
        role: "ADMIN",
        hostel_id: hostel.id,
        is_hostel_admin: true,
        is_phone_verified: true,
        status: "ACTIVE"
      });
      console.log("✓ Admin account created: admin@hostel.com | admin123");
    } else {
      console.log("ℹ Admin already exists: admin@hostel.com");
    }

    // 4. Ensure Test User / Resident
    const residentExists = await User.findOne({ where: { email: "user@hostel.com" } });
    if (!residentExists) {
      const userPass = await bcrypt.hash("user1234", 10);
      await User.create({
        name: "John Resident",
        email: "user@hostel.com",
        password: userPass,
        phone: "9876543210",
        block_number: "1",
        floor_number: "1",
        room_number: "101",
        room_type: "DOUBLE_SHARE",
        ac_status: "AC",
        rent_amount: 7750.00,
        electricity_charges: 350.00,
        total_charges: 8100.00,
        role: "USER",
        hostel_id: hostel.id,
        status: "ACTIVE",
        is_phone_verified: true
      });
      console.log("✓ Test User created: user@hostel.com | user1234 (Block 1, Room 101)");
    } else {
      console.log("ℹ Test User already exists: user@hostel.com");
    }

    // 5. Ensure Standard Rooms
    const sampleRooms = [
      { block: "1", floor: "1", room: "101", type: "DOUBLE_SHARE", ac: "AC", rent: 7750, capacity: 2 },
      { block: "1", floor: "1", room: "102", type: "DOUBLE_SHARE", ac: "NON_AC", rent: 7000, capacity: 2 },
      { block: "1", floor: "2", room: "201", type: "TRIPLE_SHARE", ac: "NON_AC", rent: 6750, capacity: 3 },
      { block: "1", floor: "2", room: "202", type: "SINGLE_SHARE", ac: "AC", rent: 10500, capacity: 1 },
      { block: "2", floor: "1", room: "101", type: "DOUBLE_SHARE", ac: "AC", rent: 7750, capacity: 2 },
      { block: "2", floor: "1", room: "102", type: "DOUBLE_SHARE", ac: "NON_AC", rent: 7000, capacity: 2 },
      { block: "2", floor: "2", room: "201", type: "FOUR_SHARE", ac: "NON_AC", rent: 6500, capacity: 4 },
      { block: "2", floor: "2", room: "202", type: "DOUBLE_SHARE", ac: "AC", rent: 7750, capacity: 2 }
    ];

    for (const r of sampleRooms) {
      const existingRoom = await Room.findOne({
        where: { block_number: r.block, room_number: r.room, hostel_id: hostel.id }
      });
      if (!existingRoom) {
        await Room.create({
          block_number: r.block,
          floor_number: r.floor,
          room_number: r.room,
          room_type: r.type,
          ac_status: r.ac,
          capacity: r.capacity,
          base_rent: r.rent,
          status: (r.block === "1" && r.room === "101") ? "OCCUPIED" : "AVAILABLE",
          electricity_meter_number: `M-${r.block}-${r.room}`,
          hostel_id: hostel.id
        });
      }
    }
    console.log("✓ Sample Rooms verified and populated.");

    // 6. Ensure Electricity Meters
    for (const r of sampleRooms) {
      const meterNum = `M-${r.block}-${r.room}`;
      const existingMeter = await ElectricityMeter.findOne({ where: { meter_number: meterNum } });
      if (!existingMeter) {
        await ElectricityMeter.create({
          meter_number: meterNum,
          block_number: r.block,
          floor_number: r.floor,
          room_number: r.room,
          current_reading: 120.00,
          previous_reading: 100.00,
          units_consumed: 20.00,
          rate_per_unit: 14.00,
          monthly_charge: 280.00,
          last_reading_date: new Date(),
          status: "ACTIVE"
        });
      }
    }
    console.log("✓ Electricity meters verified and populated.");

    // 7. Ensure Default Circular
    const circularCount = await Circular.count();
    if (circularCount === 0) {
      await Circular.create({
        title: "Welcome to Hostel Management Portal",
        message: "Welcome all residents! Please ensure all maintenance requests and food confirmations are submitted via the portal before 8:00 PM daily.",
        sentVia: "EMAIL",
        status: "SENT",
        hostel_id: hostel.id
      });
      console.log("✓ Welcome circular created.");
    }

    // 8. Ensure Sample Food Menus
    const today = new Date().toISOString().split("T")[0];
    const existingMenuCount = await FoodMenu.count({ where: { hostel_id: hostel.id } });
    if (existingMenuCount === 0) {
      await FoodMenu.bulkCreate([
        {
          menu_date: today,
          meal_type: "BREAKFAST",
          item_name: "Idli, Vada, Sambar & Chutney",
          description: "Fresh hot south Indian breakfast with filter coffee",
          is_veg: true,
          is_available: true,
          hostel_id: hostel.id
        },
        {
          menu_date: today,
          meal_type: "LUNCH",
          item_name: "Steamed Rice, Dal Tadka, Paneer Butter Masala",
          description: "Full meal with curd, pickle, papad and salad",
          is_veg: true,
          is_available: true,
          hostel_id: hostel.id
        },
        {
          menu_date: today,
          meal_type: "DINNER",
          item_name: "Phulka Roti, Mixed Vegetable Curry, Jeera Rice",
          description: "Nutritious dinner with sweet gulab jamun",
          is_veg: true,
          is_available: true,
          hostel_id: hostel.id
        }
      ]);
      console.log("✓ Food menu schedule populated.");
    }

    console.log("\n=======================================================");
    console.log("  SEEDING COMPLETE! READY TO LOGIN:");
    console.log("  Admin:      admin@hostel.com      | admin123");
    console.log("  SuperAdmin: superadmin@hostel.com | superadmin123");
    console.log("  Resident:   user@hostel.com       | user1234");
    console.log("=======================================================\n");
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    process.exit(1);
  }
};

export const status = async () => {
  try {
    await sequelize.authenticate();
    console.log("✓ Database Connection: HEALTHY\n");

    const counts = [
      { Model: "Hostels", Count: await Hostel.count() },
      { Model: "Users (Total)", Count: await User.count() },
      { Model: "Active Residents", Count: await User.count({ where: { role: "USER", status: "ACTIVE" } }) },
      { Model: "Rooms", Count: await Room.count() },
      { Model: "Electricity Meters", Count: await ElectricityMeter.count() },
      { Model: "Payments", Count: await Payment.count() },
      { Model: "Complaints", Count: await Complaint.count() },
      { Model: "Circulars", Count: await Circular.count() },
      { Model: "Food Menus", Count: await FoodMenu.count() }
    ];

    console.table(counts);
  } catch (err) {
    console.error("❌ Status check failed:", err.message);
    process.exit(1);
  }
};

export const reset = async () => {
  try {
    await sequelize.authenticate();
    console.log("⚠️ Resetting database tables...");
    // Clear rows safely
    await FoodConfirmation.destroy({ where: {} }).catch(() => {});
    await FoodMenu.destroy({ where: {} }).catch(() => {});
    await Circular.destroy({ where: {} }).catch(() => {});
    await Complaint.destroy({ where: {} }).catch(() => {});
    await Payment.destroy({ where: {} }).catch(() => {});
    await ElectricityMeter.destroy({ where: {} }).catch(() => {});
    await Room.destroy({ where: {} }).catch(() => {});
    await User.destroy({ where: {} }).catch(() => {});
    await SuperAdmin.destroy({ where: {} }).catch(() => {});
    await Hostel.destroy({ where: {} }).catch(() => {});
    console.log("✓ Data reset complete. Now reseeding...");
    await seed();
  } catch (err) {
    console.error("❌ Reset failed:", err.message);
    process.exit(1);
  }
};

// CLI Command Dispatcher
const command = process.argv[2] || "up";

const main = async () => {
  switch (command.toLowerCase()) {
    case "up":
    case "migrate":
      await up();
      break;
    case "seed":
      await seed();
      break;
    case "all":
    case "setup":
      await up();
      await seed();
      break;
    case "status":
      await status();
      break;
    case "reset":
      await reset();
      break;
    default:
      console.log(`Unknown command: ${command}`);
      console.log("Available commands: up, seed, setup, status, reset");
      process.exit(1);
  }
  process.exit(0);
};

main();
