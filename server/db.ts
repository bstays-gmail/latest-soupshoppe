import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { readFileSync, existsSync } from "fs";

// In production, Replit may store DATABASE_URL in /tmp/replitdb
let databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && existsSync("/tmp/replitdb")) {
  try {
    databaseUrl = readFileSync("/tmp/replitdb", "utf-8").trim();
  } catch (e) {
    console.error("Failed to read /tmp/replitdb:", e);
  }
}

if (!databaseUrl) {
  throw new Error("DATABASE_URL is not set");
}

const pool = new pg.Pool({
  connectionString: databaseUrl,
});

export const db = drizzle(pool, { schema });
