import sequelize from "./config/db.js";

try {
  await sequelize.authenticate();
  console.log("✅ TiDB Cloud connection successful");
  await sequelize.sync({ alter: false, force: false });
  console.log("✅ Tables synchronized successfully");
} catch (error) {
  console.error("❌ TiDB connection failed:", error.message);
  process.exitCode = 1;
} finally {
  await sequelize.close();
}
