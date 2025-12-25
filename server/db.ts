import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { readFileSync, existsSync } from "fs";

// Log all environment variables at startup (excluding secrets)
console.log("=== STARTUP DEBUG ===");
console.log("Environment variables:", Object.keys(process.env).filter(k => !k.includes('SECRET') && !k.includes('PASSWORD') && !k.includes('KEY')).join(', '));
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
console.log("=== END DEBUG ===");

// Get database URL from environment
function getDatabaseUrl(): string {
  let databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl && existsSync("/tmp/replitdb")) {
    try {
      databaseUrl = readFileSync("/tmp/replitdb", "utf-8").trim();
    } catch (e) {
      console.error("Failed to read /tmp/replitdb:", e);
    }
  }
  
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Please add it to your environment variables.");
  }
  
  return databaseUrl;
}

const databaseUrl = getDatabaseUrl();

const pool = new pg.Pool({
  connectionString: databaseUrl,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });
