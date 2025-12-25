import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { readFileSync, existsSync } from "fs";

// Get database URL from environment
function getDatabaseUrl(): string {
  // Check environment variable first
  let databaseUrl = process.env.DATABASE_URL;
  
  // In Replit deployments, may be stored in /tmp/replitdb
  if (!databaseUrl && existsSync("/tmp/replitdb")) {
    try {
      databaseUrl = readFileSync("/tmp/replitdb", "utf-8").trim();
    } catch (e) {
      console.error("Failed to read /tmp/replitdb:", e);
    }
  }
  
  if (!databaseUrl) {
    console.error("Environment variables available:", Object.keys(process.env).filter(k => !k.includes('SECRET') && !k.includes('PASSWORD') && !k.includes('KEY')).join(', '));
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
