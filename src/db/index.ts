import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT || 3306),
};

if (!dbConfig.host || !dbConfig.user || !dbConfig.password || !dbConfig.database) {
    throw new Error("Database configuration is missing required fields (DB_HOST, DB_USER, DB_PASS, DB_NAME)");
}

// Create the connection pool using an object config to avoid URL parsing issues
const poolConnection = mysql.createPool(dbConfig);

export const db = drizzle(poolConnection, { schema, mode: "default" });
