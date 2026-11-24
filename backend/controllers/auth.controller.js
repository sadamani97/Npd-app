import bcrypt from "bcryptjs";
import { Op } from "sequelize";
import { User } from "../models/user.model.js";
import { SuperAdmin } from "../models/superAdmin.model.js";
import { Hostel } from "../models/hostel.model.js";
import { signToken } from "../utils/jwt.js";
import { successResponse, errorResponse } from "../utils/response.js";

/**
 * Get current authenticated user profile directly from TiDB database
 */
export const getMe = async (req, res) => {
  try {
    const role = req?.user?.role;
    const userId = req?.user?.id;

    if (!userId) {
      return errorResponse(res, "Invalid session token", 401);
    }

    if (role === "SUPER_ADMIN") {
      const superAdmin = await SuperAdmin.findByPk(userId, {
        attributes: { exclude: ["password"] }
      });
      if (!superAdmin) {
        return errorResponse(res, "SuperAdmin profile not found", 404);
      }
      return successResponse(res, "Profile retrieved", superAdmin);
    }

    const user = await User.findByPk(userId, {
      attributes: { exclude: ["password"] }
    });
    if (!user) {
      return errorResponse(res, "User profile not found", 404);
    }

    return successResponse(res, "Profile retrieved", user);
  } catch (err) {
    console.error("Error in getMe:", err);
    return errorResponse(res, err?.message || "Failed to fetch user profile", 500);
  }
};

/**
 * Register a new user
 */
export const register = async (req, res) => {
  try {
    const { name, email, password, phone } = req?.body || {};

    if (!name || !email || !password) {
      return errorResponse(res, "Name, email, and password are required", 400);
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      where: {
        [Op.or]: [
          { email: email?.trim()?.toLowerCase() },
          ...(phone ? [{ phone: phone?.trim() }] : [])
        ]
      }
    });

    if (existingUser) {
      return errorResponse(res, "User with this email or phone already exists", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name?.trim(),
      email: email?.trim()?.toLowerCase(),
      phone: phone?.trim() || null,
      password: hashedPassword,
      role: "USER",
      status: "ACTIVE"
    });

    return successResponse(
      res,
      "Registered successfully",
      { id: user.id, name: user.name, email: user.email, role: user.role },
      201
    );
  } catch (err) {
    console.error("Registration error:", err);
    return errorResponse(res, err?.message || "Registration failed", 500);
  }
};

/**
 * Standard User & Admin Login
 */
export const login = async (req, res) => {
  try {
    const { email, password } = req?.body || {};

    // Validate input
    if (!email || !password) {
      return errorResponse(res, "Email or phone number and password are required", 400);
    }

    const cleanIdentifier = String(email).trim().toLowerCase();

    // Check if this is the superadmin logging in via standard endpoint
    if (cleanIdentifier === "superadmin@hostel.com") {
      return superAdminLogin(req, res);
    }

    const user = await User.findOne({
      where: {
        [Op.or]: [
          { email: cleanIdentifier },
          { phone: String(email).trim() }
        ]
      }
    });

    if (!user) {
      return errorResponse(res, "Account not found with this email or phone", 404);
    }

    const isMatch = await bcrypt.compare(password, user?.password || "");

    if (!isMatch) {
      return errorResponse(res, "Invalid password credentials", 400);
    }

    // Generate JWT token
    const token = signToken({
      id: user.id,
      role: user.role,
      email: user.email,
      hostel_id: user.hostel_id
    });

    const userData = {
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
    };

    return res.status(200).json({
      success: true,
      message: "Login successful",
      msg: "Login successful",
      token,
      user: userData
    });
  } catch (err) {
    console.error("Login error:", err);
    return errorResponse(res, err?.message || "Login failed", 500);
  }
};

/**
 * Logout
 */
export const logout = async (req, res) => {
  try {
    return successResponse(res, "Logged out successfully");
  } catch (err) {
    return errorResponse(res, err?.message || "Logout failed", 500);
  }
};

/**
 * SuperAdmin Login
 */
export const superAdminLogin = async (req, res) => {
  try {
    const { email, password } = req?.body || {};

    if (!email || !password) {
      return errorResponse(res, "Email or phone number and password are required", 400);
    }

    const cleanIdentifier = String(email).trim().toLowerCase();

    // Find SuperAdmin by email or phone
    const superAdmin = await SuperAdmin.findOne({
      where: {
        [Op.or]: [
          { email: cleanIdentifier },
          { phone: String(email).trim() }
        ]
      }
    });

    if (!superAdmin) {
      return errorResponse(res, "SuperAdmin account not found", 404);
    }

    // Check if account is active
    if (!superAdmin.is_active) {
      return errorResponse(res, "This SuperAdmin account has been deactivated", 403);
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, superAdmin?.password || "");

    if (!isMatch) {
      return errorResponse(res, "Invalid password credentials", 400);
    }

    // Update last login timestamp safely
    await superAdmin.update({ last_login: new Date() }).catch(() => {});

    // Generate JWT token
    const token = signToken({
      id: superAdmin.id,
      email: superAdmin.email,
      role: "SUPER_ADMIN",
      type: "super_admin"
    });

    return res.status(200).json({
      success: true,
      message: "SuperAdmin login successful",
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
    return errorResponse(res, err?.message || "SuperAdmin login failed", 500);
  }
};

/**
 * Create Hostel Admin Account
 */
export const createHostelAdmin = async (req, res) => {
  try {
    const { name, email, password, phone, hostel_id } = req?.body || {};

    if (!name || !email || !password || !hostel_id) {
      return errorResponse(res, "Name, email, password, and hostel_id are required", 400);
    }

    // Check if the hostel exists
    const hostel = await Hostel.findByPk(hostel_id);
    if (!hostel) {
      return errorResponse(res, "Hostel not found with the provided hostel_id", 404);
    }

    // Check if user already exists
    const existingUser = await User.findOne({ where: { email: email?.trim()?.toLowerCase() } });
    if (existingUser) {
      return errorResponse(res, "Email already in use", 400);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      name: name?.trim(),
      email: email?.trim()?.toLowerCase(),
      password: hashedPassword,
      phone: phone?.trim() || null,
      role: "HOSTEL_ADMIN",
      hostel_id,
      is_hostel_admin: true,
      is_phone_verified: true,
      status: "ACTIVE"
    });

    return successResponse(
      res,
      "Hostel admin created successfully",
      {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
        hostel_id: admin.hostel_id
      },
      201
    );
  } catch (err) {
    console.error("Error creating hostel admin:", err);
    return errorResponse(res, err?.message || "Failed to create hostel admin", 500);
  }
};
