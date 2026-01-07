import { type User, type InsertUser, type DailyMenu, type InsertDailyMenu, type MenuItemDB, type InsertMenuItem, type GeneratedImage, type AnnouncementSettings, type MenuSuggestion, type InsertMenuSuggestion, type DeliveryEnrollment, type InsertDeliveryEnrollment, users, dailyMenus, menuItems, generatedImages, siteSettings, menuSuggestions, deliveryEnrollments } from "@shared/schema";
import { db } from "./db";
import { eq, sql, desc } from "drizzle-orm";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";

const MENU_FILE = path.join(process.cwd(), "data", "daily_menus.json");

function loadMenusFromFile(): Record<string, DailyMenu> {
  try {
    if (fs.existsSync(MENU_FILE)) {
      return JSON.parse(fs.readFileSync(MENU_FILE, "utf-8"));
    }
  } catch (e) {
    console.error("Error loading menus from file:", e);
  }
  return {};
}

function saveMenusToFile(menus: Record<string, DailyMenu>) {
  try {
    fs.writeFileSync(MENU_FILE, JSON.stringify(menus, null, 2));
  } catch (e) {
    console.error("Error saving menus to file:", e);
  }
}

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser & { password: string }): Promise<User>;
  updateUserPassword(id: string, hashedPassword: string): Promise<void>;
  getDailyMenu(date: string): Promise<DailyMenu | undefined>;
  getLatestPublishedMenu(): Promise<DailyMenu | undefined>;
  getAllMenus(): Promise<DailyMenu[]>;
  saveDailyMenu(menu: InsertDailyMenu): Promise<DailyMenu>;
  getCustomMenuItems(): Promise<MenuItemDB[]>;
  saveMenuItem(item: InsertMenuItem): Promise<MenuItemDB>;
  getGeneratedImages(): Promise<GeneratedImage[]>;
  saveGeneratedImage(itemId: string, imageUrl: string, itemData?: { name: string; description?: string; type: string; tags?: string[] }): Promise<GeneratedImage>;
  getAnnouncementSettings(): Promise<AnnouncementSettings>;
  saveAnnouncementSettings(settings: AnnouncementSettings): Promise<AnnouncementSettings>;
  createMenuSuggestion(suggestion: InsertMenuSuggestion): Promise<MenuSuggestion>;
  getAllMenuSuggestions(): Promise<MenuSuggestion[]>;
  updateMenuSuggestionStatus(id: string, status: string): Promise<MenuSuggestion | undefined>;
  createDeliveryEnrollment(enrollment: InsertDeliveryEnrollment): Promise<DeliveryEnrollment>;
  getAllDeliveryEnrollments(): Promise<DeliveryEnrollment[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser & { password: string }): Promise<User> {
    const userWithId = {
      ...insertUser,
      id: randomUUID(),
    };
    const [user] = await db.insert(users).values(userWithId).returning();
    return user;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<void> {
    await db.update(users).set({ password: hashedPassword }).where(eq(users.id, id));
  }

  async getDailyMenu(date: string): Promise<DailyMenu | undefined> {
    try {
      const [menu] = await db.select().from(dailyMenus).where(eq(dailyMenus.date, date));
      return menu;
    } catch (dbError) {
      console.log("Database error fetching menu, using file fallback:", dbError);
      const menus = loadMenusFromFile();
      return menus[date];
    }
  }

  async getLatestPublishedMenu(): Promise<DailyMenu | undefined> {
    try {
      const [menu] = await db
        .select()
        .from(dailyMenus)
        .where(eq(dailyMenus.isPublished, true))
        .orderBy(sql`${dailyMenus.date} DESC`)
        .limit(1);
      return menu;
    } catch (dbError) {
      console.log("Database error fetching latest published menu:", dbError);
      return undefined;
    }
  }

  async getAllMenus(): Promise<DailyMenu[]> {
    try {
      const menus = await db.select().from(dailyMenus).orderBy(sql`${dailyMenus.date} DESC`);
      return menus;
    } catch (dbError) {
      console.log("Database error fetching all menus:", dbError);
      return [];
    }
  }

  async saveDailyMenu(menu: InsertDailyMenu): Promise<DailyMenu> {
    const menuData: DailyMenu = {
      date: menu.date,
      soups: menu.soups as (string | null)[],
      paniniId: menu.paniniId ?? null,
      sandwichId: menu.sandwichId ?? null,
      saladId: menu.saladId ?? null,
      entreeId: menu.entreeId ?? null,
      isPublished: menu.isPublished ?? false,
    };
    
    try {
      const existing = await db.select().from(dailyMenus).where(eq(dailyMenus.date, menu.date));
      
      if (existing.length > 0) {
        const [updated] = await db.update(dailyMenus)
          .set(menuData)
          .where(eq(dailyMenus.date, menu.date))
          .returning();
        return updated;
      } else {
        const [created] = await db.insert(dailyMenus).values(menuData).returning();
        return created;
      }
    } catch (dbError) {
      console.log("Database error saving menu, using file fallback:", dbError);
      const menus = loadMenusFromFile();
      menus[menu.date] = menuData;
      saveMenusToFile(menus);
      return menuData;
    }
  }

  async getCustomMenuItems(): Promise<MenuItemDB[]> {
    try {
      const items = await db.select().from(menuItems);
      return items;
    } catch (dbError) {
      console.log("Database error fetching menu items:", dbError);
      return [];
    }
  }

  async saveMenuItem(item: InsertMenuItem): Promise<MenuItemDB> {
    try {
      const itemData = {
        id: item.id,
        name: item.name,
        description: item.description || "",
        type: item.type,
        tags: Array.isArray(item.tags) ? item.tags : [],
        imageUrl: item.imageUrl || null,
        isCustom: item.isCustom ?? true,
      };
      const existing = await db.select().from(menuItems).where(eq(menuItems.id, item.id));
      if (existing.length > 0) {
        const [updated] = await db.update(menuItems).set(itemData).where(eq(menuItems.id, item.id)).returning();
        return updated;
      } else {
        const [created] = await db.insert(menuItems).values(itemData).returning();
        return created;
      }
    } catch (dbError) {
      console.log("Database error saving menu item:", dbError);
      throw dbError;
    }
  }

  async getGeneratedImages(): Promise<GeneratedImage[]> {
    try {
      const images = await db.select().from(generatedImages);
      return images;
    } catch (dbError) {
      console.log("Database error fetching generated images:", dbError);
      return [];
    }
  }

  async saveGeneratedImage(itemId: string, imageUrl: string, itemData?: { name: string; description?: string; type: string; tags?: string[] }): Promise<GeneratedImage> {
    try {
      const existing = await db.select().from(generatedImages).where(eq(generatedImages.itemId, itemId));
      let result: GeneratedImage;
      if (existing.length > 0) {
        const [updated] = await db.update(generatedImages)
          .set({ imageUrl })
          .where(eq(generatedImages.itemId, itemId))
          .returning();
        result = updated;
      } else {
        const [created] = await db.insert(generatedImages).values({ itemId, imageUrl }).returning();
        result = created;
      }
      
      const existingMenuItem = await db.select().from(menuItems).where(eq(menuItems.id, itemId));
      if (existingMenuItem.length > 0) {
        await db.update(menuItems)
          .set({ imageUrl })
          .where(eq(menuItems.id, itemId));
      } else if (itemData) {
        await db.insert(menuItems).values({
          id: itemId,
          name: itemData.name,
          description: itemData.description || "",
          type: itemData.type,
          tags: itemData.tags || [],
          imageUrl,
          isCustom: false,
        });
      }
      
      return result;
    } catch (dbError) {
      console.log("Database error saving generated image:", dbError);
      throw dbError;
    }
  }

  async getAnnouncementSettings(): Promise<AnnouncementSettings> {
    const defaultSettings: AnnouncementSettings = {
      enabled: false,
      title: "",
      message: "",
      backgroundColor: "rgba(0, 0, 0, 0.85)",
      textColor: "#ffffff",
    };
    
    try {
      const [result] = await db.select().from(siteSettings).where(eq(siteSettings.key, "announcement"));
      if (result) {
        return { ...defaultSettings, ...result.value };
      }
      return defaultSettings;
    } catch (dbError) {
      console.log("Database error fetching announcement settings:", dbError);
      return defaultSettings;
    }
  }

  async saveAnnouncementSettings(settings: AnnouncementSettings): Promise<AnnouncementSettings> {
    try {
      const existing = await db.select().from(siteSettings).where(eq(siteSettings.key, "announcement"));
      if (existing.length > 0) {
        await db.update(siteSettings)
          .set({ value: settings })
          .where(eq(siteSettings.key, "announcement"));
      } else {
        await db.insert(siteSettings).values({ key: "announcement", value: settings });
      }
      return settings;
    } catch (dbError) {
      console.log("Database error saving announcement settings:", dbError);
      throw dbError;
    }
  }

  async createMenuSuggestion(suggestion: InsertMenuSuggestion): Promise<MenuSuggestion> {
    try {
      const [created] = await db.insert(menuSuggestions).values(suggestion).returning();
      return created;
    } catch (dbError) {
      console.log("Database error creating menu suggestion:", dbError);
      throw dbError;
    }
  }

  async getAllMenuSuggestions(): Promise<MenuSuggestion[]> {
    try {
      const suggestions = await db.select().from(menuSuggestions).orderBy(desc(menuSuggestions.createdAt));
      return suggestions;
    } catch (dbError) {
      console.log("Database error fetching menu suggestions:", dbError);
      return [];
    }
  }

  async updateMenuSuggestionStatus(id: string, status: string): Promise<MenuSuggestion | undefined> {
    try {
      const [updated] = await db.update(menuSuggestions)
        .set({ status })
        .where(eq(menuSuggestions.id, id))
        .returning();
      return updated;
    } catch (dbError) {
      console.log("Database error updating menu suggestion:", dbError);
      throw dbError;
    }
  }

  async createDeliveryEnrollment(enrollment: InsertDeliveryEnrollment): Promise<DeliveryEnrollment> {
    try {
      const [created] = await db.insert(deliveryEnrollments).values(enrollment).returning();
      return created;
    } catch (dbError) {
      console.log("Database error creating delivery enrollment:", dbError);
      throw dbError;
    }
  }

  async getAllDeliveryEnrollments(): Promise<DeliveryEnrollment[]> {
    try {
      const enrollments = await db.select().from(deliveryEnrollments).orderBy(desc(deliveryEnrollments.createdAt));
      return enrollments;
    } catch (dbError) {
      console.log("Database error fetching delivery enrollments:", dbError);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();
