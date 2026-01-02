import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import createMemoryStore from "memorystore";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export async function setupAuth(app: Express) {
  const MemoryStore = createMemoryStore(session);

  if (!process.env.SESSION_SECRET) {
    throw new Error("SESSION_SECRET environment variable is required");
  }

  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MemoryStore({
      checkPeriod: 86400000,
    }),
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
      sameSite: "lax",
    },
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      console.log("Login attempt for username:", username);
      console.log("ADMIN_PASSWORD env var set:", !!process.env.ADMIN_PASSWORD);
      console.log("ADMIN_PASSWORD length:", process.env.ADMIN_PASSWORD?.length);
      
      try {
        const user = await storage.getUserByUsername(username);
        console.log("Database user found:", !!user);
        
        if (user && (await comparePasswords(password, user.password))) {
          console.log("Database auth successful");
          return done(null, user);
        }
        
        // If database user not found or password doesn't match, try fallback admin
        const fallbackPassword = process.env.ADMIN_PASSWORD;
        console.log("Trying fallback - username match:", username === "admin");
        console.log("Trying fallback - password match:", password === fallbackPassword);
        
        if (fallbackPassword && username === "admin" && password === fallbackPassword) {
          console.log("Using fallback admin authentication");
          return done(null, { id: "admin-fallback", username: "admin", password: "" });
        }
        
        console.log("Authentication failed");
        return done(null, false);
      } catch (dbError) {
        console.log("Database error during auth, trying fallback:", dbError);
        // Fallback to environment-based admin when database fails
        const fallbackPassword = process.env.ADMIN_PASSWORD;
        if (fallbackPassword && username === "admin" && password === fallbackPassword) {
          return done(null, { id: "admin-fallback", username: "admin", password: "" });
        }
        return done(null, false);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: string, done) => {
    // Handle fallback admin user
    if (id === "admin-fallback") {
      return done(null, { id: "admin-fallback", username: "admin", password: "" });
    }
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (dbError) {
      console.log("Database error during deserialize:", dbError);
      done(null, undefined);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const adminCode = req.body.adminCode;
      if (!adminCode || adminCode !== process.env.ADMIN_REGISTRATION_CODE) {
        return res.status(403).json({ error: "Registration is restricted. Invalid admin code." });
      }

      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        username: req.body.username,
        password: hashedPassword,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json({ id: user.id, username: user.username });
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      console.error("Error details:", error?.message, error?.code, error?.detail);
      res.status(500).json({ 
        error: "Registration failed. Please try again.",
        debug: process.env.NODE_ENV === "development" ? error?.message : undefined
      });
    }
  });

  app.post("/api/login", passport.authenticate("local"), (req, res) => {
    const user = req.user as SelectUser;
    res.status(200).json({ id: user.id, username: user.username });
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const user = req.user as SelectUser;
    res.json({ id: user.id, username: user.username });
  });
}
