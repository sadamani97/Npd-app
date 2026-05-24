// routes/payment.routes.js
import express from "express";
import { protect, isAdmin } from "../middlewares/auth.middleware.js";
import {
  getResidentPaymentHistory,
  getCurrentMonthPaymentStatus,
  recordPayment,
  getOverduePayments,
  getMonthlyPaymentSummary,
  updatePaymentStatus
} from "../Controllers/paymentController.js";

const router = express.Router();

// Get overdue payments (admin only) - must come before /:paymentId
router.get("/overdue/list", protect, isAdmin, getOverduePayments);

// Get monthly payment summary (admin only) - must come before /:paymentId
router.get("/summary/monthly", protect, isAdmin, getMonthlyPaymentSummary);

// Get current month payment status (admin only) - must come before /:paymentId
router.get("/status/current-month", protect, isAdmin, getCurrentMonthPaymentStatus);

// Get payment history for a resident - must come before /:paymentId
router.get("/history/:userId", protect, getResidentPaymentHistory);

// Record a payment (admin only)
router.post("/", protect, isAdmin, recordPayment);

// Update payment status (admin only)
router.put("/:paymentId", protect, isAdmin, updatePaymentStatus);

export default router;
