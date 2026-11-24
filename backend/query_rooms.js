import sequelize from "./config/db.js";
import { Room } from "./models/room.model.js";

async function run() {
  try {
    const rooms = await Room.findAll();
    console.log("Rooms in DB:");
    rooms.forEach(r => {
      console.log(`ID: ${r.id}, Block: ${r.block_number}, Room: ${r.room_number}, Status: ${r.status}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
