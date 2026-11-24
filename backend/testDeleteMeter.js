import axios from "axios";
import { ElectricityMeter } from "./models/electricityMeter.model.js";

// Test the DELETE endpoint
async function testDeleteMeter() {
  try {
    console.log("Creating test meter...");
    
    // Create a test meter
    const testMeter = await ElectricityMeter.create({
      meter_number: "TEST-METER-" + Date.now(),
      block_number: "101",
      room_number: "101R1"
    });
    
    console.log("✓ Test meter created:", testMeter.id);
    
    // Try to get a real admin token
    console.log("\nTrying to get admin token...");
    const loginRes = await axios.post("http://localhost:5001/api/auth/super-admin/login", {
      email: "superadmin@hostel.com",
      password: "superadmin123"
    });
    
    const token = loginRes.data.token;
    console.log("✓ Got token:", token.substring(0, 20) + "...");
    
    // Now try to DELETE the meter
    console.log("\nAttempting DELETE /api/electricity-meters/" + testMeter.id);
    
    const deleteRes = await axios.delete(
      `http://localhost:5001/api/electricity-meters/${testMeter.id}`,
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    
    console.log("✓ DELETE succeeded:", deleteRes.data);
    
    // Verify it's actually deleted
    const check = await ElectricityMeter.findByPk(testMeter.id);
    if (!check) {
      console.log("✓ Confirmed: Meter was deleted from database");
    } else {
      console.log("✗ Error: Meter still exists in database");
    }
    
  } catch (err) {
    console.error("✗ Error:", err.response?.data || err.message);
    if (err.response?.status) {
      console.log("HTTP Status:", err.response.status);
    }
  }
  
  process.exit(0);
}

testDeleteMeter();
