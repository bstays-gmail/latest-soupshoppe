import { sql } from "drizzle-orm";
import { pgTable, text, varchar, boolean, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export const dailyMenus = pgTable("daily_menus", {
  date: varchar("date", { length: 10 }).primaryKey(),
  soups: json("soups").$type<(string | null)[]>().notNull().default([]),
  paniniId: varchar("panini_id"),
  sandwichId: varchar("sandwich_id"),
  saladId: varchar("salad_id"),
  entreeId: varchar("entree_id"),
  isPublished: boolean("is_published").notNull().default(false),
});

export const insertDailyMenuSchema = createInsertSchema(dailyMenus);
export type InsertDailyMenu = z.infer<typeof insertDailyMenuSchema>;
export type DailyMenu = typeof dailyMenus.$inferSelect;

export const menuItems = pgTable("menu_items", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  type: varchar("type", { length: 20 }).notNull(),
  tags: json("tags").$type<string[]>().notNull().default([]),
  imageUrl: text("image_url"),
  isCustom: boolean("is_custom").notNull().default(true),
});

export const insertMenuItemSchema = createInsertSchema(menuItems);
export type InsertMenuItem = z.infer<typeof insertMenuItemSchema>;
export type MenuItemDB = typeof menuItems.$inferSelect;

export const generatedImages = pgTable("generated_images", {
  itemId: varchar("item_id").primaryKey(),
  imageUrl: text("image_url").notNull(),
});

export const insertGeneratedImageSchema = createInsertSchema(generatedImages);
export type InsertGeneratedImage = z.infer<typeof insertGeneratedImageSchema>;
export type GeneratedImage = typeof generatedImages.$inferSelect;

export const siteSettings = pgTable("site_settings", {
  key: varchar("key").primaryKey(),
  value: json("value").$type<any>().notNull(),
});

export const insertSiteSettingsSchema = createInsertSchema(siteSettings);
export type InsertSiteSettings = z.infer<typeof insertSiteSettingsSchema>;
export type SiteSettings = typeof siteSettings.$inferSelect;

export interface AnnouncementSettings {
  enabled: boolean;
  title: string;
  message: string;
  backgroundColor: string;
  textColor: string;
}

export const menuSuggestions = pgTable("menu_suggestions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guestName: text("guest_name").notNull(),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  itemName: text("item_name").notNull(),
  itemType: varchar("item_type", { length: 20 }).notNull(),
  description: text("description"),
  status: varchar("status", { length: 20 }).notNull().default("new"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertMenuSuggestionSchema = createInsertSchema(menuSuggestions).omit({
  id: true,
  status: true,
  createdAt: true,
});
export type InsertMenuSuggestion = z.infer<typeof insertMenuSuggestionSchema>;
export type MenuSuggestion = typeof menuSuggestions.$inferSelect;

export const deliveryEnrollments = pgTable("delivery_enrollments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  guestName: text("guest_name").notNull(),
  phoneNumber: text("phone_number").notNull(),
  optInConfirmed: boolean("opt_in_confirmed").notNull().default(false),
  preferredContactWindow: text("preferred_contact_window"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertDeliveryEnrollmentSchema = createInsertSchema(deliveryEnrollments).omit({
  id: true,
  createdAt: true,
});
export type InsertDeliveryEnrollment = z.infer<typeof insertDeliveryEnrollmentSchema>;
export type DeliveryEnrollment = typeof deliveryEnrollments.$inferSelect;

export { conversations, messages } from "./models/chat";
export type { Conversation, Message, InsertConversation, InsertMessage } from "./models/chat";
