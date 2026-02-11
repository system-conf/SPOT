import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dialect: "mysql",
    dbCredentials: {
        host: process.env.DB_HOST || process.env.DB_HOST || "localhost",
        user: process.env.DB_USER || process.env.DB_USER || "root",
        password: process.env.DB_PASS || process.env.DB_PASS || "",
        database: process.env.DB_NAME || process.env.DB_NAME || "spot",
        port: Number(process.env.DB_PORT || 3306),
    },
});
