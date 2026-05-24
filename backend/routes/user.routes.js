import express from "express";
import multer from "multer";
import { protect, isAdmin } from "../middlewares/auth.middleware.js";
import { 
  addUser, 
  getUsers, 
  getUserById,
  getVacatedUsers,
  vacateUser,
  updateUser,
  deleteUser
} from "../Controllers/ResidentController.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Admin routes
router.post("/", protect, isAdmin, upload.any(), addUser);
router.get("/", protect, isAdmin, getUsers);
router.get("/vacated", protect, isAdmin, getVacatedUsers);
router.put("/vacate/:id", protect, isAdmin, vacateUser);
router.delete("/:id", protect, isAdmin, deleteUser);

// User routes (can get their own profile and update their own profile)
router.get("/:id", protect, getUserById);
router.put("/:id", protect, upload.any(), updateUser);

export default router;