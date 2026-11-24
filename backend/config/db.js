// config/db.js
import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const isTiDB = Boolean(process.env.DB_SSL === "true" || process.env.DB_HOST?.includes("tidbcloud.com"));

const sequelize = new Sequelize(
  process.env.DB_NAME ?? "hostel_db",
  process.env.DB_USER ?? "root",
  process.env.DB_PASSWORD ?? "",
  {
    host: process.env.DB_HOST ?? "localhost",
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
    dialect: "mysql",
    logging: false,
    dialectOptions: isTiDB
      ? {
          ssl: {
            minVersion: "TLSv1.2",
            rejectUnauthorized: true
          },
          enableKeepAlive: true,
          keepAliveInitialDelay: 10000
        }
      : undefined,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

export default sequelize;
