import sequelize from "./config/db.js";
import { User } from "./models/user.model.js";

async function run() {
  try {
    const users = await User.findAll();
    console.log("Users in DB:");          
    users.forEach(u => {
      console.log(`ID: ${u.id}, Name: ${u.name}, Role: ${u.role}, Block: ${u.block_number}, Room: ${u.room_number}, Status: ${u.status}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
