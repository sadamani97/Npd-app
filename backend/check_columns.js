import sequelize from "./config/db.js";
import { FoodConfirmation } from "./models/foodConfirmation.model.js";

async function run() {
  try {
    console.log("Checking database columns...");
    // Run sync alter to ensure all columns like 'notes' exist in DB
    await sequelize.sync({ alter: true });
    console.log("Database models synchronized and columns altered successfully!");
    
    // Check table description
    const queryInterface = sequelize.getQueryInterface();
    const description = await queryInterface.describeTable("food_confirmations");
    console.log("FoodConfirmations columns:", Object.keys(description));
    process.exit(0);
  } catch (err) {
    console.error("Error checking columns:", err);
    process.exit(1);
  }
}
run();
