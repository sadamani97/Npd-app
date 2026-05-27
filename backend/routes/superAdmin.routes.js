import express from "express";
import { protect } from "../middlewares/auth.middleware.js";
import { requireSuperAdmin } from "../middlewares/roleAuth.middleware.js";
import {
  getDashboardStats,
  getAllHostels,
  getHostelDetails,
  registerHostel,
  approveHostel,
  getHostelAnalytics,
  getPaymentAnalytics,
  getComplaintAnalytics,
  getResidentStats
} from "../Controllers/superAdminController.js";

const router = express.Router();

// Super admin dashboard and hostel management
router.get("/dashboard/stats", protect, requireSuperAdmin, getDashboardStats);
router.get("/hostels", protect, requireSuperAdmin, getAllHostels);
router.post("/hostels", protect, requireSuperAdmin, registerHostel);
router.put("/hostels/:hostelId/approve", protect, requireSuperAdmin, approveHostel);
router.get("/hostels/:hostelId", protect, requireSuperAdmin, getHostelDetails);
router.get("/hostels/:hostelId/analytics", protect, requireSuperAdmin, getHostelAnalytics);
router.get("/analytics/payments", protect, requireSuperAdmin, getPaymentAnalytics);
router.get("/analytics/complaints", protect, requireSuperAdmin, getComplaintAnalytics);
router.get("/analytics/residents", protect, requireSuperAdmin, getResidentStats);

export default router;
