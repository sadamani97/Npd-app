import sequelize from "./config/db.js";
import { User } from "./models/user.model.js";
import { Hostel } from "./models/hostel.model.js";

async function run() {
  try {
    const hostels = await Hostel.findAll();
    console.log("Hostels in DB:");
    hostels.forEach(h => {
      console.log(`ID: ${h.id}, Name: ${h.hostel_name}, Code: ${h.hostel_code}`);
    });

    const users = await User.findAll();
    console.log("\nUsers in DB:");          
    users.forEach(u => {
      console.log(`ID: ${u.id}, Name: ${u.name}, Role: ${u.role}, HostelID: ${u.hostel_id}, Status: ${u.status}`);
    });
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
