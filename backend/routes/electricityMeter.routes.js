// routes/electricityMeter.routes.js
import express from "express";
import { protect, isAdmin } from "../middlewares/auth.middleware.js";
import {
  getMetersByBlock,
  getMeterDetails,
  recordMeterReading,
  deleteMeterReading,
  deleteMeter,
  resetMeter,
  createMeter,
  getConsumptionReport
} from "../Controllers/electricityMeterController.js";

const router = express.Router();

// Debug: Log all requests to this router
router.use((req, res, next) => {
  console.log(`[ElectricityMeter Route] ${req.method} ${req.path}`);
  next();
});

// Create new meter (admin only) - POST before GET for general routes
router.post("/", protect, isAdmin, createMeter);

// More specific routes FIRST
// Get all meters by block
router.get("/block/:blockNumber", protect, getMetersByBlock);

// Get consumption report (admin only)
router.get("/report/:blockNumber", protect, isAdmin, getConsumptionReport);

// Record meter reading (admin only)
router.put("/:meterId/reading", protect, isAdmin, recordMeterReading);

// Delete meter reading data (admin only)
router.delete("/:meterId/reading", protect, isAdmin, deleteMeterReading);

// Reset meter (admin only) - clear all readings
router.post("/:meterId/reset", protect, isAdmin, resetMeter);

// Delete entire meter (admin only) - before GET /:meterId
router.delete("/:meterId", protect, isAdmin, deleteMeter);

// Get specific meter details - GENERAL routes LAST
router.get("/:meterId", protect, getMeterDetails);

export default router;
