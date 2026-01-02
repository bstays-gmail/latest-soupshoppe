import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, format } from 'date-fns';
import { useState, useEffect } from 'react';
import { CLOUDINARY_IMAGE_URLS } from './cloudinary-images';

// Helper function to get Cloudinary image URL for an item
const getImageUrl = (id: string): string | undefined => CLOUDINARY_IMAGE_URLS[id];

// Database version - increment this when items change to force update
const DB_VERSION = 5;

// --- Types ---

export type ItemType = 'soup' | 'panini' | 'sandwich' | 'salad' | 'entree';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  type: ItemType;
  tags: string[]; // e.g., 'Vegan', 'GF', 'Spicy'
  price?: string;
  imageUrl?: string;
}

export interface DailyMenu {
  date: string; // YYYY-MM-DD
  soups: (MenuItem | null)[]; // Fixed 6 slots
  specials: {
    panini: MenuItem | null;
    sandwich: MenuItem | null;
    salad: MenuItem | null;
    entree: MenuItem | null;
  };
  isPublished: boolean;
}

interface MenuStore {
  // Database of all known items
  items: MenuItem[];
  addItem: (item: MenuItem) => void;
  deleteItem: (id: string) => void;
  loadCustomItems: () => Promise<void>;

  // Daily Menus
  menus: Record<string, DailyMenu>; // Keyed by date YYYY-MM-DD
  getMenu: (date: Date) => DailyMenu;
  updateMenu: (date: Date, menu: Partial<DailyMenu>) => void;
  publishMenu: (date: Date) => void;
  
  // Helper
  importDatabase: (items: MenuItem[]) => void;
  resetDatabase: () => void;
}

// --- Initial Data ---
// All items with Cloudinary image URLs embedded for production/development sync

const INITIAL_ITEMS: MenuItem[] = [
  // Soups (Alphabetically sorted)
  { id: 's1', type: 'soup', name: 'Angus Beef Barley', description: '', tags: [], imageUrl: getImageUrl('s1') },
  { id: 's2', type: 'soup', name: 'Athletic Freakster', description: '', tags: [], imageUrl: getImageUrl('s2') },
  { id: 's3', type: 'soup', name: 'Beef Barley', description: '', tags: [], imageUrl: getImageUrl('s3') },
  { id: 's4', type: 'soup', name: 'Beef Mushroom Barley', description: '', tags: [], imageUrl: getImageUrl('s4') },
  { id: 's5', type: 'soup', name: 'Beef Vegetables', description: '', tags: [], imageUrl: getImageUrl('s5') },
  { id: 's6', type: 'soup', name: 'Black Angus Beef Chilli', description: 'Rich beef chilli with beans', tags: ['GF', 'Comfort'], imageUrl: getImageUrl('s6') },
  { id: 's7', type: 'soup', name: 'Broccoli Cheddar', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('s7') },
  { id: 's8', type: 'soup', name: 'Broccoli Cauliflower', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('s8') },
  { id: 's9', type: 'soup', name: 'Buffalo Chicken Soup', description: '', tags: [], imageUrl: getImageUrl('s9') },
  { id: 's10', type: 'soup', name: 'Butternut Squash', description: 'Roasted butternut squash with warm spices and coconut milk', tags: ['Vegan', 'GF', 'Seasonal'], imageUrl: getImageUrl('s10') },
  { id: 's10b', type: 'soup', name: 'Butternut Squash Bisque', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('s10b') },
  { id: 's11', type: 'soup', name: 'Cabbage Soup', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('s11') },
  { id: 's11b', type: 'soup', name: 'Carrot Bisque', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('s11b') },
  { id: 's11c', type: 'soup', name: 'Carrot Creamer', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('s11c') },
  { id: 's12', type: 'soup', name: 'Carrot Ginger', description: '', tags: ['GF', 'VEG'], imageUrl: getImageUrl('s12') },
  { id: 's12b', type: 'soup', name: 'Chickpeas Carrot Bisque', description: '', tags: ['GF', 'VEG', 'Vegetarian'], imageUrl: getImageUrl('s12b') },
  { id: 's13', type: 'soup', name: 'Chicken Buffalo Soup', description: '', tags: [], imageUrl: getImageUrl('s13') },
  { id: 's14', type: 'soup', name: 'Chicken Florentine', description: '', tags: [], imageUrl: getImageUrl('s14') },
  { id: 's15', type: 'soup', name: 'Chicken Lime Orzo', description: '', tags: [], imageUrl: getImageUrl('s15') },
  { id: 's16', type: 'soup', name: 'Chicken Mushroom Orzo', description: '', tags: [], imageUrl: getImageUrl('s16') },
  { id: 's17', type: 'soup', name: 'Chicken Noodle', description: 'Hearty soup with tender chicken, fresh vegetables, and egg noodles', tags: ['Classic'], imageUrl: getImageUrl('s17') },
  { id: 's18', type: 'soup', name: 'Chicken Pot Pie', description: '', tags: [], imageUrl: getImageUrl('s18') },
  { id: 's19', type: 'soup', name: 'Chicken Spinach & Potato', description: '', tags: [], imageUrl: getImageUrl('s19') },
  { id: 's20', type: 'soup', name: 'Chickpea Soup', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('s20') },
  { id: 's21', type: 'soup', name: 'Chickpeas Whitebeans', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('s21') },
  { id: 's22', type: 'soup', name: 'Chunky Celery', description: '', tags: ['GF', 'VEG', 'DF'], imageUrl: getImageUrl('s22') },
  { id: 's23', type: 'soup', name: 'Clam Chowder', description: '', tags: [], imageUrl: getImageUrl('s23') },
  { id: 's24', type: 'soup', name: 'Cornbeef Cabbage Chickpeas', description: '', tags: [], imageUrl: getImageUrl('s24') },
  { id: 's25', type: 'soup', name: 'Cornbeef, Cabbage, Tomato DF', description: '', tags: [], imageUrl: getImageUrl('s25') },
  { id: 's26', type: 'soup', name: 'Creamy Carrots', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('s26') },
  { id: 's27', type: 'soup', name: 'Creamy Chicken Corn', description: '', tags: [], imageUrl: getImageUrl('s27') },
  { id: 's28', type: 'soup', name: 'Creamy Chicken Rice', description: '', tags: [], imageUrl: getImageUrl('s28') },
  { id: 's29', type: 'soup', name: 'Creamy Mushroom', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('s29') },
  { id: 's30', type: 'soup', name: 'Creamy Rice Spinach', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('s30') },
  { id: 's31', type: 'soup', name: 'Creamy Tomato Basil', description: 'Rich, velvety tomato soup with fresh basil and cream', tags: ['Vegetarian'], imageUrl: getImageUrl('s31') },
  { id: 's32', type: 'soup', name: 'French Onion', description: 'Caramelized onions in rich beef broth, topped with Gruyère', tags: ['Signature', 'GF', 'DF'], imageUrl: getImageUrl('s32') },
  { id: 's33', type: 'soup', name: 'Garden Minestrone', description: 'Hearty Italian soup with fresh vegetables, beans, and pasta', tags: ['Vegan'], imageUrl: getImageUrl('s33') },
  { id: 's34', type: 'soup', name: 'Gazpacho', description: '', tags: ['VEG', 'GF', 'COLD'], imageUrl: getImageUrl('s34') },
  { id: 's35', type: 'soup', name: 'Golden Split Pea', description: '', tags: ['GF', 'VEG'], imageUrl: getImageUrl('s35') },
  { id: 's36', type: 'soup', name: 'Green Peas', description: '', tags: ['VEG'], imageUrl: getImageUrl('s36') },
  { id: 's37', type: 'soup', name: 'Green Peas Ham', description: '', tags: [], imageUrl: getImageUrl('s37') },
  { id: 's38', type: 'soup', name: 'Italian Wedding', description: '', tags: [], imageUrl: getImageUrl('s38') },
  { id: 's39', type: 'soup', name: 'Kidney Bean', description: '', tags: ['GF', 'VEG', 'DF'], imageUrl: getImageUrl('s39') },
  { id: 's40', type: 'soup', name: 'Lemon Chicken Orzo', description: '', tags: [], imageUrl: getImageUrl('s40') },
  { id: 's41', type: 'soup', name: 'Lucky Lentil', description: '', tags: ['GF', 'VEG', 'DF'], imageUrl: getImageUrl('s41') },
  { id: 's42', type: 'soup', name: 'Manhattan Clam Chowder', description: '', tags: [], imageUrl: getImageUrl('s42') },
  { id: 's43', type: 'soup', name: 'Mushroom Barley', description: '', tags: [], imageUrl: getImageUrl('s43') },
  { id: 's44', type: 'soup', name: 'Mushroom Bisque', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('s44') },
  { id: 's45', type: 'soup', name: 'New England Clam Chowder', description: '', tags: [], imageUrl: getImageUrl('s45') },
  { id: 's46', type: 'soup', name: 'Pasta Fagioli', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('s46') },
  { id: 's47', type: 'soup', name: 'Potato Bacon', description: '', tags: [], imageUrl: getImageUrl('s47') },
  { id: 's48', type: 'soup', name: 'Potato Bacon Cheddar', description: '', tags: [], imageUrl: getImageUrl('s48') },
  { id: 's49', type: 'soup', name: 'Potato Cheddar Bacon', description: '', tags: [], imageUrl: getImageUrl('s49') },
  { id: 's50', type: 'soup', name: 'Potato Soup', description: '', tags: [], imageUrl: getImageUrl('s50') },
  { id: 's51', type: 'soup', name: 'Roasted Green Peas', description: '', tags: ['VEG'], imageUrl: getImageUrl('s51') },
  { id: 's52', type: 'soup', name: 'Roasted Red Pepper Bisque', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('s52') },
  { id: 's53', type: 'soup', name: 'Rustic Tomato', description: '', tags: ['GF', 'Vegetarian'], imageUrl: getImageUrl('s53') },
  { id: 's54', type: 'soup', name: 'Santa Fe Black Bean', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('s54') },
  { id: 's55', type: 'soup', name: 'Seafood Bisque', description: 'Creamy bisque with fresh shrimp, crab, and sherry', tags: ['Premium'], imageUrl: getImageUrl('s55') },
  { id: 's56', type: 'soup', name: 'Smoked Ham Potato', description: '', tags: [], imageUrl: getImageUrl('s56') },
  { id: 's57', type: 'soup', name: 'Southwest Black Beans', description: '', tags: ['GF', 'VEG'], imageUrl: getImageUrl('s57') },
  { id: 's58', type: 'soup', name: 'Spinach Orzo', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('s58') },
  { id: 's59', type: 'soup', name: 'Summer Vegetable Soup', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('s59') },
  { id: 's60', type: 'soup', name: 'Tomato Bisque', description: '', tags: ['GF', 'Vegetarian'], imageUrl: getImageUrl('s60') },
  { id: 's61', type: 'soup', name: 'Tomato Soup', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('s61') },
  { id: 's62', type: 'soup', name: 'Vegetable Bisque', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('s62') },
  { id: 's63', type: 'soup', name: 'White Chilli Turkey', description: 'Spicy white bean chili with turkey', tags: ['GF', 'Spicy'], imageUrl: getImageUrl('s63') },
  { id: 's64', type: 'soup', name: 'Wild Rice & Vegetable', description: '', tags: [], imageUrl: getImageUrl('s64') },

  // Paninis (Alphabetically sorted)
  { id: 'p1', type: 'panini', name: 'BBQ Meatballs', description: '', tags: [], imageUrl: getImageUrl('p1') },
  { id: 'p2', type: 'panini', name: 'BBQ Pulled Pork', description: '', tags: [], imageUrl: getImageUrl('p2') },
  { id: 'p3', type: 'panini', name: 'BBQ Turkey Bacon', description: '', tags: [], imageUrl: getImageUrl('p3') },
  { id: 'p4', type: 'panini', name: 'Beef Corned Reuben', description: '', tags: [], imageUrl: getImageUrl('p4') },
  { id: 'p5', type: 'panini', name: 'Broccoli Cheddar', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('p5') },
  { id: 'p6', type: 'panini', name: 'Buffalo Chicken', description: '', tags: [], imageUrl: getImageUrl('p6') },
  { id: 'p7', type: 'panini', name: 'Buffalo Chicken Cutlet, Blue Cheese, Bacon, Lettuce Tomato in Ciabatta', description: '', tags: [], imageUrl: getImageUrl('p7') },
  { id: 'p8', type: 'panini', name: 'Buffalo Chicken Cutlet, Blue Cheese, Chipotle Mayo w/Cheddar', description: '', tags: [], imageUrl: getImageUrl('p8') },
  { id: 'p9', type: 'panini', name: 'Corn Beef, Coleslaw, Swiss Cheese, 1000 Island Dressing', description: '', tags: [], imageUrl: getImageUrl('p9') },
  { id: 'p10', type: 'panini', name: 'Crab Cake', description: '', tags: [], imageUrl: getImageUrl('p10') },
  { id: 'p11', type: 'panini', name: 'Cuban Panini: Ham, Pork Pickle, Swiss Cheese, w/ Mustard', description: '', tags: [], imageUrl: getImageUrl('p11') },
  { id: 'p12', type: 'panini', name: 'Curried Chicken Salad', description: '', tags: [], imageUrl: getImageUrl('p12') },
  { id: 'p13', type: 'panini', name: 'Egg Salad', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('p13') },
  { id: 'p14', type: 'panini', name: 'Grilled Chicken', description: '', tags: [], imageUrl: getImageUrl('p14') },
  { id: 'p15', type: 'panini', name: 'Grilled Chicken, Bacon, Pesto-Mayo, Sauteed Onions, Pepper Jack Cheese, Lettuce & Tomato on Ciabatta', description: '', tags: [], imageUrl: getImageUrl('p15') },
  { id: 'p16', type: 'panini', name: 'Grilled Chicken, Sauteed Pepper-Onions, Chipotle Mayo w/Cheddar', description: '', tags: [], imageUrl: getImageUrl('p16') },
  { id: 'p17', type: 'panini', name: 'Grilled Chicken Pesto, Bacon, Peppers, Onions, Mix Shreaded Cheese, Lettuce, Tomato on Ciabatta', description: '', tags: [], imageUrl: getImageUrl('p17') },
  { id: 'p18', type: 'panini', name: 'Grilled Chicken with Bacon, Chipotle & Pepper Jack', description: '', tags: [], imageUrl: getImageUrl('p18') },
  { id: 'p19', type: 'panini', name: 'Ham, Pickle Ham, Mustard, Cheddar Cheese, Lettuce & Tomato', description: '', tags: [], imageUrl: getImageUrl('p19') },
  { id: 'p20', type: 'panini', name: 'Ham, Swiss Cheese, Cole Slaw w/ Russian Dressing in Ciabatta', description: '', tags: [], imageUrl: getImageUrl('p20') },
  { id: 'p21', type: 'panini', name: 'Ham, Turkey Joe, Coleslaw, Russian Dressing, Swiss, Lettuce, Tomato in Ciabatta', description: '', tags: [], imageUrl: getImageUrl('p21') },
  { id: 'p22', type: 'panini', name: 'Ham Honey, Mustard, Sauteed Onions w/Provolone Cheese', description: '', tags: [], imageUrl: getImageUrl('p22') },
  { id: 'p23', type: 'panini', name: 'Ham Mozzarella, Sweet Onion Relish', description: '', tags: [], imageUrl: getImageUrl('p23') },
  { id: 'p24', type: 'panini', name: 'Herb Roasted Chicken w/ Mashed Potatoes', description: '', tags: [], imageUrl: getImageUrl('p24') },
  { id: 'p25', type: 'panini', name: 'Honey Mustard, Cranberry Jam, Swiss Cheese, Ham, Bacon, Lettuce & Tomato', description: '', tags: [], imageUrl: getImageUrl('p25') },
  { id: 'p26', type: 'panini', name: 'Meatball Parmesan', description: '', tags: [], imageUrl: getImageUrl('p26') },
  { id: 'p27', type: 'panini', name: 'Pastrami in 1000 Island dressing, Mustard w/ Swiss Cheese', description: '', tags: [], imageUrl: getImageUrl('p27') },
  { id: 'p28', type: 'panini', name: 'Pastrami Ruben, Sauerkraut, Swiss Cheese, Russian Dressing, Lettuce Tomato on Ciabatta', description: '', tags: [], imageUrl: getImageUrl('p28') },
  { id: 'p29', type: 'panini', name: 'Pastrami, Sauerkraut, Swiss Cheese, Russian Dressing, Lettuce, Tomato on Ciabatta', description: '', tags: [], imageUrl: getImageUrl('p29') },
  { id: 'p30', type: 'panini', name: 'Pesto Mayo, Grilled Chicken, Bacon, Lettuce & Tomato in Ciabatta', description: '', tags: [], imageUrl: getImageUrl('p30') },
  { id: 'p31', type: 'panini', name: 'Pork Chop', description: '', tags: [], imageUrl: getImageUrl('p31') },
  { id: 'p32', type: 'panini', name: 'Roast Beef, Lettuce, Tomatoes, Provolone, Horseradish Cream', description: '', tags: [], imageUrl: getImageUrl('p32') },
  { id: 'p33', type: 'panini', name: 'Shreaded Chicken, BBQ BAcon, Sauteed Pepper Onions, Cheddar Cheese', description: '', tags: [], imageUrl: getImageUrl('p33') },
  { id: 'p34', type: 'panini', name: 'Smoked Ham BBQ', description: 'Smoked Ham, Bacon, Tomatoes, Cheddar BBQ sauce', tags: [], imageUrl: getImageUrl('p34') },
  { id: 'p35', type: 'panini', name: 'Tuna Melt', description: '', tags: [], imageUrl: getImageUrl('p35') },
  { id: 'p36', type: 'panini', name: 'Turkey & Cranberry', description: '', tags: [], imageUrl: getImageUrl('p36') },
  { id: 'p37', type: 'panini', name: 'Turkey, Bacon, Cheddar, Tomato & Honeymustard', description: '', tags: [], imageUrl: getImageUrl('p37') },
  { id: 'p38', type: 'panini', name: 'Turkey, Bacon, Ham, Honey Mustard, Lettuce, Tomato & Swiss Cheese', description: '', tags: [], imageUrl: getImageUrl('p38') },
  { id: 'p39', type: 'panini', name: 'Turkey, Bacon, Pepperjack Cheese, Lettuce, Tomato w/ Ranch Dressing', description: '', tags: [], imageUrl: getImageUrl('p39') },
  { id: 'p40', type: 'panini', name: 'Turkey, Brie Cheese, Chipotle Mayo', description: '', tags: [], imageUrl: getImageUrl('p40') },
  { id: 'p41', type: 'panini', name: 'Ham Bacon on Ciabatta', description: 'Ham and bacon on fresh ciabatta bread', tags: [], imageUrl: getImageUrl('p41') },

  // Sandwiches (Alphabetically sorted)
  { id: 'sw1', type: 'sandwich', name: 'Asian Grilled Chicken, Carrots, Tomato, Zucchini, Lettuce in Spinach Wrap', description: '', tags: [], imageUrl: getImageUrl('sw1') },
  { id: 'sw2', type: 'sandwich', name: 'Asian Sesame Grilled Chicken, Carrot, Cucumber in Sundried Tomato Wrap', description: '', tags: [], imageUrl: getImageUrl('sw2') },
  { id: 'sw3', type: 'sandwich', name: 'BBQ Grilled Chicken, Cheddar Cheese, Potato Salad & Mix Greens in Semolina Bread', description: '', tags: [], imageUrl: getImageUrl('sw3') },
  { id: 'sw4', type: 'sandwich', name: 'BBQ Grilled Chicken, Cheddar Cheese, Potato Salad in Spinach Wrap', description: '', tags: [], imageUrl: getImageUrl('sw4') },
  { id: 'sw5', type: 'sandwich', name: 'Blackened Chicken, Southwest Salad, Romaine, Tomato, Cucumber, Carrots, Corn Salsa, Red Onions with Chipotle Ranch', description: '', tags: [], imageUrl: getImageUrl('sw5') },
  { id: 'sw6', type: 'sandwich', name: 'Buffalo Chicken, Bacon, Blue Cheese, Lettuce & Tomatoes', description: '', tags: [], imageUrl: getImageUrl('sw6') },
  { id: 'sw7', type: 'sandwich', name: 'Caprese Chicken', description: 'Grilled Chicken, Balsamic Glaze, Mix Greens, Mozzarella & Tomato', tags: [], imageUrl: getImageUrl('sw7') },
  { id: 'sw8', type: 'sandwich', name: 'Chicken, Bacon, Lettuce, Tomato, Ranch Dressing in Spinach Wrapp', description: '', tags: [], imageUrl: getImageUrl('sw8') },
  { id: 'sw9', type: 'sandwich', name: 'Chicken Caprese Mozzarella, Tomato, Basil and Balsamic Glaze in Sundried Tomato Wrap', description: '', tags: [], imageUrl: getImageUrl('sw9') },
  { id: 'sw10', type: 'sandwich', name: 'Chicken Cutlet, Bacon, Mayo Lettuce & Tomato in Spinach Wrap', description: '', tags: [], imageUrl: getImageUrl('sw10') },
  { id: 'sw11', type: 'sandwich', name: 'Cobb Salad', description: '', tags: [], imageUrl: getImageUrl('sw11') },
  { id: 'sw12', type: 'sandwich', name: 'Cod Sandwich', description: '', tags: [], imageUrl: getImageUrl('sw12') },
  { id: 'sw13', type: 'sandwich', name: 'Corn Beef, Coleslaw, Swiss Cheese, 1000 Island Dressing', description: '', tags: [], imageUrl: getImageUrl('sw13') },
  { id: 'sw14', type: 'sandwich', name: 'Crab Salad', description: '', tags: [], imageUrl: getImageUrl('sw14') },
  { id: 'sw15', type: 'sandwich', name: 'Curried Chicken Salad w/ Spinach & Miso Tomato', description: '', tags: [], imageUrl: getImageUrl('sw15') },
  { id: 'sw16', type: 'sandwich', name: 'Egg Salad, Bacon, Spinach, Lettuce, Tomato in a Wrapp', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('sw16') },
  { id: 'sw17', type: 'sandwich', name: 'Egg Salad Spinach Tomatoes Honeymustard', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('sw17') },
  { id: 'sw18', type: 'sandwich', name: 'Grilled BBQ Chicken, Bacon, Potato Salad, Cheddar Cheese, Mix Greens in Spinach Wrap', description: '', tags: [], imageUrl: getImageUrl('sw18') },
  { id: 'sw19', type: 'sandwich', name: 'Grilled BBQ Chicken, CHeddar Cheese, Potato Salad Organic Mix Green in a Wrapp', description: '', tags: [], imageUrl: getImageUrl('sw19') },
  { id: 'sw20', type: 'sandwich', name: 'Grilled Chicken, American Cheese, Avocado, Mayo, Lettuce & Tomato in Wrap', description: '', tags: [], imageUrl: getImageUrl('sw20') },
  { id: 'sw21', type: 'sandwich', name: 'Grilled Chicken, Buffalo, Bacon, Cheddar Cheese, Lettuce & Tomato in Wrap', description: '', tags: [], imageUrl: getImageUrl('sw21') },
  { id: 'sw22', type: 'sandwich', name: 'Grilled Chicken Bacon Cheddar Tomato', description: '', tags: [], imageUrl: getImageUrl('sw22') },
  { id: 'sw23', type: 'sandwich', name: 'Grilled Chichecn, Sauteed Onions, Roasted Red Pepper & Spinach Wrapp', description: '', tags: [], imageUrl: getImageUrl('sw23') },
  { id: 'sw24', type: 'sandwich', name: 'Halana Wrap: Grilled Chicken, American Cheese, Avocado, Mayo, Lettuce & Tomato', description: '', tags: [], imageUrl: getImageUrl('sw24') },
  { id: 'sw25', type: 'sandwich', name: 'Ham CHeddar, Pickle, Lettuce, Tomato- 1000 Island Dressing', description: '', tags: [], imageUrl: getImageUrl('sw25') },
  { id: 'sw26', type: 'sandwich', name: 'Ham Mozzarella Sweet Onion Relish Balsamic Glaze', description: '', tags: [], imageUrl: getImageUrl('sw26') },
  { id: 'sw27', type: 'sandwich', name: 'Ham Prosciutto Roasted Peppers Pesto', description: '', tags: [], imageUrl: getImageUrl('sw27') },
  { id: 'sw28', type: 'sandwich', name: 'Herb Roasted Turkey Pesto', description: '', tags: [], imageUrl: getImageUrl('sw28') },
  { id: 'sw29', type: 'sandwich', name: 'Homemade Chicken Pot Pie', description: '', tags: [], imageUrl: getImageUrl('sw29') },
  { id: 'sw30', type: 'sandwich', name: 'Jerk Roasted Chicken with Mashed Potatoes', description: '', tags: [], imageUrl: getImageUrl('sw30') },
  { id: 'sw31', type: 'sandwich', name: 'Pastrami, Coleslaw, Pickle, Lettuce, Tomato, Swiss Cheese in Whole wheat Wrapp', description: '', tags: [], imageUrl: getImageUrl('sw31') },
  { id: 'sw32', type: 'sandwich', name: 'Roasted Turkey Portobello Lettuce Tomato Pesto', description: '', tags: [], imageUrl: getImageUrl('sw32') },
  { id: 'sw33', type: 'sandwich', name: 'Smoked Ham, Sloppy Joes, Coles Slaw, Swiss Cheese & Russian Dressing', description: '', tags: [], imageUrl: getImageUrl('sw33') },
  { id: 'sw34', type: 'sandwich', name: 'Tuna Fish', description: 'Tunafish Salad with Swiss Springmix & Tomatoes on Focaccia Bread', tags: [], imageUrl: getImageUrl('sw34') },
  { id: 'sw35', type: 'sandwich', name: 'Turkey, Bacon, Lettuce, Tomato with Pesto Mayo in Spinach Wrap', description: '', tags: [], imageUrl: getImageUrl('sw35') },
  { id: 'sw36', type: 'sandwich', name: 'Turkey Club, Mayo, Swiss Cheese, Bacon, Avocado, Lettuce Tomatoes', description: '', tags: [], imageUrl: getImageUrl('sw36') },
  { id: 'sw37', type: 'sandwich', name: 'Turkey Club Wrap', description: '', tags: [], imageUrl: getImageUrl('sw37') },
  { id: 'sw38', type: 'sandwich', name: 'Turkey, Bacon, Lettuce, Tomato, Mayo in Semolina Bread', description: '', tags: [], imageUrl: getImageUrl('sw38') },
  { id: 'sw39', type: 'sandwich', name: 'Turkey, BLT, Avocado and Mayo', description: '', tags: [], imageUrl: getImageUrl('sw39') },
  { id: 'sw40', type: 'sandwich', name: 'Turkey, Brie Cheese, Chipotle Mayo', description: '', tags: [], imageUrl: getImageUrl('sw40') },
  { id: 'sw41', type: 'sandwich', name: 'Turkey, Brie Cheese, Cranberries, Lattuce, Tomatoes Mayo in Semolina Bread', description: '', tags: [], imageUrl: getImageUrl('sw41') },
  { id: 'sw42', type: 'sandwich', name: 'Turkey, Fig Jam, Brie Cheese, Honey Mustard, Lettuce, Tomato in Spinach Bread', description: '', tags: [], imageUrl: getImageUrl('sw42') },
  { id: 'sw43', type: 'sandwich', name: 'Turkey Swiss Cheese BLT Pesto', description: '', tags: [], imageUrl: getImageUrl('sw43') },
  { id: 'sw44', type: 'sandwich', name: 'Ham Bacon in a Wrapp', description: 'Ham and bacon wrapped in a fresh tortilla', tags: [], imageUrl: getImageUrl('sw44') },

  // Salads (Alphabetically sorted)
  { id: 'sl1', type: 'salad', name: 'Apple Salad, Cucumber, Tomato, Onions, Carrot, w/ Italian Dressing', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('sl1') },
  { id: 'sl2', type: 'salad', name: 'Arugula Mango Salad, Tomato, Cucumber, Onions, Carrots, Walnuts w/ Poppy Seed Dressing', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('sl2') },
  { id: 'sl3', type: 'salad', name: 'Asian Salad: Chicken, Madarine, Almonds, Carrots, Cucumber, Tomato, Onions w/ Sesame Seed Asian Dressing', description: '', tags: [], imageUrl: getImageUrl('sl3') },
  { id: 'sl4', type: 'salad', name: 'Asian Sesame Grilled Chicken Salad, Romaine, Mix Greens, Carrots, Mandarins, Tomato, Cucumber, Peppers with Asian Dressing', description: '', tags: [], imageUrl: getImageUrl('sl4') },
  { id: 'sl5', type: 'salad', name: 'Blackened Chicken Caesar', description: '', tags: [], imageUrl: getImageUrl('sl5') },
  { id: 'sl6', type: 'salad', name: 'Blueberries, Cranberries, Strawberries, Feta Cheese, Spinach, Salad, Walnut, Carrots, Tomatoes, Cucumber and Onion', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('sl6') },
  { id: 'sl7', type: 'salad', name: 'Chef-Salad: Turkey, Ham, Romaine, Swiss, Hard Boiled Eggs, Cucumber, Carrots, Onion & Tomato w/ Ranch Dressing', description: '', tags: [], imageUrl: getImageUrl('sl7') },
  { id: 'sl8', type: 'salad', name: 'Chicken Bruschetta, Mixed Greens, Chicken, Fresh Mozzarella, Bruschetta toppings w/Balsamic', description: '', tags: [], imageUrl: getImageUrl('sl8') },
  { id: 'sl9', type: 'salad', name: 'Chicken Caesar Salad', description: '', tags: [], imageUrl: getImageUrl('sl9') },
  { id: 'sl10', type: 'salad', name: 'Classic Cobb', description: 'Grilled Chicken, Bacon, Tomato, Cucumber, Boiled Egg, Red Onions, Crumbled Blue Cheese w Ranch Dressing', tags: [], imageUrl: getImageUrl('sl10') },
  { id: 'sl11', type: 'salad', name: 'Green Salad: Romaine, Grilled Chicken, Tomato, Cucumber, Carrots, Red Onions, Feta Cheese, Stuffed Leaves, Olives in Greek Dressing', description: '', tags: [], imageUrl: getImageUrl('sl11') },
  { id: 'sl12', type: 'salad', name: 'Greek Salad, Romaine Lettuce, Red Onions, Cucumber, Carrots, Tomatoes, Stuffed Leaves, Feta Cheese, Grilled Chicken in Greek Dressing', description: '', tags: [], imageUrl: getImageUrl('sl12') },
  { id: 'sl13', type: 'salad', name: 'Grilled Chicken Caesar', description: '', tags: [], imageUrl: getImageUrl('sl13') },
  { id: 'sl14', type: 'salad', name: 'Mango- Cranberry Salad, Crrots, Cucumber, Tomato, Onions in Italian Dressing', description: '', tags: [], imageUrl: getImageUrl('sl14') },
  { id: 'sl15', type: 'salad', name: 'Peach, Cranberries, Tomato, Onions, Cucumber, Feta Cheese w/ Poppyseed Dressing', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('sl15') },
  { id: 'sl16', type: 'salad', name: 'Strawberry, Cranberry, Almonds, Feta Cheese, Cucumber, Carrots, Tomatoes, Poppy Seed Dressing', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('sl16') },
  { id: 'sl17', type: 'salad', name: 'Summer Berry', description: 'Mixed Greens, Tomatoes, Cucumbers, Grilled Chicken, Grapes, Pecans, Feta Cheese, Balsamic', tags: ['Seasonal'], imageUrl: getImageUrl('sl17') },
  { id: 'sl18', type: 'salad', name: 'Tropical Salad: Mango, Strawberry, Organic MixGreen, Tomato, Cucumber, Onions in Italian Dressing', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('sl18') },

  // Entrees (Alphabetically sorted)
  { id: 'e1', type: 'entree', name: '7 Cheese-Mac n Cheese', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('e1') },
  { id: 'e2', type: 'entree', name: 'Asian Fried Rice with Chicken', description: '', tags: [], imageUrl: getImageUrl('e2') },
  { id: 'e3', type: 'entree', name: 'Beef Stew w/ Egg Noodles', description: '', tags: [], imageUrl: getImageUrl('e3') },
  { id: 'e4', type: 'entree', name: 'Breaded Four Cheese, Ravioli, w/ Marinara Sauce', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('e4') },
  { id: 'e5', type: 'entree', name: 'Chicken Cutlet, Bacon, Mayo', description: '', tags: [], imageUrl: getImageUrl('e5') },
  { id: 'e6', type: 'entree', name: 'Chicken Lo Mein w/Vegetables', description: '', tags: [], imageUrl: getImageUrl('e6') },
  { id: 'e7', type: 'entree', name: 'Chicken Mulligatawny', description: '', tags: [], imageUrl: getImageUrl('e7') },
  { id: 'e8', type: 'entree', name: 'Chicken Stir Fry', description: '', tags: [], imageUrl: getImageUrl('e8') },
  { id: 'e9', type: 'entree', name: 'Chinese Chicken Fried Rice w/ Vegetables', description: '', tags: [], imageUrl: getImageUrl('e9') },
  { id: 'e10', type: 'entree', name: 'Creamy Chicken Rigatoni', description: '', tags: [], imageUrl: getImageUrl('e10') },
  { id: 'e11', type: 'entree', name: 'Creamy Mushroom Chicken with Rice', description: '', tags: [], imageUrl: getImageUrl('e11') },
  { id: 'e12', type: 'entree', name: 'Creamy Mushroom Penne Pasta w/ Grilled Chicken', description: '', tags: [], imageUrl: getImageUrl('e12') },
  { id: 'e13', type: 'entree', name: 'Egg Noodle with Teriyaki Meatballs', description: '', tags: [], imageUrl: getImageUrl('e13') },
  { id: 'e14', type: 'entree', name: 'Herb Roasted Chicken w/ Mashed Potatoes & Vegetables', description: '', tags: [], imageUrl: getImageUrl('e14') },
  { id: 'e15', type: 'entree', name: 'Herb Roasted Chicken with Mashed Potatoes and Sauteed Veggies', description: '', tags: [], imageUrl: getImageUrl('e15') },
  { id: 'e16', type: 'entree', name: 'Honey Roasted Chicken Pot Pie', description: '', tags: [], imageUrl: getImageUrl('e16') },
  { id: 'e17', type: 'entree', name: 'Jerk Roasted Chicken w/ Mashed Potatoes', description: '', tags: [], imageUrl: getImageUrl('e17') },
  { id: 'e18', type: 'entree', name: 'Mac & Cheese', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('e18') },
  { id: 'e19', type: 'entree', name: 'Mac N Cheese w/Bacon', description: '', tags: [], imageUrl: getImageUrl('e19') },
  { id: 'e20', type: 'entree', name: 'Oven Roasted Turkey, Stuffings, Mashed Potato w/Cranberry Sauce Gravy', description: '', tags: [], imageUrl: getImageUrl('e20') },
  { id: 'e21', type: 'entree', name: 'Penne Marinara with Chicken Parmesan', description: '', tags: [], imageUrl: getImageUrl('e21') },
  { id: 'e22', type: 'entree', name: 'Penne Pasta Marinara w/ Chicken Cutlet', description: '', tags: [], imageUrl: getImageUrl('e22') },
  { id: 'e23', type: 'entree', name: 'Penne Pasta Marinara Sauce w/Garlic Chicken', description: '', tags: [], imageUrl: getImageUrl('e23') },
  { id: 'e24', type: 'entree', name: 'Penne Vodka with Grilled Chicken', description: '', tags: [], imageUrl: getImageUrl('e24') },
  { id: 'e25', type: 'entree', name: 'Pork Loin w/Mashed Potatoes', description: '', tags: [], imageUrl: getImageUrl('e25') },
  { id: 'e26', type: 'entree', name: 'Pulled BBQ Chicken with Rice and Veggies', description: '', tags: [], imageUrl: getImageUrl('e26') },
  { id: 'e27', type: 'entree', name: 'Roasted Chicken w/Rice', description: '', tags: [], imageUrl: getImageUrl('e27') },
  { id: 'e28', type: 'entree', name: 'Seared Beef Topped w/ Mashed Potatoes', description: '', tags: [], imageUrl: getImageUrl('e28') },
  { id: 'e29', type: 'entree', name: 'Shepherd\'s Pie w/ side Salad', description: '', tags: [], imageUrl: getImageUrl('e29') },
  { id: 'e30', type: 'entree', name: 'Sweetheart Meatballs over Dutch Noodles', description: '', tags: [], imageUrl: getImageUrl('e30') },
  { id: 'e31', type: 'entree', name: 'Teriyaki Chicken', description: 'Teriyaki Chicken Over Egg Noodles', tags: [], imageUrl: getImageUrl('e31') },
  { id: 'e32', type: 'entree', name: 'Teriyaki Meatballs w/ Jasmine Rice', description: '', tags: [], imageUrl: getImageUrl('e32') },
  { id: 'e33', type: 'entree', name: 'Tri-Color Tortellini with White Sauce', description: '', tags: [], imageUrl: getImageUrl('e33') },
  { id: 'e34', type: 'entree', name: 'Vegetable Soup (Optional Rice Add-On)', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('e34') },
  { id: 'e35', type: 'entree', name: 'Vodka Penne', description: 'Rigatoni w/Vodka Sauce & Grilled Chicken with side Salad', tags: [], imageUrl: getImageUrl('e35') },
  { id: 'e36', type: 'entree', name: 'White Wine Penne Pasta with Grilled Chicken and Bacon', description: '', tags: [], imageUrl: getImageUrl('e36') },
  { id: 'e37', type: 'entree', name: 'Teriyaki Egg Noodles with Grilled Chicken & Meatballs', description: '', tags: [], imageUrl: getImageUrl('e37') },
  // New July/June Additions
  { id: 's65', type: 'soup', name: 'Green Pea w/Ham', description: '', tags: [], imageUrl: getImageUrl('s65') },
  { id: 's66', type: 'soup', name: 'Creamy Cauliflower', description: '', tags: ['Vegetarian'], imageUrl: getImageUrl('s66') },
  { id: 's67', type: 'soup', name: 'Summer Veggies', description: '', tags: ['VEG'], imageUrl: getImageUrl('s67') },
  { id: 's68', type: 'soup', name: 'Shrimp Chowder', description: '', tags: [], imageUrl: getImageUrl('s68') },
  { id: 's69', type: 'soup', name: 'Split Pea', description: '', tags: ['Veg', 'GF'], imageUrl: getImageUrl('s69') },
  { id: 's70', type: 'soup', name: 'Shrimp & Corn Chowder', description: '', tags: [], imageUrl: getImageUrl('s70') },
  { id: 's71', type: 'soup', name: 'Potato Cheddar & Bacon', description: '', tags: [], imageUrl: getImageUrl('s71') },
  { id: 's72', type: 'soup', name: 'Lucky Lentil', description: '', tags: [], imageUrl: getImageUrl('s72') },
  { id: 's73', type: 'soup', name: 'Lemon Chicken Orzo', description: '', tags: [], imageUrl: getImageUrl('s73') },
  { id: 'p42', type: 'panini', name: 'Pastrami Reuben', description: '', tags: [], imageUrl: getImageUrl('p42') },
  { id: 'p43', type: 'panini', name: 'Texas Meatloaf, Bacon, Cheddar & BBQ Sauce on Texan Toast', description: '', tags: [], imageUrl: getImageUrl('p43') },
  { id: 'p44', type: 'panini', name: 'Godfather: Chicken Cutlet, Fresh Mozzarella, Bacon & Russian Dressing', description: '', tags: [], imageUrl: getImageUrl('p44') },
  { id: 'p45', type: 'panini', name: 'Smothered Chicken w/ Caramelized Onions Mushrooms, Swiss & Horseradish', description: '', tags: [], imageUrl: getImageUrl('p45') },
  { id: 'p46', type: 'panini', name: 'Chicken Cordon Bleu w/ Swiss, Tomato, Honey Mustard', description: '', tags: [], imageUrl: getImageUrl('p46') },
  { id: 'p47', type: 'panini', name: 'Pastrami Reuben on Rye', description: '', tags: [], imageUrl: getImageUrl('p47') },
  { id: 'sw45', type: 'sandwich', name: 'Grilled Chicken, Pesto Mayo, Sauteed Peppers-n-Onions, Lettuce, Tomato, Spinach in a Wrapp', description: '', tags: [], imageUrl: getImageUrl('sw45') },
  { id: 'sw46', type: 'sandwich', name: 'Egg Salad, Bacon, Lettuce, Onion, Tomato, in Spinach Wrap', description: '', tags: [], imageUrl: getImageUrl('sw46') },
  { id: 'sw47', type: 'sandwich', name: 'Roast Beef, Lettuce, Tomato, Onion, Provolone Cheese w/ Horse-Radish Cream', description: '', tags: [], imageUrl: getImageUrl('sw47') },
  { id: 'sw48', type: 'sandwich', name: 'Turkey Swiss Lettuce, Tomatoes, Cranberry, Mayo on 7 Grain', description: '', tags: [], imageUrl: getImageUrl('sw48') },
  { id: 'sw49', type: 'sandwich', name: 'Roastbeef, Fresh Mozzarella, Spinach, Sundried Tomatoes, Pesto Mayoon Spinach Wrap', description: '', tags: [], imageUrl: getImageUrl('sw49') },
  { id: 'sw50', type: 'sandwich', name: 'Egg Salad BLT on 7 Grain', description: '', tags: [], imageUrl: getImageUrl('sw50') },
  { id: 'sw51', type: 'sandwich', name: 'Shrimp Salad w/Lettuce, Tomatoes on a Wheat Bread', description: '', tags: [], imageUrl: getImageUrl('sw51') },
  { id: 'sw52', type: 'sandwich', name: 'Turkey Bacon, Pepperjack, Lettuce, Tomato, Chipotle Mayo on Semolina', description: '', tags: [], imageUrl: getImageUrl('sw52') },
  { id: 'sw53', type: 'sandwich', name: 'Pastrami Sloppy Joe in a Plain Wrapp', description: '', tags: [], imageUrl: getImageUrl('sw53') },
  { id: 'sw54', type: 'sandwich', name: 'Turkey, Bacon, Pepperjack, Lettuce, Tomatoes, & Ranch On Ciabatta', description: '', tags: [], imageUrl: getImageUrl('sw54') },
];

const createEmptyMenu = (dateStr: string): DailyMenu => ({
  date: dateStr,
  soups: Array(6).fill(null),
  specials: {
    panini: null,
    sandwich: null,
    salad: null,
    entree: null,
  },
  isPublished: false,
});

// --- Store ---

export const useMenuStore = create<MenuStore>()(
  persist(
    (set, get) => ({
      items: INITIAL_ITEMS,

      addItem: (item) => set((state) => ({ items: [...state.items, item] })),
      
      deleteItem: (id) => set((state) => ({ items: state.items.filter((i) => i.id !== id) })),

      loadCustomItems: async () => {
        try {
          const [customRes, imagesRes] = await Promise.all([
            fetch('/api/custom-items'),
            fetch('/api/generated-images')
          ]);
          
          const customItems = customRes.ok ? await customRes.json() : [];
          const generatedImages = imagesRes.ok ? await imagesRes.json() : [];
          
          const imageMap = new Map<string, string>();
          for (const img of generatedImages) {
            imageMap.set(img.itemId, img.imageUrl);
          }
          
          set((state) => {
            // Create a map of database items by ID for quick lookup
            const dbItemsById = new Map<string, MenuItem>();
            for (const item of customItems) {
              dbItemsById.set(item.id, item);
            }
            
            // Get existing custom items from current state (localStorage) that aren't in INITIAL_ITEMS
            const initialIds = new Set(INITIAL_ITEMS.map(i => i.id));
            const existingCustomItems = state.items.filter(item => !initialIds.has(item.id));
            
            // Start with ALL INITIAL_ITEMS (this ensures new items are always included)
            let updatedItems = INITIAL_ITEMS.map(item => {
              // Check if database has image for this item
              const dbItem = dbItemsById.get(item.id);
              if (dbItem && dbItem.imageUrl) {
                return { ...item, imageUrl: dbItem.imageUrl };
              }
              // Also check generated images map
              const genImage = imageMap.get(item.id);
              if (genImage) {
                return { ...item, imageUrl: genImage };
              }
              return item;
            });
            
            // Merge existing custom items from localStorage with API custom items
            // Prefer API data but keep localStorage items if not in API
            const apiCustomIds = new Set(customItems.map((i: MenuItem) => i.id));
            const newCustomItems = [
              ...customItems.filter((item: MenuItem) => !initialIds.has(item.id)),
              ...existingCustomItems.filter(item => !apiCustomIds.has(item.id))
            ];
            
            // Update all custom items with their imageUrl from generatedImages
            const updatedCustomItems = newCustomItems.map((item: MenuItem) => {
              const genImage = imageMap.get(item.id);
              if (genImage) {
                return { ...item, imageUrl: genImage };
              }
              return item;
            });
            
            return { items: [...updatedItems, ...updatedCustomItems] };
          });
        } catch (error) {
          console.error('Failed to load custom items from server:', error);
        }
      },

      menus: {},

      getMenu: (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        const state = get();
        if (state.menus[dateStr]) {
          return state.menus[dateStr];
        }
        return createEmptyMenu(dateStr);
      },

      updateMenu: (date, menuUpdate) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        set((state) => {
          const currentMenu = state.menus[dateStr] || createEmptyMenu(dateStr);
          return {
            menus: {
              ...state.menus,
              [dateStr]: { ...currentMenu, ...menuUpdate },
            },
          };
        });
      },

      publishMenu: (date) => {
        const dateStr = format(date, 'yyyy-MM-dd');
        get().updateMenu(date, { isPublished: true });
      },

      importDatabase: (items) => set({ items }),
      resetDatabase: () => set({ items: INITIAL_ITEMS }),
    }),
    {
      name: 'soup-shoppe-storage',
      version: DB_VERSION,
      migrate: (persistedState: any, version: number) => {
        if (version < DB_VERSION) {
          const existingCustomItems = persistedState.items?.filter(
            (item: MenuItem) => !INITIAL_ITEMS.find(i => i.id === item.id)
          ) || [];
          return {
            ...persistedState,
            items: [...INITIAL_ITEMS, ...existingCustomItems],
          };
        }
        return persistedState;
      },
    }
  )
);

export const useHydrated = () => {
  const [hydrated, setHydrated] = useState(false);
  const loadCustomItems = useMenuStore(state => state.loadCustomItems);
  useEffect(() => {
    const hydrateAndLoad = async () => {
      await loadCustomItems();
      setHydrated(true);
    };
    
    const unsubFinishHydration = useMenuStore.persist.onFinishHydration(() => {
      hydrateAndLoad();
    });
    if (useMenuStore.persist.hasHydrated()) {
      hydrateAndLoad();
    }
    return () => {
      unsubFinishHydration();
    };
  }, [loadCustomItems]);
  return hydrated;
};
