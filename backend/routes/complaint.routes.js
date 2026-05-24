import express from "express";
import { protect, isAdmin } from "../middlewares/auth.middleware.js";
import { 
  addComplaint, 
  getComplaints,
  updateComplaintStatus,
  deleteComplaint
} from "../Controllers/complaint.controller.js";

const router = express.Router();

router.post("/", protect, addComplaint);
router.get("/", protect, getComplaints);
router.put("/:id/status", protect, isAdmin, updateComplaintStatus);
router.delete("/:id", protect, isAdmin, deleteComplaint);

export default router;