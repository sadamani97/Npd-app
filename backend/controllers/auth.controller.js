import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { Op } from "sequelize";
import { User } from "../models/user.model.js";
import { SuperAdmin } from "../models/superAdmin.model.js";
import { Hostel } from "../models/hostel.model.js";

/**
 * Legacy register - kept for admin only
 */
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, msg: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashed,
      role: "USER"
    });

    res.status(201).json({ 
      success: true, 
      msg: "Registered successfully", 
      data: { id: user.id, name: user.name, email: user.email } 
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

/**
 * Legacy login - kept for admin
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        msg: "Email or phone number and password are required" 
      });
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: email },
          { phone: email }
        ]
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, msg: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email, hostel_id: user.hostel_id },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    res.json({ 
      success: true, 
      msg: "Login successful", 
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        hostel_id: user.hostel_id,
        block_number: user.block_number,
        floor_number: user.floor_number,
        room_number: user.room_number,
        room_type: user.room_type,
        ac_status: user.ac_status,
        rent_amount: user.rent_amount,
        electricity_charges: user.electricity_charges,
        total_charges: user.total_charges,
        status: user.status
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};



/**
 * Logout
 */
export const logout = async (req, res) => {
  try {
    // Token invalidation would be handled on frontend by removing token
    res.json({
      success: true,
      msg: "Logged out successfully"
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

/**
 * SuperAdmin Login
 */
export const superAdminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        msg: "Email or phone number and password are required"
      });
    }

    // Find SuperAdmin by email or phone
    const superAdmin = await SuperAdmin.findOne({
      where: {
        [Op.or]: [
          { email: email },
          { phone: email }
        ]
      }
    });

    if (!superAdmin) {
      return res.status(404).json({
        success: false,
        msg: "SuperAdmin not found"
      });
    }

    // Check if account is active
    if (!superAdmin.is_active) {
      return res.status(403).json({
        success: false,
        msg: "This account has been deactivated"
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, superAdmin.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        msg: "Invalid password"
      });
    }

    // Update last login
    await superAdmin.update({ last_login: new Date() });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: superAdmin.id,
        email: superAdmin.email,
        role: "SUPER_ADMIN",
        type: "super_admin"
      },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      msg: "SuperAdmin login successful",
      token,
      user: {
        id: superAdmin.id,
        name: superAdmin.name,
        email: superAdmin.email,
        phone: superAdmin.phone,
        role: "SUPER_ADMIN"
      }
    });
  } catch (err) {
    console.error("SuperAdmin login error:", err);
    res.status(500).json({ success: false, msg: err.message });
  }
};

/**
 * Create Hostel Admin Account (called during hostel registration)
 */
export const createHostelAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, hostel_id } = req.body;

    // Validate required fields
    if (!name || !email || !password || !hostel_id) {
      return res.status(400).json({
        success: false,
        msg: "Name, email, password, and hostel_id are required"
      });
    }

    // Check if the hostel exists
    const hostel = await Hostel.findByPk(hostel_id);
    if (!hostel) {
      return res.status(404).json({
        success: false,
        msg: "Hostel not found with the provided hostel_id"
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        msg: "Email already in use"
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin user
    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      phone: phone || null,
      role: "HOSTEL_ADMIN",
      hostel_id,
      is_hostel_admin: true,
      is_phone_verified: true
    });

    res.status(201).json({
      success: true,
      msg: "Hostel admin created successfully",
      data: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        hostel_id: admin.hostel_id
      }
    });
  } catch (err) {
    console.error("Error creating hostel admin:", err);
    res.status(500).json({ success: false, msg: err.message });
  }
};