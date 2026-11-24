import axios from "axios";

// Test to see if ANY electricity meter request works
async function testRoutes() {
  try {
    console.log("Testing basic GET health check...");
    const healthRes = await axios.get("http://localhost:5001/api/health");
    console.log("✓ Health check works");
    
    console.log("\nTesting GET electricity-meters/block/1...");
    const blockRes = await axios.get("http://localhost:5001/api/electricity-meters/block/1");
    console.log("✗ Unexpected success - might be hitting 404 catch-all instead");
  } catch (err) {
    if (err.response?.status === 401) {
      console.log("✓ Got 401 (expected - need auth)");
    } else {
      console.log("✗ Got error:", err.response?.status, err.response?.data?.message);
    }
  }
  
  process.exit(0);
}

testRoutes();
