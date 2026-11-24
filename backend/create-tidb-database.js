import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: true }
});

const databaseName = process.env.DB_NAME;
await connection.query("CREATE DATABASE IF NOT EXISTS " + mysql.escapeId(databaseName));
console.log(`Database ${databaseName} created or already exists`);
await connection.end();
