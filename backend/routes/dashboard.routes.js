// routes/dashboard.routes.js
import express from "express";
import { 
  getDashboardStats, 
  getBlockSummary, 
  getRoomOccupancySummary 
} from "../Controllers/dashboardController.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/stats", protect, getDashboardStats);
router.get("/block/:blockNumber", protect, getBlockSummary);
router.get("/rooms/occupancy-summary", protect, getRoomOccupancySummary);

export default router;
