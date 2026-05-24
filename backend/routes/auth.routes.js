// routes/auth.routes.js
import express from "express";
import { login, register, requestOTP, verifyOTP, logout } from "../Controllers/authController.js";

const router = express.Router();

// Legacy auth (for admin)
router.post("/register", register);
router.post("/login", login);

// OTP-based auth (for users)
router.post("/request-otp", requestOTP);
router.post("/verify-otp", verifyOTP);
router.post("/logout", logout);

export default router;