// routes/auth.routes.js
import express from "express";
import { login, register, logout, superAdminLogin, createHostelAdmin, getMe } from "../controllers/auth.controller.js";
import { protect } from "../middlewares/auth.middleware.js";
import { requireSuperAdmin } from "../middlewares/roleAuth.middleware.js";

const router = express.Router();

router.get("/me", protect, getMe);
router.post("/register", register);
router.post("/login", login);
router.post("/super-admin/login", superAdminLogin);
router.post("/hostel-admin", protect, requireSuperAdmin, createHostelAdmin);
router.post("/logout", logout);

export default router;