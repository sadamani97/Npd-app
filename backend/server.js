// server.js
import "dotenv/config";
import app from "./app.js";
import sequelize from "./config/db.js";

const PORT = process.env.PORT || 5001;

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception thrown:", err);
});

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("Database connected successfully");

    // Sync database models safely
    await sequelize.sync({ alter: false, force: false });
    console.log("Database synced successfully");

    // Start server
    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`http://localhost:${PORT}`);
    });

    const shutdown = () => {
      console.log("Shutting down server gracefully...");
      server.close(() => {
        console.log("Server closed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
