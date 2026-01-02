import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { db } from "./db";
import { sql } from "drizzle-orm";
import { storage } from "./storage";
import { hashPassword } from "./auth";

const app = express();
const httpServer = createServer(app);

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

app.use(
  express.json({
    limit: '50mb',
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: '50mb' }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Ensure database tables exist with correct schema - NON-DESTRUCTIVE
  try {
    // Check if tables already exist by querying them
    let tablesExist = false;
    try {
      await db.execute(sql`SELECT 1 FROM daily_menus LIMIT 1`);
      tablesExist = true;
      log("Database tables already exist - preserving data");
    } catch (e) {
      log("Tables don't exist, will create them");
    }
    
    if (!tablesExist) {
      log("Running initial database setup...");
      
      // Create tables ONLY if they don't exist (never drop existing data)
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR PRIMARY KEY,
          username TEXT NOT NULL UNIQUE,
          password TEXT NOT NULL
        )
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS daily_menus (
          date VARCHAR(10) PRIMARY KEY NOT NULL,
          soups JSON DEFAULT '[]'::json,
          panini_id VARCHAR,
          sandwich_id VARCHAR,
          salad_id VARCHAR,
          entree_id VARCHAR,
          is_published BOOLEAN DEFAULT false NOT NULL
        )
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS menu_items (
          id VARCHAR PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          type TEXT NOT NULL,
          tags JSON DEFAULT '[]'::json,
          image_url TEXT,
          is_custom BOOLEAN DEFAULT true
        )
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS generated_images (
          id SERIAL PRIMARY KEY,
          item_id VARCHAR NOT NULL,
          image_url TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS _migrations (version INT PRIMARY KEY)
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS conversations (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      await db.execute(sql`INSERT INTO _migrations VALUES (4) ON CONFLICT DO NOTHING`);
      
      log("Database tables created successfully");
    } else {
      // Ensure menu_items and generated_images tables exist (added later)
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS menu_items (
          id VARCHAR PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          type TEXT NOT NULL,
          tags JSON DEFAULT '[]'::json,
          image_url TEXT,
          is_custom BOOLEAN DEFAULT true
        )
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS generated_images (
          id SERIAL PRIMARY KEY,
          item_id VARCHAR NOT NULL,
          image_url TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS conversations (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS messages (
          id SERIAL PRIMARY KEY,
          conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
          role TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `);
      log("Ensured all tables exist");
    }
    
    // Always ensure admin user exists (runs every startup)
    try {
      const adminCheck = await db.execute(sql`SELECT id FROM users WHERE username = 'admin' LIMIT 1`);
      if (adminCheck.rows.length === 0) {
        log("No admin user found, creating default admin...");
        const defaultPassword = await hashPassword("SoupAdmin2024!");
        await storage.createUser({
          username: "admin",
          password: defaultPassword,
        });
        log("Default admin user created (username: admin, password: SoupAdmin2024!)");
      } else {
        log("Admin user already exists");
      }
    } catch (adminError) {
      log(`Admin user check/creation error: ${adminError}`);
    }
  } catch (error) {
    log(`Database setup warning: ${error}`);
  }

  await registerRoutes(httpServer, app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
