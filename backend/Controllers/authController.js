import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { OtpVerification } from "../models/otpVerification.model.js";
import { generateOTP, sendOTPviaSMS, sendOTPviaWhatsApp } from "../utils/otpapi.js";

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
        msg: "Email and password are required" 
      });
    }

    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ success: false, msg: "Wrong password" });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "7d" }
    );

    res.json({ 
      success: true, 
      msg: "Login successful", 
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ success: false, msg: err.message });
  }
};

/**
 * Request OTP - Send OTP to phone number
 */
export const requestOTP = async (req, res) => {
  try {
    const { phone_number } = req.body;

    // Validate input
    if (!phone_number) {
      return res.status(400).json({ 
        success: false, 
        msg: "Phone number is required" 
      });
    }

    // Normalize phone number
    const normalizedPhone = phone_number.replace(/\D/g, "");
    if (normalizedPhone.length < 10) {
      return res.status(400).json({ 
        success: false, 
        msg: "Invalid phone number format" 
      });
    }

    // Generate OTP
    const otp = generateOTP();
    
    // Calculate expiration time (10 minutes)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Store OTP in database
    await OtpVerification.destroy({ where: { phone_number: normalizedPhone, is_verified: false } });
    
    const otpRecord = await OtpVerification.create({
      phone_number: normalizedPhone,
      otp,
      expires_at: expiresAt
    });

    // Send OTP via WhatsApp (preferred) or SMS
    const result = await sendOTPviaWhatsApp(normalizedPhone, otp);
    
    if (!result.success && result.mode !== "DEMO") {
      // Fallback to SMS
      const smsResult = await sendOTPviaSMS(normalizedPhone, otp);
      if (!smsResult.success) {
        return res.status(500).json({ 
          success: false, 
          msg: "Failed to send OTP. Please try again." 
        });
      }
    }

    res.json({ 
      success: true, 
      msg: "OTP sent successfully",
      channel: result.mode || "DEMO",
      phone: normalizedPhone,
      data: {
        otp_id: otpRecord.id,
        expires_in_minutes: 10
      }
    });
  } catch (err) {
    console.error("Error requesting OTP:", err);
    res.status(500).json({ success: false, msg: err.message });
  }
};

/**
 * Verify OTP and Login
 */
export const verifyOTP = async (req, res) => {
  try {
    const { phone_number, otp } = req.body;

    // Validate input
    if (!phone_number || !otp) {
      return res.status(400).json({ 
        success: false, 
        msg: "Phone number and OTP are required" 
      });
    }

    const normalizedPhone = phone_number.replace(/\D/g, "");

    // Find OTP record
    const otpRecord = await OtpVerification.findOne({
      where: { phone_number: normalizedPhone, is_verified: false }
    });

    if (!otpRecord) {
      return res.status(400).json({ 
        success: false, 
        msg: "OTP not found or already verified" 
      });
    }

    // Check if OTP is expired
    if (new Date() > otpRecord.expires_at) {
      return res.status(400).json({ 
        success: false, 
        msg: "OTP has expired. Please request a new one." 
      });
    }

    // Check attempts
    if (otpRecord.attempts >= 5) {
      return res.status(400).json({ 
        success: false, 
        msg: "Too many failed attempts. Please request a new OTP." 
      });
    }

    // Verify OTP
    if (otpRecord.otp !== otp) {
      await otpRecord.increment('attempts');
      return res.status(400).json({ 
        success: false, 
        msg: "Invalid OTP" 
      });
    }

    // Mark OTP as verified
    await otpRecord.update({
      is_verified: true,
      verified_at: new Date()
    });

    // Find or create user
    let user = await User.findOne({ where: { phone: normalizedPhone } });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        msg: "User not found. Please contact admin to register." 
      });
    }

    // Update user's phone verification status
    await user.update({ is_phone_verified: true });

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role, phone: user.phone },
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
        phone: user.phone,
        block_number: user.block_number,
        floor_number: user.floor_number,
        room_number: user.room_number,
        room_type: user.room_type,
        role: user.role
      }
    });
  } catch (err) {
    console.error("Error verifying OTP:", err);
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