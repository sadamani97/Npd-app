// routes/foodConfirmation.routes.js
import express from "express";
import * as foodConfirmationController from "../controllers/foodConfirmation.controller.js";
import { protect, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// User: Submit food confirmation
router.post("/", protect, foodConfirmationController.submitFoodConfirmation);

// User: Cancel food confirmation
router.post("/cancel", protect, foodConfirmationController.cancelFoodConfirmation);

// User: Get their confirmation for a specific date
router.get("/user/date", protect, foodConfirmationController.getUserFoodConfirmation);

// User: Get their confirmation history
router.get("/user/history", protect, foodConfirmationController.getUserConfirmationHistory);

// Admin: Get confirmations by date (with filters)
router.get("/admin/by-date", protect, isAdmin, foodConfirmationController.getFoodConfirmationsByDate);

// Admin: Get all confirmations (with filtering)
router.get("/admin/list", protect, isAdmin, foodConfirmationController.getFoodConfirmationList);

export default router;
