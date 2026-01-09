import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth, comparePasswords, hashPassword } from "./auth";
import { storage } from "./storage";
import { registerImageRoutes } from "./replit_integrations/image";
import { sendContactEmail, sendCateringEmail } from "./email";
import express from "express";
import { join } from "path";
import { existsSync } from "fs";
import nodemailer from "nodemailer";

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

  // Download latest code for GitHub sync
  app.get("/download-latest", (req, res) => {
    const backupPath = join(process.cwd(), "public", "soup-code-latest.tar.gz");
    if (existsSync(backupPath)) {
      res.download(backupPath, "soup-code-latest.tar.gz");
    } else {
      res.status(404).send("Latest code file not found.");
    }
  });

  // Download light version (no images) for GitHub sync
  app.get("/download-light", (req, res) => {
    const zipPath = join(process.cwd(), "public", "soupshoppe-code-light.zip");
    const tarPath = join(process.cwd(), "public", "soup-code-light.tar.gz");
    if (existsSync(zipPath)) {
      res.download(zipPath, "soupshoppe-code-light.zip");
    } else if (existsSync(tarPath)) {
      res.download(tarPath, "soup-code-light.tar.gz");
    } else {
      res.status(404).send("Light code file not found.");
    }
  });

  // Download fresh source code
  app.get("/download-fresh", (req, res) => {
    const zipPath = join(process.cwd(), "public", "downloads", "soup-shoppe-fresh.zip");
    if (existsSync(zipPath)) {
      res.download(zipPath, "soup-shoppe-fresh.zip");
    } else {
      res.status(404).send("Fresh source code file not found.");
    }
  });

  // Download TV display file
  app.get("/download-tv-display", (req, res) => {
    const filePath = join(process.cwd(), "client", "src", "pages", "tv-display.tsx");
    if (existsSync(filePath)) {
      res.download(filePath, "tv-display.tsx");
    } else {
      res.status(404).send("TV display file not found.");
    }
  });

  // Download TV update bundle (both files needed)
  app.get("/download-tv-update", (req, res) => {
    const zipPath = join(process.cwd(), "public", "downloads", "tv-update.zip");
    if (existsSync(zipPath)) {
      res.download(zipPath, "tv-update.zip");
    } else {
      res.status(404).send("TV update zip not found.");
    }
  });

  // Download production update files
  app.get("/production-update.zip", (req, res) => {
    const zipPath = join(process.cwd(), "public", "production-update.zip");
    if (existsSync(zipPath)) {
      res.download(zipPath, "production-update.zip");
    } else {
      res.status(404).send("Production update file not found.");
    }
  });

  // Download production update v2
  app.get("/production-update-v2.zip", (req, res) => {
    const zipPath = join(process.cwd(), "public", "production-update-v2.zip");
    if (existsSync(zipPath)) {
      res.download(zipPath, "production-update-v2.zip");
    } else {
      res.status(404).send("Production update v2 file not found.");
    }
  });

  // Download store.ts directly
  app.get("/download/store.ts", (req, res) => {
    const filePath = join(process.cwd(), "client", "src", "lib", "store.ts");
    if (existsSync(filePath)) {
      res.download(filePath, "store.ts");
    } else {
      res.status(404).send("File not found.");
    }
  });

  // Download home.tsx directly
  app.get("/download/home.tsx", (req, res) => {
    const filePath = join(process.cwd(), "client", "src", "pages", "home.tsx");
    if (existsSync(filePath)) {
      res.download(filePath, "home.tsx");
    } else {
      res.status(404).send("File not found.");
    }
  });

  // Download light version zip
  app.get("/soupshoppe-light.zip", (req, res) => {
    const zipPath = join(process.cwd(), "public", "soupshoppe-light.zip");
    if (existsSync(zipPath)) {
      res.download(zipPath, "soupshoppe-light.zip");
    } else {
      res.status(404).send("Light version not found.");
    }
  });

  // Download custom AI-generated images for manual upload to production
  app.get("/custom-images.zip", (req, res) => {
    const zipPath = join(process.cwd(), "public", "custom-images.zip");
    if (existsSync(zipPath)) {
      res.download(zipPath, "custom-images.zip");
    } else {
      res.status(404).send("Custom images file not found.");
    }
  });

  // Email diagnostic endpoint - tests Resend API
  app.get("/api/email-test", async (req, res) => {
    const resendKey = process.env.RESEND_API_KEY;
    
    const result: any = {
      resendKeySet: !!resendKey,
      resendKeyLength: resendKey?.length || 0,
    };
    
    if (resendKey) {
      try {
        const response = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "Soup Shoppe <onboarding@resend.dev>",
            to: ["bstays@gmail.com"],
            subject: "Test Email from Soup Shoppe",
            html: "<h1>Test Email</h1><p>This is a test from the Soup Shoppe website.</p>",
          }),
        });
        
        const data = await response.json();
        result.status = response.status;
        result.ok = response.ok;
        result.response = data;
      } catch (error: any) {
        result.error = error.message;
      }
    } else {
      result.connectionTest = "SKIPPED - RESEND_API_KEY missing";
    }
    
    res.json(result);
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
      const menuData = req.body;
      
      // If publishing, validate that all selected custom items have Cloudinary images (not local paths)
      if (menuData.isPublished) {
        const itemsNeedingCloudinaryImages: string[] = [];
        const generatedImages = await storage.getGeneratedImages();
        const customItems = await storage.getCustomMenuItems();
        
        // Helper to check if a custom item has a production-ready (Cloudinary) image
        const hasCloudinaryImage = (itemId: string | null): boolean => {
          if (!itemId) return true; // Empty slot is OK
          // Built-in items (like s1, p1, sw1, etc.) have Cloudinary images embedded in frontend
          if (!itemId.includes('-')) return true; // UUID items have dashes, built-in don't
          // For custom items (UUIDs), check if they have a Cloudinary URL
          const imageRecord = generatedImages.find(img => img.itemId === itemId);
          if (imageRecord?.imageUrl?.startsWith('http')) return true;
          // Check if custom item has Cloudinary image URL
          const customItem = customItems.find(item => item.id === itemId);
          if (customItem?.imageUrl?.startsWith('http')) return true;
          return false; // Has local path like /generated-images/ which won't work in production
        };
        
        // Check each custom item used in menu
        if (menuData.paniniId && !hasCloudinaryImage(menuData.paniniId)) {
          const item = customItems.find(i => i.id === menuData.paniniId);
          itemsNeedingCloudinaryImages.push(`Panini: ${item?.name || 'Custom item'}`);
        }
        if (menuData.sandwichId && !hasCloudinaryImage(menuData.sandwichId)) {
          const item = customItems.find(i => i.id === menuData.sandwichId);
          itemsNeedingCloudinaryImages.push(`Sandwich: ${item?.name || 'Custom item'}`);
        }
        if (menuData.saladId && !hasCloudinaryImage(menuData.saladId)) {
          const item = customItems.find(i => i.id === menuData.saladId);
          itemsNeedingCloudinaryImages.push(`Salad: ${item?.name || 'Custom item'}`);
        }
        if (menuData.entreeId && !hasCloudinaryImage(menuData.entreeId)) {
          const item = customItems.find(i => i.id === menuData.entreeId);
          itemsNeedingCloudinaryImages.push(`Entrée: ${item?.name || 'Custom item'}`);
        }
        
        if (itemsNeedingCloudinaryImages.length > 0) {
          return res.status(400).json({ 
            error: "Cannot publish: Some custom items have images that won't work on the live website",
            missingImages: itemsNeedingCloudinaryImages,
            message: `These items need new images for the live website: ${itemsNeedingCloudinaryImages.join(', ')}. Please click "Generate Image" for each item in the admin dashboard - this will create images that work everywhere.`
          });
        }
      }
      
      const menu = await storage.saveDailyMenu(menuData);
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

  // Get announcement settings (public - no auth required)
  app.get("/api/announcement", async (req, res) => {
    try {
      const settings = await storage.getAnnouncementSettings();
      res.json(settings);
    } catch (error) {
      console.error("Error fetching announcement settings:", error);
      res.status(500).json({ error: "Failed to fetch announcement settings" });
    }
  });

  // Save announcement settings (admin only)
  app.post("/api/announcement", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const settings = await storage.saveAnnouncementSettings(req.body);
      res.json(settings);
    } catch (error) {
      console.error("Error saving announcement settings:", error);
      res.status(500).json({ error: "Failed to save announcement settings" });
    }
  });

  // Helper function to send notification emails using Resend API
  const sendNotificationEmail = async (subject: string, htmlBody: string) => {
    const resendKey = process.env.RESEND_API_KEY;
    
    if (!resendKey) {
      console.log("Email notifications disabled - RESEND_API_KEY not configured");
      return;
    }

    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "Soup Shoppe <onboarding@resend.dev>",
          to: ["info@soupshoppe.net"],
          subject,
          html: htmlBody,
        }),
      });
      
      if (response.ok) {
        console.log(`Notification email sent: ${subject}`);
      } else {
        const error = await response.json();
        console.error("Failed to send notification email:", error);
      }
    } catch (error) {
      console.error("Failed to send notification email:", error);
    }
  };

  // Menu Suggestions - public endpoint for submissions
  app.post("/api/menu-suggestions", async (req, res) => {
    try {
      const { guestName, contactEmail, contactPhone, itemName, itemType, description } = req.body;
      if (!guestName || !itemName || !itemType) {
        return res.status(400).json({ error: "Name, item name, and item type are required" });
      }
      const suggestion = await storage.createMenuSuggestion({
        guestName,
        contactEmail: contactEmail || null,
        contactPhone: contactPhone || null,
        itemName,
        itemType,
        description: description || null,
      });

      // Send email notification
      sendNotificationEmail(
        `New Menu Suggestion: ${itemName}`,
        `
        <h2>New Menu Suggestion from Soup Shoppe Website</h2>
        <p><strong>From:</strong> ${guestName}</p>
        <p><strong>Item Name:</strong> ${itemName}</p>
        <p><strong>Type:</strong> ${itemType}</p>
        ${description ? `<p><strong>Description:</strong> ${description}</p>` : ''}
        ${contactEmail ? `<p><strong>Email:</strong> ${contactEmail}</p>` : ''}
        ${contactPhone ? `<p><strong>Phone:</strong> ${contactPhone}</p>` : ''}
        <hr>
        <p><a href="https://www.mysoupshop.com/admin">View all suggestions in Admin Dashboard</a></p>
        `
      );

      res.json({ success: true, message: "Thank you for your suggestion!", suggestion });
    } catch (error) {
      console.error("Error creating menu suggestion:", error);
      res.status(500).json({ error: "Failed to submit suggestion. Please try again." });
    }
  });

  // Menu Suggestions - admin endpoints
  app.get("/api/admin/menu-suggestions", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const suggestions = await storage.getAllMenuSuggestions();
      res.json(suggestions);
    } catch (error) {
      console.error("Error fetching menu suggestions:", error);
      res.status(500).json({ error: "Failed to fetch suggestions" });
    }
  });

  app.patch("/api/admin/menu-suggestions/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const { status } = req.body;
      if (!status || !["new", "reviewed", "implemented"].includes(status)) {
        return res.status(400).json({ error: "Invalid status" });
      }
      const updated = await storage.updateMenuSuggestionStatus(req.params.id, status);
      res.json(updated);
    } catch (error) {
      console.error("Error updating menu suggestion:", error);
      res.status(500).json({ error: "Failed to update suggestion" });
    }
  });

  // Delivery Enrollment - public endpoint for submissions
  app.post("/api/delivery-enrollment", async (req, res) => {
    try {
      const { guestName, phoneNumber, optInConfirmed, preferredContactWindow, notes } = req.body;
      if (!guestName || !phoneNumber) {
        return res.status(400).json({ error: "Name and phone number are required" });
      }
      if (!optInConfirmed) {
        return res.status(400).json({ error: "You must agree to receive text messages" });
      }
      const enrollment = await storage.createDeliveryEnrollment({
        guestName,
        phoneNumber,
        optInConfirmed,
        preferredContactWindow: preferredContactWindow || null,
        notes: notes || null,
      });

      // Send email notification
      sendNotificationEmail(
        `New Delivery Signup: ${guestName}`,
        `
        <h2>New Delivery Program Enrollment</h2>
        <p><strong>Name:</strong> ${guestName}</p>
        <p><strong>Phone:</strong> ${phoneNumber}</p>
        ${preferredContactWindow ? `<p><strong>Preferred Contact Time:</strong> ${preferredContactWindow}</p>` : ''}
        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
        <hr>
        <p><a href="https://www.mysoupshop.com/admin">View all enrollments in Admin Dashboard</a></p>
        `
      );

      res.json({ success: true, message: "You're enrolled! We'll text you about advance orders.", enrollment });
    } catch (error) {
      console.error("Error creating delivery enrollment:", error);
      res.status(500).json({ error: "Failed to enroll. Please try again." });
    }
  });

  // Delivery Enrollment - admin endpoints
  app.get("/api/admin/delivery-enrollments", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const enrollments = await storage.getAllDeliveryEnrollments();
      res.json(enrollments);
    } catch (error) {
      console.error("Error fetching delivery enrollments:", error);
      res.status(500).json({ error: "Failed to fetch enrollments" });
    }
  });

  // Export delivery enrollments as CSV
  app.get("/api/admin/delivery-enrollments/csv", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    try {
      const enrollments = await storage.getAllDeliveryEnrollments();
      const csv = [
        "Name,Phone Number,Opt-In Confirmed,Preferred Contact Window,Notes,Enrolled Date",
        ...enrollments.map(e => 
          `"${e.guestName}","${e.phoneNumber}",${e.optInConfirmed},"${e.preferredContactWindow || ''}","${e.notes || ''}","${e.createdAt}"`
        )
      ].join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader("Content-Disposition", "attachment; filename=delivery-enrollments.csv");
      res.send(csv);
    } catch (error) {
      console.error("Error exporting enrollments CSV:", error);
      res.status(500).json({ error: "Failed to export CSV" });
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
