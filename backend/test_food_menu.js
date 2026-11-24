import sequelize from "./config/db.js";
import { FoodMenu } from "./models/foodMenu.model.js";

async function run() {
  try {
    console.log("Running FoodMenu.findAll query...");
    const menus = await FoodMenu.findAll({
      where: { hostel_id: 1 },
      attributes: ["id", "menu_date", "meal_type", "item_name", "description", "is_veg", "is_available", "created_by", "createdAt"],
      order: [["menu_date", "DESC"], ["meal_type", "ASC"]]
    });
    console.log(`Query succeeded! Found ${menus.length} food menus.`);
    if (menus.length > 0) {
      console.log("First menu sample:", menus[0].toJSON());
    }
    process.exit(0);
  } catch (err) {
    console.error("Query failed with error:", err);
    process.exit(1);
  }
}
run();
