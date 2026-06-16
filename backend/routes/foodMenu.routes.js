// routes/foodMenu.routes.js
import express from "express";
import * as foodMenuController from "../controllers/foodMenu.controller.js";
import { protect, isAdmin } from "../middlewares/auth.middleware.js";

const router = express.Router();

// Admin: Add food menu
router.post("/", protect, isAdmin, foodMenuController.addFoodMenu);

// Get food menu by date (for users to view menu)
router.get("/date", protect, foodMenuController.getFoodMenuByDate);

// Admin: Get all food menus
router.get("/", protect, isAdmin, foodMenuController.getAllFoodMenus);

// Admin: Update food menu
router.put("/:id", protect, isAdmin, foodMenuController.updateFoodMenu);

// Admin: Delete food menu
router.delete("/:id", protect, isAdmin, foodMenuController.deleteFoodMenu);

export default router;
