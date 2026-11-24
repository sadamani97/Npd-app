// middleware/auth.middleware.js
import { verifyToken } from "../utils/jwt.js";
import { User } from "../models/user.model.js";
import { Hostel } from "../models/hostel.model.js";
import { errorResponse } from "../utils/response.js";

export const protect = async (req, res, next) => {
  const authHeader = req?.headers?.authorization;

  if (!authHeader) {
    return errorResponse(res, "No authorization token provided", 401);
  }

  try {
    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) {
      return errorResponse(res, "Invalid authorization format. Must be Bearer <token>", 401);
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return errorResponse(res, "Invalid or expired token", 401);
    }

    req.user = decoded;

    // Recover missing hostel assignment for authenticated users if token was issued without it
    if (req.user?.role !== "SUPER_ADMIN" && !req.user?.hostel_id && req.user?.id) {
      const dbUser = await User.findByPk(req.user.id);
      if (dbUser) {
        if (dbUser.hostel_id) {
          req.user.hostel_id = dbUser.hostel_id;
        } else {
          const firstHostel = await Hostel.findOne();
          if (firstHostel) {
            dbUser.hostel_id = firstHostel.id;
            await dbUser.save().catch(() => {});
            req.user.hostel_id = firstHostel.id;
          }
        }
      }
    }

    next();
  } catch (err) {
    return errorResponse(res, "Authentication failed: " + (err?.message || "Invalid token"), 401);
  }
};

export const authMiddleware = protect;

export const isAdmin = (req, res, next) => {
  const role = req?.user?.role;
  if (role === "ADMIN" || role === "HOSTEL_ADMIN" || role === "SUPER_ADMIN") {
    return next();
  }
  return errorResponse(res, "Access denied. Admin rights required", 403);
};

export const isHostelAdmin = (req, res, next) => {
  const role = req?.user?.role;
  if (role !== "HOSTEL_ADMIN" && role !== "ADMIN") {
    return errorResponse(res, "Access denied. Hostel Admin rights required", 403);
  }
  next();
};

export const isSuperAdmin = (req, res, next) => {
  const role = req?.user?.role;
  if (role !== "SUPER_ADMIN") {
    return errorResponse(res, "Access denied. Super Admin rights required", 403);
  }
  next();
};

export const isUser = (req, res, next) => {
  const role = req?.user?.role;
  if (role !== "USER") {
    return errorResponse(res, "Access denied. User rights required", 403);
  }
  next();
};
