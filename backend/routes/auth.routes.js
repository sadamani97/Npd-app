// routes/auth.routes.js
import express from "express";
import { login, register, requestOTP, verifyOTP, logout, superAdminLogin, createHostelAdmin } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { requireSuperAdmin } from "../middlewares/roleAuth.middleware.js";

const router = express.Router();

// Legacy auth (for admin)
router.post("/register", register);
router.post("/login", login);
router.post("/super-admin/login", superAdminLogin);
router.post("/hostel-admin", protect, requireSuperAdmin, createHostelAdmin);

// OTP-based auth (for users)
router.post("/request-otp", requestOTP);
router.post("/verify-otp", verifyOTP);
router.post("/logout", logout);

export default router;