// server.js
import "dotenv/config";
import app from "./app.js";
import sequelize from "./config/db.js";

const PORT = process.env.PORT || 5001;

const startServer = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    console.log("Database connected successfully");

    // Sync database models
    await sequelize.sync({ alter: false, force: false });
    console.log("Database synced successfully");

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
      console.log(`http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();