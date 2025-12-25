import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, comparePasswords, hashPassword } from "./auth";
import { storage } from "./storage";
import { registerImageRoutes } from "./replit_integrations/image";
import { sendContactEmail, sendCateringEmail } from "./email";
import express from "express";
import { join } from "path";
import { existsSync } from "fs";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  await setupAuth(app);
  registerImageRoutes(app);
  
  app.use("/generated-images", express.static(join(process.cwd(), "public", "generated-images")));

  // Download backup route (full with images)
  app.get("/download-backup", (req, res) => {
    const backupPath = join(process.cwd(), "soup-backup.tar.gz");
    if (existsSync(backupPath)) {
      res.download(backupPath, "soup-shoppe-backup.tar.gz");
    } else {
      res.status(404).send("Backup file not found. Please contact support.");
    }
  });

  // Download code-only backup (small, for GitHub)
  app.get("/download-code", (req, res) => {
    const backupPath = join(process.cwd(), "soup-code-only.tar.gz");
    if (existsSync(backupPath)) {
      res.download(backupPath, "soup-shoppe-code.tar.gz");
    } else {
      res.status(404).send("Code backup file not found. Please contact support.");
    }
  });

  app.post("/api/change-password", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      const isValid = await comparePasswords(currentPassword, user.password);
      if (!isValid) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUserPassword(user.id, hashedPassword);
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Error changing password:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  app.get("/api/menu/latest-published", async (req, res) => {
    try {
      const menu = await storage.getLatestPublishedMenu();
      if (menu) {
        res.json(menu);
      } else {
        res.json(null);
      }
    } catch (error) {
      console.error("Error fetching latest published menu:", error);
      res.status(500).json({ error: "Failed to fetch latest published menu" });
    }
  });

  app.get("/api/menu/:date", async (req, res) => {
    try {
      const menu = await storage.getDailyMenu(req.params.date);
      if (menu) {
        res.json(menu);
      } else {
        res.json({
          date: req.params.date,
          soups: [],
          paniniId: null,
          sandwichId: null,
          saladId: null,
          entreeId: null,
          isPublished: false,
        });
      }
    } catch (error) {
      console.error("Error fetching menu:", error);
      res.status(500).json({ error: "Failed to fetch menu" });
    }
  });

  app.post("/api/menu", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const menu = await storage.saveDailyMenu(req.body);
      res.json(menu);
    } catch (error) {
      console.error("Error saving menu:", error);
      res.status(500).json({ error: "Failed to save menu" });
    }
  });

  app.get("/api/custom-items", async (req, res) => {
    try {
      const items = await storage.getCustomMenuItems();
      res.json(items);
    } catch (error) {
      console.error("Error fetching custom items:", error);
      res.status(500).json({ error: "Failed to fetch custom items" });
    }
  });

  app.post("/api/custom-items", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const item = await storage.saveMenuItem({
        ...req.body,
        isCustom: true,
      });
      res.json(item);
    } catch (error) {
      console.error("Error saving custom item:", error);
      res.status(500).json({ error: "Failed to save custom item" });
    }
  });

  app.get("/api/generated-images", async (req, res) => {
    try {
      const images = await storage.getGeneratedImages();
      res.json(images);
    } catch (error) {
      console.error("Error fetching generated images:", error);
      res.status(500).json({ error: "Failed to fetch generated images" });
    }
  });

  app.post("/api/generated-images", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const { itemId, imageUrl, itemData } = req.body;
      if (!itemId || !imageUrl) {
        return res.status(400).json({ error: "itemId and imageUrl are required" });
      }
      const image = await storage.saveGeneratedImage(itemId, imageUrl, itemData);
      res.json(image);
    } catch (error) {
      console.error("Error saving generated image:", error);
      res.status(500).json({ error: "Failed to save generated image" });
    }
  });

  // Contact form email submission
  app.post("/api/contact", async (req, res) => {
    try {
      const { name, email, subject, message } = req.body;
      if (!name || !email || !subject || !message) {
        return res.status(400).json({ error: "All fields are required" });
      }
      await sendContactEmail({ name, email, subject, message });
      res.json({ success: true, message: "Email sent successfully" });
    } catch (error) {
      console.error("Error sending contact email:", error);
      res.status(500).json({ error: "Failed to send email. Please try again later." });
    }
  });

  // Catering request email submission
  app.post("/api/catering", async (req, res) => {
    try {
      const { fullName, email, phone, eventDate, guestCount, eventType, menuPreferences, additionalInfo } = req.body;
      if (!fullName || !email || !phone || !eventDate) {
        return res.status(400).json({ error: "Name, email, phone, and event date are required" });
      }
      await sendCateringEmail({ fullName, email, phone, eventDate, guestCount, eventType, menuPreferences, additionalInfo });
      res.json({ success: true, message: "Catering request sent successfully" });
    } catch (error) {
      console.error("Error sending catering email:", error);
      res.status(500).json({ error: "Failed to send request. Please try again later." });
    }
  });

  // Export all menus and custom items for syncing to production
  app.get("/api/admin/export-data", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const menus = await storage.getAllMenus();
      const customItems = await storage.getCustomMenuItems();
      const generatedImages = await storage.getGeneratedImages();
      
      res.json({
        exportedAt: new Date().toISOString(),
        menus,
        customItems,
        generatedImages
      });
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // Import menus and custom items from development
  app.post("/api/admin/import-data", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const { menus, customItems, generatedImages } = req.body;
      
      let menusImported = 0;
      let itemsImported = 0;
      let imagesImported = 0;
      
      // Step 1: Import custom menu items first (dependencies for menus)
      if (customItems && Array.isArray(customItems)) {
        for (const item of customItems) {
          // Sanitize: only include valid fields for InsertMenuItem
          const sanitizedItem = {
            id: item.id,
            name: item.name,
            description: item.description || "",
            type: item.type,
            tags: Array.isArray(item.tags) ? item.tags : [],
            imageUrl: item.imageUrl || null,
            isCustom: item.isCustom ?? true,
          };
          await storage.saveMenuItem(sanitizedItem);
          itemsImported++;
        }
      }
      
      // Step 2: Import generated image references (with item data for backfill)
      if (generatedImages && Array.isArray(generatedImages)) {
        for (const img of generatedImages) {
          // Find matching custom item data if available
          const matchingItem = customItems?.find((item: any) => item.id === img.itemId);
          const itemData = matchingItem ? {
            name: matchingItem.name,
            description: matchingItem.description,
            type: matchingItem.type,
            tags: matchingItem.tags,
          } : undefined;
          
          await storage.saveGeneratedImage(img.itemId, img.imageUrl, itemData);
          imagesImported++;
        }
      }
      
      // Step 3: Import menus (after items exist)
      if (menus && Array.isArray(menus)) {
        for (const menu of menus) {
          // Sanitize: only include valid fields for InsertDailyMenu
          const sanitizedMenu = {
            date: menu.date,
            soups: Array.isArray(menu.soups) ? menu.soups : [],
            paniniId: menu.paniniId || null,
            sandwichId: menu.sandwichId || null,
            saladId: menu.saladId || null,
            entreeId: menu.entreeId || null,
            isPublished: menu.isPublished ?? false,
          };
          await storage.saveDailyMenu(sanitizedMenu);
          menusImported++;
        }
      }
      
      res.json({ 
        success: true, 
        message: `Imported ${menusImported} menus, ${itemsImported} custom items, ${imagesImported} image references`
      });
    } catch (error) {
      console.error("Error importing data:", error);
      res.status(500).json({ error: "Failed to import data" });
    }
  });

  return httpServer;
}
