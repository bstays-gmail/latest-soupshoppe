import { drizzle, NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import { readFileSync, existsSync } from "fs";

// Lazy initialization - connection happens on first use, not at module load
let _db: NodePgDatabase<typeof schema> | null = null;
let _pool: pg.Pool | null = null;

function getDatabaseUrl(): string {
  // Log environment info for debugging
  console.log("=== DATABASE CONNECTION DEBUG ===");
  console.log("NODE_ENV:", process.env.NODE_ENV);
  console.log("Available env vars:", Object.keys(process.env).filter(k => 
    !k.includes('SECRET') && !k.includes('PASSWORD') && !k.includes('KEY') && !k.includes('DATABASE')
  ).slice(0, 20).join(', '));
  console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);
  console.log("DATABASE_URL length:", process.env.DATABASE_URL?.length || 0);
  
  let databaseUrl = process.env.DATABASE_URL;
  
  // In Replit deployments, may be stored in /tmp/replitdb
  if (!databaseUrl && existsSync("/tmp/replitdb")) {
    try {
      databaseUrl = readFileSync("/tmp/replitdb", "utf-8").trim();
      console.log("Read DATABASE_URL from /tmp/replitdb");
    } catch (e) {
      console.error("Failed to read /tmp/replitdb:", e);
    }
  }
  
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set. Please add it to your environment variables.");
  }
  
  console.log("=== END DATABASE DEBUG ===");
  return databaseUrl;
}

function getPool(): pg.Pool {
  if (!_pool) {
    const databaseUrl = getDatabaseUrl();
    _pool = new pg.Pool({
      connectionString: databaseUrl,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
  }
  return _pool;
}

function getDb(): NodePgDatabase<typeof schema> {
  if (!_db) {
    _db = drizzle(getPool(), { schema });
  }
  return _db;
}

// Export a proxy that lazily initializes the database on first access
export const db = new Proxy({} as NodePgDatabase<typeof schema>, {
  get(_, prop) {
    const realDb = getDb();
    const value = (realDb as any)[prop];
    if (typeof value === 'function') {
      return value.bind(realDb);
    }
    return value;
  }
});
