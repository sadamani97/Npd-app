// controllers/foodMenu.controller.js
import { FoodMenu } from "../models/foodMenu.model.js";
import { User } from "../models/user.model.js";

export const addFoodMenu = async (req, res) => {
  try {
    const { menu_date, meal_type, item_name, description, is_veg, is_available } = req.body;
    const userId = req.user.id;

    // Validate that user is admin
    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Only admin can add food menu" });
    }

    if (!menu_date || !meal_type || !item_name) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const foodMenu = await FoodMenu.create({
      menu_date,
      meal_type,
      item_name,
      description,
      is_veg: is_veg !== undefined ? is_veg : true,
      is_available: is_available !== undefined ? is_available : true,
      created_by: userId
    });

    res.status(201).json({
      success: true,
      message: "Food menu added successfully",
      data: foodMenu
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getFoodMenuByDate = async (req, res) => {
  try {
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: "Date is required" });
    }

    const foodMenus = await FoodMenu.findAll({
      where: { menu_date: date, is_available: true },
      attributes: ["id", "menu_date", "meal_type", "item_name", "description", "is_veg", "is_available"],
      order: [["meal_type", "ASC"]]
    });

    res.json({ success: true, data: foodMenus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const getAllFoodMenus = async (req, res) => {
  try {
    const { date } = req.query;
    const where = {};

    if (date) {
      where.menu_date = date;
    }

    const foodMenus = await FoodMenu.findAll({
      where,
      attributes: ["id", "menu_date", "meal_type", "item_name", "description", "is_veg", "is_available", "created_by", "createdAt"],
      order: [["menu_date", "DESC"], ["meal_type", "ASC"]]
    });

    res.json({ success: true, data: foodMenus });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const updateFoodMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { menu_date, meal_type, item_name, description, is_veg, is_available } = req.body;

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Only admin can update food menu" });
    }

    const foodMenu = await FoodMenu.findByPk(id);
    if (!foodMenu) {
      return res.status(404).json({ success: false, message: "Food menu not found" });
    }

    await foodMenu.update({
      menu_date: menu_date || foodMenu.menu_date,
      meal_type: meal_type || foodMenu.meal_type,
      item_name: item_name || foodMenu.item_name,
      description: description !== undefined ? description : foodMenu.description,
      is_veg: is_veg !== undefined ? is_veg : foodMenu.is_veg,
      is_available: is_available !== undefined ? is_available : foodMenu.is_available
    });

    res.json({ success: true, message: "Food menu updated", data: foodMenu });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

export const deleteFoodMenu = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.user.role !== "ADMIN") {
      return res.status(403).json({ success: false, message: "Only admin can delete food menu" });
    }

    const foodMenu = await FoodMenu.findByPk(id);
    if (!foodMenu) {
      return res.status(404).json({ success: false, message: "Food menu not found" });
    }

    await foodMenu.destroy();

    res.json({ success: true, message: "Food menu deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
