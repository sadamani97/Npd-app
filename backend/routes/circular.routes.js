import express from "express";
import { protect, isAdmin } from "../middlewares/auth.middleware.js";
import { 
  sendCircular, 
  getCirculars,
  deleteCircular
} from "../Controllers/circular.controller.js";

const router = express.Router();

router.post("/", protect, isAdmin, sendCircular);
router.get("/", protect, getCirculars);
router.delete("/:id", protect, isAdmin, deleteCircular);

export default router;
