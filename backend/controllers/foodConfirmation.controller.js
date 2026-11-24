// controllers/foodConfirmation.controller.js
import { FoodConfirmation } from "../models/foodConfirmation.model.js";
import { User } from "../models/user.model.js";
import { getHostelFilter } from "../middlewares/hostelIsolation.middleware.js";

export const submitFoodConfirmation = async (req, res) => {
  try {
    const { confirmation_date, breakfast, lunch, dinner, notes } = req.body;
    const userId = req.user.id;

    if (!confirmation_date) {
      return res.status(400).json({ success: false, message: "Confirmation date is required" });
    }

    // At least one meal must be selected
    const anyMealSelected = breakfast || lunch || dinner;
    if (!anyMealSelected) {
      return res.status(400).json({ success: false, message: "Please select at least one meal" });
    }

    // Check if user already submitted for this date
    let confirmation = await FoodConfirmation.findOne({
      where: { user_id: userId, confirmation_date }
    });

    if (confirmation) {
      // Update existing confirmation
      await confirmation.update({
        breakfast: breakfast || false,
        lunch: lunch || false,
        dinner: dinner || false,
        is_confirmed: true,
        notes: notes || null,
        confirmed_at: new Date()
      });
    } else {
      // Create new confirmation
      confirmation = await FoodConfirmation.create({
        user_id: userId,
        confirmation_date,
        breakfast: breakfast || false,
        lunch: lunch || false,
        dinner: dinner || false,
        is_confirmed: true,
        notes: notes || null,
        confirmed_at: new Date()
        ,hostel_id: req.user.hostel_id || null
      });
    }

    res.status(201).json({
      success: true,
      message: "Food confirmation submitted successfully",
      data: confirmation
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const cancelFoodConfirmation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { confirmation_date } = req.body;

    if (!confirmation_date) {
      return res.status(400).json({ success: false, message: "Confirmation date is required" });
    }

    const confirmation = await FoodConfirmation.findOne({
      where: { user_id: userId, confirmation_date }
    });

    if (!confirmation) {
      return res.status(404).json({ success: false, message: "Confirmation not found" });
    }

    await confirmation.update({
      breakfast: false,
      lunch: false,
      dinner: false,
      is_confirmed: false,
      confirmed_at: null
    });

    res.json({
      success: true,
      message: "Food confirmation cancelled",
      data: confirmation
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getUserFoodConfirmation = async (req, res) => {
  try {
    const userId = req.user.id;
    const { confirmation_date } = req.query;

    if (!confirmation_date) {
      return res.status(400).json({ success: false, message: "Confirmation date is required" });
    }

    const confirmation = await FoodConfirmation.findOne({
      where: { user_id: userId, confirmation_date },
      attributes: ["id", "user_id", "confirmation_date", "breakfast", "lunch", "dinner", "is_confirmed", "notes", "confirmed_at"]
    });

    res.json({ success: true, data: confirmation || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getFoodConfirmationsByDate = async (req, res) => {
  try {
    const { confirmation_date, block_number, meal_type } = req.query;

    if (req.user.role !== "ADMIN" && req.user.role !== "HOSTEL_ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ success: false, message: "Only admin can view all confirmations" });
    }

    if (!confirmation_date) {
      return res.status(400).json({ success: false, message: "Confirmation date is required" });
    }

    let where = { confirmation_date, is_confirmed: true };
    if (req.user.role !== "SUPER_ADMIN") {
      Object.assign(where, getHostelFilter(req.user));
    }

    // Build query to find users with selected meals
    if (meal_type) {
      const validMeals = ["breakfast", "lunch", "dinner"];
      if (!validMeals.includes(meal_type.toLowerCase())) {
        return res.status(400).json({ success: false, message: "Invalid meal type" });
      }
    }

    const confirmations = await FoodConfirmation.findAll({
      where,
      attributes: ["id", "user_id", "confirmation_date", "breakfast", "lunch", "dinner", "is_confirmed", "confirmed_at"],
      include: [
        {
          association: "user",
          attributes: ["id", "name", "phone", "block_number", "room_number"],
          required: true
        }
      ]
    });

    // Filter by block if needed
    let filtered = confirmations;
    if (block_number) {
      filtered = confirmations.filter(c => c.User.block_number === block_number);
    }

    // Filter by meal type if needed
    if (meal_type) {
      const mealField = meal_type.toLowerCase();
      filtered = filtered.filter(c => c[mealField] === true);
    }

    res.json({
      success: true,
      data: filtered,
      count: filtered.length
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getFoodConfirmationList = async (req, res) => {
  try {
    const { confirmation_date, is_confirmed } = req.query;

    if (req.user.role !== "ADMIN" && req.user.role !== "HOSTEL_ADMIN" && req.user.role !== "SUPER_ADMIN") {
      return res.status(403).json({ success: false, message: "Only admin can view confirmations" });
    }

    const whereClause = {};
    if (confirmation_date) whereClause.confirmation_date = confirmation_date;
    if (is_confirmed !== undefined) whereClause.is_confirmed = is_confirmed === "true";
    if (req.user.role !== "SUPER_ADMIN") {
      Object.assign(whereClause, getHostelFilter(req.user));
    }

    const confirmations = await FoodConfirmation.findAll({
      where: whereClause,
      include: [{ model: User, attributes: ["id", "name", "email", "phone", "block_number", "room_number"] }],
      order: [["confirmation_date", "DESC"], ["user_id", "ASC"]]
    });

    res.json({ success: true, data: confirmations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getUserConfirmationHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 30 } = req.query;

    const confirmations = await FoodConfirmation.findAll({
      where: { user_id: userId },
      attributes: ["id", "confirmation_date", "is_confirmed", "notes", "confirmed_at"],
      order: [["confirmation_date", "DESC"]],
      limit: parseInt(limit)
    });

    res.json({ success: true, data: confirmations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
