// routes/dashboard.routes.js
import express from "express";
import { 
  getDashboardStats, 
  getBlockSummary, 
  getRoomOccupancySummary,
  getIndividualRoomOccupancy
} from "../controllers/dashboard.controller.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/stats", protect, getDashboardStats);
router.get("/block/:blockNumber", protect, getBlockSummary);
router.get("/rooms", protect, getRoomOccupancySummary);
router.get("/rooms/:roomNumber", protect, getIndividualRoomOccupancy);

export default router;
