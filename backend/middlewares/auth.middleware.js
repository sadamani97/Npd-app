// middleware/auth.middleware.js
import jwt from "jsonwebtoken";

export const protect = (req, res, next) => {
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
    next();
  } catch (err) {
    res.status(401).json({ success: false, msg: "Invalid token" });
  }
};

export const authMiddleware = protect;

export const isAdmin = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ 
      success: false, 
      msg: "Access denied. Admin rights required" 
    });
  }
  next();
};