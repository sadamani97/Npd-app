// app.js
import "dotenv/config";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import complaintRoutes from "./routes/complaint.routes.js";
import circularRoutes from "./routes/circular.routes.js";
import dashboardRoutes from "./routes/dashboard.routes.js";
import roomRoutes from "./routes/room.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import electricityMeterRoutes from "./routes/electricityMeter.routes.js";
import foodMenuRoutes from "./routes/foodMenu.routes.js";
import foodConfirmationRoutes from "./routes/foodConfirmation.routes.js";
import { errorHandler } from "./middlewares/error.middleware.js";

// Import models to ensure they are loaded for associations
import { User } from "./models/user.model.js";
import { Complaint } from "./models/complaint.model.js";
import { VacatedUser } from "./models/vacateduser.model.js";
import { Circular } from "./models/circular.model.js";
import { Room } from "./models/room.model.js";
import { Payment } from "./models/payment.model.js";
import { ElectricityMeter } from "./models/electricityMeter.model.js";
import { FoodMenu } from "./models/foodMenu.model.js";
import { FoodConfirmation } from "./models/foodConfirmation.model.js";
import { OtpVerification } from "./models/otpVerification.model.js";

// Define associations after all models are imported
FoodConfirmation.belongsTo(User, { foreignKey: "user_id", as: "user" });
User.hasMany(FoodConfirmation, { foreignKey: "user_id", as: "foodConfirmations" });

const app = express();

const defaultAllowedOrigins = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3001",
  "http://localhost:5173",
  "http://127.0.0.1:5173"
];

const envAllowedOrigins = (process.env.CLIENT_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set([...defaultAllowedOrigins, ...envAllowedOrigins])];

const corsOptions = {
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    const corsError = new Error(`CORS blocked for origin: ${origin}`);
    corsError.status = 403;
    return callback(corsError);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/api/health", (req, res) => {
  res.json({ success: true, message: "Server is running" });
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/complaints", complaintRoutes);
app.use("/api/circulars", circularRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/electricity-meters", electricityMeterRoutes);
app.use("/api/food-menus", foodMenuRoutes);
app.use("/api/food-confirmations", foodConfirmationRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Error handling
app.use(errorHandler);


export default app;