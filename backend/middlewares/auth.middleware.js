// middleware/auth.middleware.js
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ success: false, msg: "No token provided" });
  }

  try {
    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({ success: false, msg: "Invalid authorization format" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");
    req.user = decoded;

    // Recover missing hostel assignment for authenticated users if token was issued without it.
    if (req.user.role !== "SUPER_ADMIN" && !req.user.hostel_id && req.user.id) {
      const dbUser = await User.findByPk(req.user.id, {
        attributes: ["hostel_id"]
      });
      if (dbUser) {
        req.user.hostel_id = dbUser.hostel_id;
      }
    }

    next();
  } catch (err) {
    res.status(401).json({ success: false, msg: "Invalid token" });
  }
};

export const authMiddleware = protect;

export const isAdmin = (req, res, next) => {
  if (req.user.role === "ADMIN" || req.user.role === "HOSTEL_ADMIN" || req.user.role === "SUPER_ADMIN") {
    return next();
  }
  return res.status(403).json({
    success: false,
    msg: "Access denied. Admin rights required"
  });
};

export const isHostelAdmin = (req, res, next) => {
  if (req.user.role !== "HOSTEL_ADMIN" && req.user.role !== "ADMIN") {
    return res.status(403).json({
      success: false,
      msg: "Access denied. Hostel Admin rights required"
    });
  }
  next();
};

export const isSuperAdmin = (req, res, next) => {
  if (req.user.role !== "SUPER_ADMIN") {
    return res.status(403).json({
      success: false,
      msg: "Access denied. Super Admin rights required"
    });
  }
  next();
};

export const isUser = (req, res, next) => {
  if (req.user.role !== "USER") {
    return res.status(403).json({
      success: false,
      msg: "Access denied. User rights required"
    });
  }
  next();
};