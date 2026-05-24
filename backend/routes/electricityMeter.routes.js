// routes/electricityMeter.routes.js
import express from "express";
import { protect, isAdmin } from "../middlewares/auth.middleware.js";
import {
  getMetersByBlock,
  getMeterDetails,
  recordMeterReading,
  createMeter,
  getConsumptionReport
} from "../Controllers/electricityMeterController.js";

const router = express.Router();

// Get all meters by block
router.get("/block/:blockNumber", protect, getMetersByBlock);

// Get consumption report (admin only)
router.get("/report/:blockNumber", protect, isAdmin, getConsumptionReport);

// Get specific meter details
router.get("/:meterId", protect, getMeterDetails);

// Create new meter (admin only)
router.post("/", protect, isAdmin, createMeter);

// Record meter reading (admin only)
router.put("/:meterId/reading", protect, isAdmin, recordMeterReading);

export default router;
