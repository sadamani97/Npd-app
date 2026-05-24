// routes/room.routes.js
import express from "express";
import { protect, isAdmin } from "../middlewares/auth.middleware.js";
import {
  getAllBlocks,
  getRoomsByBlock,
  getRoomDetails,
  createRoom,
  updateRoom,
  deleteRoom
} from "../Controllers/roomController.js";

const router = express.Router();

// Get all blocks
router.get("/blocks", protect, getAllBlocks);

// Create new room (admin only)
router.post("/", protect, isAdmin, createRoom);
router.put("/:roomId", protect, isAdmin, updateRoom);
router.delete("/:roomId", protect, isAdmin, deleteRoom);

// Get rooms by specific block - must come before /:blockNumber/:roomNumber
router.get("/block/:blockNumber", protect, getRoomsByBlock);

// Get specific room details - must come last
router.get("/:blockNumber/:roomNumber", protect, getRoomDetails);

export default router;
