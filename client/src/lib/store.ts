import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { addDays, format } from 'date-fns';
import { useState, useEffect } from 'react';

// Image URLs - served from public folder
const chickenSoupImg = '/images/bowl_of_chicken_noodle_soup.png';
const chiliImg = '/images/bowl_of_beef_chili.png';
const paniniImg = '/images/grilled_chicken_panini.png';
const cobbSaladImg = '/images/fresh_cobb_salad.png';
const macCheeseImg = '/images/mac_and_cheese_entree.png';

// Database version - increment this when items change to force update
const DB_VERSION = 4;

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

const INITIAL_ITEMS: MenuItem[] = [
  // Soups (Alphabetically sorted)
  { id: 's1', type: 'soup', name: 'Angus Beef Barley', description: '', tags: [] },
  { id: 's2', type: 'soup', name: 'Athletic Freakster', description: '', tags: [] },
  { id: 's3', type: 'soup', name: 'Beef Barley', description: '', tags: [] },
  { id: 's4', type: 'soup', name: 'Beef Mushroom Barley', description: '', tags: [] },
  { id: 's5', type: 'soup', name: 'Beef Vegetables', description: '', tags: [] },
  { id: 's6', type: 'soup', name: 'Black Angus Beef Chilli', description: 'Rich beef chilli with beans', tags: ['GF', 'Comfort'], imageUrl: chiliImg },
  { id: 's7', type: 'soup', name: 'Broccoli Cheddar', description: '', tags: ['Vegetarian'] },
  { id: 's8', type: 'soup', name: 'Broccoli Cauliflower', description: '', tags: ['Vegetarian'] },
  { id: 's9', type: 'soup', name: 'Buffalo Chicken Soup', description: '', tags: [] },
  { id: 's10', type: 'soup', name: 'Butternut Squash', description: 'Roasted butternut squash with warm spices and coconut milk', tags: ['Vegan', 'GF', 'Seasonal'] },
  { id: 's10b', type: 'soup', name: 'Butternut Squash Bisque', description: '', tags: ['Vegetarian'] },
  { id: 's11', type: 'soup', name: 'Cabbage Soup', description: '', tags: ['Vegetarian'] },
  { id: 's11b', type: 'soup', name: 'Carrot Bisque', description: '', tags: ['Vegetarian'] },
  { id: 's11c', type: 'soup', name: 'Carrot Creamer', description: '', tags: ['Vegetarian'] },
  { id: 's12', type: 'soup', name: 'Carrot Ginger', description: '', tags: ['GF', 'VEG'] },
  { id: 's12b', type: 'soup', name: 'Chickpeas Carrot Bisque', description: '', tags: ['GF', 'VEG', 'Vegetarian'] },
  { id: 's13', type: 'soup', name: 'Chicken Buffalo Soup', description: '', tags: [] },
  { id: 's14', type: 'soup', name: 'Chicken Florentine', description: '', tags: [] },
  { id: 's15', type: 'soup', name: 'Chicken Lime Orzo', description: '', tags: [] },
  { id: 's16', type: 'soup', name: 'Chicken Mushroom Orzo', description: '', tags: [] },
  { id: 's17', type: 'soup', name: 'Chicken Noodle', description: 'Hearty soup with tender chicken, fresh vegetables, and egg noodles', tags: ['Classic'], imageUrl: chickenSoupImg },
  { id: 's18', type: 'soup', name: 'Chicken Pot Pie', description: '', tags: [] },
  { id: 's19', type: 'soup', name: 'Chicken Spinach & Potato', description: '', tags: [] },
  { id: 's20', type: 'soup', name: 'Chickpea Soup', description: '', tags: ['Vegetarian'] },
  { id: 's21', type: 'soup', name: 'Chickpeas Whitebeans', description: '', tags: ['Vegetarian'] },
  { id: 's22', type: 'soup', name: 'Chunky Celery', description: '', tags: ['GF', 'VEG', 'DF'] },
  { id: 's23', type: 'soup', name: 'Clam Chowder', description: '', tags: [] },
  { id: 's24', type: 'soup', name: 'Cornbeef Cabbage Chickpeas', description: '', tags: [] },
  { id: 's25', type: 'soup', name: 'Cornbeef, Cabbage, Tomato DF', description: '', tags: [] },
  { id: 's26', type: 'soup', name: 'Creamy Carrots', description: '', tags: ['Vegetarian'] },
  { id: 's27', type: 'soup', name: 'Creamy Chicken Corn', description: '', tags: [] },
  { id: 's28', type: 'soup', name: 'Creamy Chicken Rice', description: '', tags: [] },
  { id: 's29', type: 'soup', name: 'Creamy Mushroom', description: '', tags: ['Vegetarian'] },
  { id: 's30', type: 'soup', name: 'Creamy Rice Spinach', description: '', tags: ['Vegetarian'] },
  { id: 's31', type: 'soup', name: 'Creamy Tomato Basil', description: 'Rich, velvety tomato soup with fresh basil and cream', tags: ['Vegetarian'] },
  { id: 's32', type: 'soup', name: 'French Onion', description: 'Caramelized onions in rich beef broth, topped with Gruyère', tags: ['Signature', 'GF', 'DF'] },
  { id: 's33', type: 'soup', name: 'Garden Minestrone', description: 'Hearty Italian soup with fresh vegetables, beans, and pasta', tags: ['Vegan'] },
  { id: 's34', type: 'soup', name: 'Gazpacho', description: '', tags: ['VEG', 'GF', 'COLD'] },
  { id: 's35', type: 'soup', name: 'Golden Split Pea', description: '', tags: ['GF', 'VEG'] },
  { id: 's36', type: 'soup', name: 'Green Peas', description: '', tags: ['VEG'] },
  { id: 's37', type: 'soup', name: 'Green Peas Ham', description: '', tags: [] },
  { id: 's38', type: 'soup', name: 'Italian Wedding', description: '', tags: [] },
  { id: 's39', type: 'soup', name: 'Kidney Bean', description: '', tags: ['GF', 'VEG', 'DF'] },
  { id: 's40', type: 'soup', name: 'Lemon Chicken Orzo', description: '', tags: [] },
  { id: 's41', type: 'soup', name: 'Lucky Lentil', description: '', tags: ['GF', 'VEG', 'DF'] },
  { id: 's42', type: 'soup', name: 'Manhattan Clam Chowder', description: '', tags: [] },
  { id: 's43', type: 'soup', name: 'Mushroom Barley', description: '', tags: [] },
  { id: 's44', type: 'soup', name: 'Mushroom Bisque', description: '', tags: ['Vegetarian'] },
  { id: 's45', type: 'soup', name: 'New England Clam Chowder', description: '', tags: [] },
  { id: 's46', type: 'soup', name: 'Pasta Fagioli', description: '', tags: ['Vegetarian'] },
  { id: 's47', type: 'soup', name: 'Potato Bacon', description: '', tags: [] },
  { id: 's48', type: 'soup', name: 'Potato Bacon Cheddar', description: '', tags: [] },
  { id: 's49', type: 'soup', name: 'Potato Cheddar Bacon', description: '', tags: [] },
  { id: 's50', type: 'soup', name: 'Potato Soup', description: '', tags: [] },
  { id: 's51', type: 'soup', name: 'Roasted Green Peas', description: '', tags: ['VEG'] },
  { id: 's52', type: 'soup', name: 'Roasted Red Pepper Bisque', description: '', tags: ['Vegetarian'] },
  { id: 's53', type: 'soup', name: 'Rustic Tomato', description: '', tags: ['GF', 'Vegetarian'] },
  { id: 's54', type: 'soup', name: 'Santa Fe Black Bean', description: '', tags: ['Vegetarian'] },
  { id: 's55', type: 'soup', name: 'Seafood Bisque', description: 'Creamy bisque with fresh shrimp, crab, and sherry', tags: ['Premium'] },
  { id: 's56', type: 'soup', name: 'Smoked Ham Potato', description: '', tags: [] },
  { id: 's57', type: 'soup', name: 'Southwest Black Beans', description: '', tags: ['GF', 'VEG'] },
  { id: 's58', type: 'soup', name: 'Spinach Orzo', description: '', tags: ['Vegetarian'] },
  { id: 's59', type: 'soup', name: 'Summer Vegetable Soup', description: '', tags: ['Vegetarian'] },
  { id: 's60', type: 'soup', name: 'Tomato Bisque', description: '', tags: ['GF', 'Vegetarian'] },
  { id: 's61', type: 'soup', name: 'Tomato Soup', description: '', tags: ['Vegetarian'] },
  { id: 's62', type: 'soup', name: 'Vegetable Bisque', description: '', tags: ['Vegetarian'] },
  { id: 's63', type: 'soup', name: 'White Chilli Turkey', description: 'Spicy white bean chili with turkey', tags: ['GF', 'Spicy'] },
  { id: 's64', type: 'soup', name: 'Wild Rice & Vegetable', description: '', tags: [] },

  // Paninis (Alphabetically sorted)
  { id: 'p1', type: 'panini', name: 'BBQ Meatballs', description: '', tags: [] },
  { id: 'p2', type: 'panini', name: 'BBQ Pulled Pork', description: '', tags: [] },
  { id: 'p3', type: 'panini', name: 'BBQ Turkey Bacon', description: '', tags: [] },
  { id: 'p4', type: 'panini', name: 'Beef Corned Reuben', description: '', tags: [] },
  { id: 'p5', type: 'panini', name: 'Broccoli Cheddar', description: '', tags: ['Vegetarian'] },
  { id: 'p6', type: 'panini', name: 'Buffalo Chicken', description: '', tags: [] },
  { id: 'p7', type: 'panini', name: 'Buffalo Chicken Cutlet, Blue Cheese, Bacon, Lettuce Tomato in Ciabatta', description: '', tags: [] },
  { id: 'p8', type: 'panini', name: 'Buffalo Chicken Cutlet, Blue Cheese, Chipotle Mayo w/Cheddar', description: '', tags: [] },
  { id: 'p9', type: 'panini', name: 'Corn Beef, Coleslaw, Swiss Cheese, 1000 Island Dressing', description: '', tags: [] },
  { id: 'p10', type: 'panini', name: 'Crab Cake', description: '', tags: [] },
  { id: 'p11', type: 'panini', name: 'Cuban Panini: Ham, Pork Pickle, Swiss Cheese, w/ Mustard', description: '', tags: [] },
  { id: 'p12', type: 'panini', name: 'Curried Chicken Salad', description: '', tags: [] },
  { id: 'p13', type: 'panini', name: 'Egg Salad', description: '', tags: ['Vegetarian'] },
  { id: 'p14', type: 'panini', name: 'Grilled Chicken', description: '', tags: [], imageUrl: paniniImg },
  { id: 'p15', type: 'panini', name: 'Grilled Chicken, Bacon, Pesto-Mayo, Sauteed Onions, Pepper Jack Cheese, Lettuce & Tomato on Ciabatta', description: '', tags: [] },
  { id: 'p16', type: 'panini', name: 'Grilled Chicken, Sauteed Pepper-Onions, Chipotle Mayo w/Cheddar', description: '', tags: [] },
  { id: 'p17', type: 'panini', name: 'Grilled Chicken Pesto, Bacon, Peppers, Onions, Mix Shreaded Cheese, Lettuce, Tomato on Ciabatta', description: '', tags: [] },
  { id: 'p18', type: 'panini', name: 'Grilled Chicken with Bacon, Chipotle & Pepper Jack', description: '', tags: [] },
  { id: 'p19', type: 'panini', name: 'Ham, Pickle Ham, Mustard, Cheddar Cheese, Lettuce & Tomato', description: '', tags: [] },
  { id: 'p20', type: 'panini', name: 'Ham, Swiss Cheese, Cole Slaw w/ Russian Dressing in Ciabatta', description: '', tags: [] },
  { id: 'p21', type: 'panini', name: 'Ham, Turkey Joe, Coleslaw, Russian Dressing, Swiss, Lettuce, Tomato in Ciabatta', description: '', tags: [] },
  { id: 'p22', type: 'panini', name: 'Ham Honey, Mustard, Sauteed Onions w/Provolone Cheese', description: '', tags: [] },
  { id: 'p23', type: 'panini', name: 'Ham Mozzarella, Sweet Onion Relish', description: '', tags: [] },
  { id: 'p24', type: 'panini', name: 'Herb Roasted Chicken w/ Mashed Potatoes', description: '', tags: [] },
  { id: 'p25', type: 'panini', name: 'Honey Mustard, Cranberry Jam, Swiss Cheese, Ham, Bacon, Lettuce & Tomato', description: '', tags: [] },
  { id: 'p26', type: 'panini', name: 'Meatball Parmesan', description: '', tags: [] },
  { id: 'p27', type: 'panini', name: 'Pastrami in 1000 Island dressing, Mustard w/ Swiss Cheese', description: '', tags: [] },
  { id: 'p28', type: 'panini', name: 'Pastrami Ruben, Sauerkraut, Swiss Cheese, Russian Dressing, Lettuce Tomato on Ciabatta', description: '', tags: [] },
  { id: 'p29', type: 'panini', name: 'Pastrami, Sauerkraut, Swiss Cheese, Russian Dressing, Lettuce, Tomato on Ciabatta', description: '', tags: [] },
  { id: 'p30', type: 'panini', name: 'Pesto Mayo, Grilled Chicken, Bacon, Lettuce & Tomato in Ciabatta', description: '', tags: [] },
  { id: 'p31', type: 'panini', name: 'Pork Chop', description: '', tags: [] },
  { id: 'p32', type: 'panini', name: 'Roast Beef, Lettuce, Tomatoes, Provolone, Horseradish Cream', description: '', tags: [] },
  { id: 'p33', type: 'panini', name: 'Shreaded Chicken, BBQ BAcon, Sauteed Pepper Onions, Cheddar Cheese', description: '', tags: [] },
  { id: 'p34', type: 'panini', name: 'Smoked Ham BBQ', description: 'Smoked Ham, Bacon, Tomatoes, Cheddar BBQ sauce', tags: [] },
  { id: 'p35', type: 'panini', name: 'Tuna Melt', description: '', tags: [] },
  { id: 'p36', type: 'panini', name: 'Turkey & Cranberry', description: '', tags: [] },
  { id: 'p37', type: 'panini', name: 'Turkey, Bacon, Cheddar, Tomato & Honeymustard', description: '', tags: [] },
  { id: 'p38', type: 'panini', name: 'Turkey, Bacon, Ham, Honey Mustard, Lettuce, Tomato & Swiss Cheese', description: '', tags: [] },
  { id: 'p39', type: 'panini', name: 'Turkey, Bacon, Pepperjack Cheese, Lettuce, Tomato w/ Ranch Dressing', description: '', tags: [] },
  { id: 'p40', type: 'panini', name: 'Turkey, Brie Cheese, Chipotle Mayo', description: '', tags: [] },
  { id: 'p41', type: 'panini', name: 'Ham Bacon on Ciabatta', description: 'Ham and bacon on fresh ciabatta bread', tags: [] },

  // Sandwiches (Alphabetically sorted)
  { id: 'sw1', type: 'sandwich', name: 'Asian Grilled Chicken, Carrots, Tomato, Zucchini, Lettuce in Spinach Wrap', description: '', tags: [] },
  { id: 'sw2', type: 'sandwich', name: 'Asian Sesame Grilled Chicken, Carrot, Cucumber in Sundried Tomato Wrap', description: '', tags: [] },
  { id: 'sw3', type: 'sandwich', name: 'BBQ Grilled Chicken, Cheddar Cheese, Potato Salad & Mix Greens in Semolina Bread', description: '', tags: [] },
  { id: 'sw4', type: 'sandwich', name: 'BBQ Grilled Chicken, Cheddar Cheese, Potato Salad in Spinach Wrap', description: '', tags: [] },
  { id: 'sw5', type: 'sandwich', name: 'Blackened Chicken, Southwest Salad, Romaine, Tomato, Cucumber, Carrots, Corn Salsa, Red Onions with Chipotle Ranch', description: '', tags: [] },
  { id: 'sw6', type: 'sandwich', name: 'Buffalo Chicken, Bacon, Blue Cheese, Lettuce & Tomatoes', description: '', tags: [] },
  { id: 'sw7', type: 'sandwich', name: 'Caprese Chicken', description: 'Grilled Chicken, Balsamic Glaze, Mix Greens, Mozzarella & Tomato', tags: [] },
  { id: 'sw8', type: 'sandwich', name: 'Chicken, Bacon, Lettuce, Tomato, Ranch Dressing in Spinach Wrapp', description: '', tags: [] },
  { id: 'sw9', type: 'sandwich', name: 'Chicken Caprese Mozzarella, Tomato, Basil and Balsamic Glaze in Sundried Tomato Wrap', description: '', tags: [] },
  { id: 'sw10', type: 'sandwich', name: 'Chicken Cutlet, Bacon, Mayo Lettuce & Tomato in Spinach Wrap', description: '', tags: [] },
  { id: 'sw11', type: 'sandwich', name: 'Cobb Salad', description: '', tags: [] },
  { id: 'sw12', type: 'sandwich', name: 'Cod Sandwich', description: '', tags: [] },
  { id: 'sw13', type: 'sandwich', name: 'Corn Beef, Coleslaw, Swiss Cheese, 1000 Island Dressing', description: '', tags: [] },
  { id: 'sw14', type: 'sandwich', name: 'Crab Salad', description: '', tags: [] },
  { id: 'sw15', type: 'sandwich', name: 'Curried Chicken Salad w/ Spinach & Miso Tomato', description: '', tags: [] },
  { id: 'sw16', type: 'sandwich', name: 'Egg Salad, Bacon, Spinach, Lettuce, Tomato in a Wrapp', description: '', tags: ['Vegetarian'] },
  { id: 'sw17', type: 'sandwich', name: 'Egg Salad Spinach Tomatoes Honeymustard', description: '', tags: ['Vegetarian'] },
  { id: 'sw18', type: 'sandwich', name: 'Grilled BBQ Chicken, Bacon, Potato Salad, Cheddar Cheese, Mix Greens in Spinach Wrap', description: '', tags: [] },
  { id: 'sw19', type: 'sandwich', name: 'Grilled BBQ Chicken, CHeddar Cheese, Potato Salad Organic Mix Green in a Wrapp', description: '', tags: [] },
  { id: 'sw20', type: 'sandwich', name: 'Grilled Chicken, American Cheese, Avocado, Mayo, Lettuce & Tomato in Wrap', description: '', tags: [] },
  { id: 'sw21', type: 'sandwich', name: 'Grilled Chicken, Buffalo, Bacon, Cheddar Cheese, Lettuce & Tomato in Wrap', description: '', tags: [] },
  { id: 'sw22', type: 'sandwich', name: 'Grilled Chicken Bacon Cheddar Tomato', description: '', tags: [] },
  { id: 'sw23', type: 'sandwich', name: 'Grilled Chichecn, Sauteed Onions, Roasted Red Pepper & Spinach Wrapp', description: '', tags: [] },
  { id: 'sw24', type: 'sandwich', name: 'Halana Wrap: Grilled Chicken, American Cheese, Avocado, Mayo, Lettuce & Tomato', description: '', tags: [] },
  { id: 'sw25', type: 'sandwich', name: 'Ham CHeddar, Pickle, Lettuce, Tomato- 1000 Island Dressing', description: '', tags: [] },
  { id: 'sw26', type: 'sandwich', name: 'Ham Mozzarella Sweet Onion Relish Balsamic Glaze', description: '', tags: [] },
  { id: 'sw27', type: 'sandwich', name: 'Ham Prosciutto Roasted Peppers Pesto', description: '', tags: [] },
  { id: 'sw28', type: 'sandwich', name: 'Herb Roasted Turkey Pesto', description: '', tags: [] },
  { id: 'sw29', type: 'sandwich', name: 'Homemade Chicken Pot Pie', description: '', tags: [] },
  { id: 'sw30', type: 'sandwich', name: 'Jerk Roasted Chicken with Mashed Potatoes', description: '', tags: [] },
  { id: 'sw31', type: 'sandwich', name: 'Pastrami, Coleslaw, Pickle, Lettuce, Tomato, Swiss Cheese in Whole wheat Wrapp', description: '', tags: [] },
  { id: 'sw32', type: 'sandwich', name: 'Roasted Turkey Portobello Lettuce Tomato Pesto', description: '', tags: [] },
  { id: 'sw33', type: 'sandwich', name: 'Smoked Ham, Sloppy Joes, Coles Slaw, Swiss Cheese & Russian Dressing', description: '', tags: [] },
  { id: 'sw34', type: 'sandwich', name: 'Tuna Fish', description: 'Tunafish Salad with Swiss Springmix & Tomatoes on Focaccia Bread', tags: [] },
  { id: 'sw35', type: 'sandwich', name: 'Turkey, Bacon, Lettuce, Tomato with Pesto Mayo in Spinach Wrap', description: '', tags: [] },
  { id: 'sw36', type: 'sandwich', name: 'Turkey Club, Mayo, Swiss Cheese, Bacon, Avocado, Lettuce Tomatoes', description: '', tags: [] },
  { id: 'sw37', type: 'sandwich', name: 'Turkey Club Wrap', description: '', tags: [] },
  { id: 'sw38', type: 'sandwich', name: 'Turkey, Bacon, Lettuce, Tomato, Mayo in Semolina Bread', description: '', tags: [] },
  { id: 'sw39', type: 'sandwich', name: 'Turkey, BLT, Avocado and Mayo', description: '', tags: [] },
  { id: 'sw40', type: 'sandwich', name: 'Turkey, Brie Cheese, Chipotle Mayo', description: '', tags: [] },
  { id: 'sw41', type: 'sandwich', name: 'Turkey, Brie Cheese, Cranberries, Lattuce, Tomatoes Mayo in Semolina Bread', description: '', tags: [] },
  { id: 'sw42', type: 'sandwich', name: 'Turkey, Fig Jam, Brie Cheese, Honey Mustard, Lettuce, Tomato in Spinach Bread', description: '', tags: [] },
  { id: 'sw43', type: 'sandwich', name: 'Turkey Swiss Cheese BLT Pesto', description: '', tags: [] },
  { id: 'sw44', type: 'sandwich', name: 'Ham Bacon in a Wrapp', description: 'Ham and bacon wrapped in a fresh tortilla', tags: [] },

  // Salads (Alphabetically sorted)
  { id: 'sl1', type: 'salad', name: 'Apple Salad, Cucumber, Tomato, Onions, Carrot, w/ Italian Dressing', description: '', tags: ['Vegetarian'] },
  { id: 'sl2', type: 'salad', name: 'Arugula Mango Salad, Tomato, Cucumber, Onions, Carrots, Walnuts w/ Poppy Seed Dressing', description: '', tags: ['Vegetarian'] },
  { id: 'sl3', type: 'salad', name: 'Asian Salad: Chicken, Madarine, Almonds, Carrots, Cucumber, Tomato, Onions w/ Sesame Seed Asian Dressing', description: '', tags: [] },
  { id: 'sl4', type: 'salad', name: 'Asian Sesame Grilled Chicken Salad, Romaine, Mix Greens, Carrots, Mandarins, Tomato, Cucumber, Peppers with Asian Dressing', description: '', tags: [] },
  { id: 'sl5', type: 'salad', name: 'Blackened Chicken Caesar', description: '', tags: [] },
  { id: 'sl6', type: 'salad', name: 'Blueberries, Cranberries, Strawberries, Feta Cheese, Spinach, Salad, Walnut, Carrots, Tomatoes, Cucumber and Onion', description: '', tags: ['Vegetarian'] },
  { id: 'sl7', type: 'salad', name: 'Chef-Salad: Turkey, Ham, Romaine, Swiss, Hard Boiled Eggs, Cucumber, Carrots, Onion & Tomato w/ Ranch Dressing', description: '', tags: [] },
  { id: 'sl8', type: 'salad', name: 'Chicken Bruschetta, Mixed Greens, Chicken, Fresh Mozzarella, Bruschetta toppings w/Balsamic', description: '', tags: [] },
  { id: 'sl9', type: 'salad', name: 'Chicken Caesar Salad', description: '', tags: [] },
  { id: 'sl10', type: 'salad', name: 'Classic Cobb', description: 'Grilled Chicken, Bacon, Tomato, Cucumber, Boiled Egg, Red Onions, Crumbled Blue Cheese w Ranch Dressing', tags: [], imageUrl: cobbSaladImg },
  { id: 'sl11', type: 'salad', name: 'Green Salad: Romaine, Grilled Chicken, Tomato, Cucumber, Carrots, Red Onions, Feta Cheese, Stuffed Leaves, Olives in Greek Dressing', description: '', tags: [] },
  { id: 'sl12', type: 'salad', name: 'Greek Salad, Romaine Lettuce, Red Onions, Cucumber, Carrots, Tomatoes, Stuffed Leaves, Feta Cheese, Grilled Chicken in Greek Dressing', description: '', tags: [] },
  { id: 'sl13', type: 'salad', name: 'Grilled Chicken Caesar', description: '', tags: [] },
  { id: 'sl14', type: 'salad', name: 'Mango- Cranberry Salad, Crrots, Cucumber, Tomato, Onions in Italian Dressing', description: '', tags: [] },
  { id: 'sl15', type: 'salad', name: 'Peach, Cranberries, Tomato, Onions, Cucumber, Feta Cheese w/ Poppyseed Dressing', description: '', tags: ['Vegetarian'] },
  { id: 'sl16', type: 'salad', name: 'Strawberry, Cranberry, Almonds, Feta Cheese, Cucumber, Carrots, Tomatoes, Poppy Seed Dressing', description: '', tags: ['Vegetarian'] },
  { id: 'sl17', type: 'salad', name: 'Summer Berry', description: 'Mixed Greens, Tomatoes, Cucumbers, Grilled Chicken, Grapes, Pecans, Feta Cheese, Balsamic', tags: ['Seasonal'] },
  { id: 'sl18', type: 'salad', name: 'Tropical Salad: Mango, Strawberry, Organic MixGreen, Tomato, Cucumber, Onions in Italian Dressing', description: '', tags: ['Vegetarian'] },

  // Entrees (Alphabetically sorted)
  { id: 'e1', type: 'entree', name: '7 Cheese-Mac n Cheese', description: '', tags: ['Vegetarian'] },
  { id: 'e2', type: 'entree', name: 'Asian Fried Rice with Chicken', description: '', tags: [] },
  { id: 'e3', type: 'entree', name: 'Beef Stew w/ Egg Noodles', description: '', tags: [] },
  { id: 'e4', type: 'entree', name: 'Breaded Four Cheese, Ravioli, w/ Marinara Sauce', description: '', tags: ['Vegetarian'] },
  { id: 'e5', type: 'entree', name: 'Chicken Cutlet, Bacon, Mayo', description: '', tags: [] },
  { id: 'e6', type: 'entree', name: 'Chicken Lo Mein w/Vegetables', description: '', tags: [] },
  { id: 'e7', type: 'entree', name: 'Chicken Mulligatawny', description: '', tags: [] },
  { id: 'e8', type: 'entree', name: 'Chicken Stir Fry', description: '', tags: [] },
  { id: 'e9', type: 'entree', name: 'Chinese Chicken Fried Rice w/ Vegetables', description: '', tags: [] },
  { id: 'e10', type: 'entree', name: 'Creamy Chicken Rigatoni', description: '', tags: [] },
  { id: 'e11', type: 'entree', name: 'Creamy Mushroom Chicken with Rice', description: '', tags: [] },
  { id: 'e12', type: 'entree', name: 'Creamy Mushroom Penne Pasta w/ Grilled Chicken', description: '', tags: [] },
  { id: 'e13', type: 'entree', name: 'Egg Noodle with Teriyaki Meatballs', description: '', tags: [] },
  { id: 'e14', type: 'entree', name: 'Herb Roasted Chicken w/ Mashed Potatoes & Vegetables', description: '', tags: [] },
  { id: 'e15', type: 'entree', name: 'Herb Roasted Chicken with Mashed Potatoes and Sauteed Veggies', description: '', tags: [] },
  { id: 'e16', type: 'entree', name: 'Honey Roasted Chicken Pot Pie', description: '', tags: [] },
  { id: 'e17', type: 'entree', name: 'Jerk Roasted Chicken w/ Mashed Potatoes', description: '', tags: [] },
  { id: 'e18', type: 'entree', name: 'Mac & Cheese', description: '', tags: ['Vegetarian'], imageUrl: macCheeseImg },
  { id: 'e19', type: 'entree', name: 'Mac N Cheese w/Bacon', description: '', tags: [] },
  { id: 'e20', type: 'entree', name: 'Oven Roasted Turkey, Stuffings, Mashed Potato w/Cranberry Sauce Gravy', description: '', tags: [] },
  { id: 'e21', type: 'entree', name: 'Penne Marinara with Chicken Parmesan', description: '', tags: [] },
  { id: 'e22', type: 'entree', name: 'Penne Pasta Marinara w/ Chicken Cutlet', description: '', tags: [] },
  { id: 'e23', type: 'entree', name: 'Penne Pasta Marinara Sauce w/Garlic Chicken', description: '', tags: [] },
  { id: 'e24', type: 'entree', name: 'Penne Vodka with Grilled Chicken', description: '', tags: [] },
  { id: 'e25', type: 'entree', name: 'Pork Loin w/Mashed Potatoes', description: '', tags: [] },
  { id: 'e26', type: 'entree', name: 'Pulled BBQ Chicken with Rice and Veggies', description: '', tags: [] },
  { id: 'e27', type: 'entree', name: 'Roasted Chicken w/Rice', description: '', tags: [] },
  { id: 'e28', type: 'entree', name: 'Seared Beef Topped w/ Mashed Potatoes', description: '', tags: [] },
  { id: 'e29', type: 'entree', name: 'Shepherd\'s Pie w/ side Salad', description: '', tags: [] },
  { id: 'e30', type: 'entree', name: 'Sweetheart Meatballs over Dutch Noodles', description: '', tags: [] },
  { id: 'e31', type: 'entree', name: 'Teriyaki Chicken', description: 'Teriyaki Chicken Over Egg Noodles', tags: [] },
  { id: 'e32', type: 'entree', name: 'Teriyaki Meatballs w/ Jasmine Rice', description: '', tags: [] },
  { id: 'e33', type: 'entree', name: 'Tri-Color Tortellini with White Sauce', description: '', tags: [] },
  { id: 'e34', type: 'entree', name: 'Vegetable Soup (Optional Rice Add-On)', description: '', tags: ['Vegetarian'] },
  { id: 'e35', type: 'entree', name: 'Vodka Penne', description: 'Rigatoni w/Vodka Sauce & Grilled Chicken with side Salad', tags: [] },
  { id: 'e36', type: 'entree', name: 'White Wine Penne Pasta with Grilled Chicken and Bacon', description: '', tags: [] },
  { id: 'e37', type: 'entree', name: 'Teriyaki Egg Noodles with Grilled Chicken & Meatballs', description: '', tags: [] },
  // New July/June Additions
  { id: 's65', type: 'soup', name: 'Green Pea w/Ham', description: '', tags: [] },
  { id: 's66', type: 'soup', name: 'Creamy Cauliflower', description: '', tags: ['Vegetarian'] },
  { id: 's67', type: 'soup', name: 'Summer Veggies', description: '', tags: ['VEG'] },
  { id: 's68', type: 'soup', name: 'Shrimp Chowder', description: '', tags: [] },
  { id: 's69', type: 'soup', name: 'Split Pea', description: '', tags: ['Veg', 'GF'] },
  { id: 's70', type: 'soup', name: 'Shrimp & Corn Chowder', description: '', tags: [] },
  { id: 's71', type: 'soup', name: 'Potato Cheddar & Bacon', description: '', tags: [] },
  { id: 's72', type: 'soup', name: 'Lucky Lentil', description: '', tags: [] },
  { id: 's73', type: 'soup', name: 'Lemon Chicken Orzo', description: '', tags: [] },
  { id: 'p41', type: 'panini', name: 'Grilled Chicken, Bacon, Chipotle Mayo, Pepperjack Cheese', description: '', tags: [] },
  { id: 'p42', type: 'panini', name: 'Pastrami Reuben', description: '', tags: [] },
  { id: 'p43', type: 'panini', name: 'Texas Meatloaf, Bacon, Cheddar & BBQ Sauce on Texan Toast', description: '', tags: [] },
  { id: 'p44', type: 'panini', name: 'Godfather: Chicken Cutlet, Fresh Mozzarella, Bacon & Russian Dressing', description: '', tags: [] },
  { id: 'p45', type: 'panini', name: 'Smothered Chicken w/ Caramelized Onions Mushrooms, Swiss & Horseradish', description: '', tags: [] },
  { id: 'p46', type: 'panini', name: 'Chicken Cordon Bleu w/ Swiss, Tomato, Honey Mustard', description: '', tags: [] },
  { id: 'p47', type: 'panini', name: 'Pastrami Reuben on Rye', description: '', tags: [] },
  { id: 'sw44', type: 'sandwich', name: 'Turkey Club, Bacon, Lettuce, Tomatoes, Mayo on White Bread', description: '', tags: [] },
  { id: 'sw45', type: 'sandwich', name: 'Grilled Chicken, Pesto Mayo, Sauteed Peppers-n-Onions, Lettuce, Tomato, Spinach in a Wrapp', description: '', tags: [] },
  { id: 'sw46', type: 'sandwich', name: 'Egg Salad, Bacon, Lettuce, Onion, Tomato, in Spinach Wrap', description: '', tags: [] },
  { id: 'sw47', type: 'sandwich', name: 'Roast Beef, Lettuce, Tomato, Onion, Provolone Cheese w/ Horse-Radish Cream', description: '', tags: [] },
  { id: 'sw48', type: 'sandwich', name: 'Turkey Swiss Lettuce, Tomatoes, Cranberry, Mayo on 7 Grain', description: '', tags: [] },
  { id: 'sw49', type: 'sandwich', name: 'Roastbeef, Fresh Mozzarella, Spinach, Sundried Tomatoes, Pesto Mayoon Spinach Wrap', description: '', tags: [] },
  { id: 'sw50', type: 'sandwich', name: 'Egg Salad BLT on 7 Grain', description: '', tags: [] },
  { id: 'sw51', type: 'sandwich', name: 'Shrimp Salad w/Lettuce, Tomatoes on a Wheat Bread', description: '', tags: [] },
  { id: 'sw52', type: 'sandwich', name: 'Turkey Bacon, Pepperjack, Lettuce, Tomato, Chipotle Mayo on Semolina', description: '', tags: [] },
  { id: 'sw53', type: 'sandwich', name: 'Pastrami Sloppy Joe in a Plain Wrapp', description: '', tags: [] },
  { id: 'sw54', type: 'sandwich', name: 'Turkey, Bacon, Pepperjack, Lettuce, Tomatoes, & Ranch On Ciabatta', description: '', tags: [] },
  { id: 'sl19', type: 'salad', name: 'South beach Salad: Strawberry, Blueberry, Grapes, Cucumber, Tomato, Onions w/Grilled Chicken', description: '', tags: [] },
  { id: 'sl20', type: 'salad', name: 'Tropical Salad: Grilled Chicken, Pineapple, Mandarin, Tomatoes, Cucumber, Onions, Carrots w/ Poppyseed Dressing', description: '', tags: [] },
  { id: 'sl21', type: 'salad', name: 'Apple Salad, Blueberries, Onion, Cucumber, Tomato w/ Italian Dressing', description: '', tags: [] },
  { id: 'sl22', type: 'salad', name: 'SpringMix, Grilled Chicken, Cucumbers, Tomatoes, Cranberries, Almonds, Feta w/ Balsamic', description: '', tags: [] },
  { id: 'e37', type: 'entree', name: 'Chicken Cacciatore Rice', description: '', tags: [] },
  { id: 'e38', type: 'entree', name: 'Chinese Fried Rice w/ Chicken', description: '', tags: [] },
  { id: 'e39', type: 'entree', name: 'Pork Loin w/ Mashed Potato & Vegetables', description: '', tags: [] },
  { id: 'e40', type: 'entree', name: 'Shredded BBQ Chicken w/ Roasted Potatoes', description: '', tags: [] },
  { id: 'e41', type: 'entree', name: 'Barbeque Chicken Sliders, Sauteed Onions w/ Mac n Cheese', description: '', tags: [] },
  { id: 'e42', type: 'entree', name: 'Chicken Francese w/Rice', description: '', tags: [] },
  { id: 'e43', type: 'entree', name: 'Smoked Ham - Mac n Cheese', description: '', tags: [] },
  { id: 'e44', type: 'entree', name: 'Beef Goulash Over Noodles', description: '', tags: [] },
  { id: 'e45', type: 'entree', name: 'Chicken Parmesan over Linguine', description: '', tags: [] },
  { id: 'e46', type: 'entree', name: 'Shrimp Scampi over Pasta', description: '', tags: [] },
  { id: 'e47', type: 'entree', name: 'Chicken Francese over Pasta', description: '', tags: [] },
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
          
          set(() => {
            // Create a map of database items by ID for quick lookup
            const dbItemsById = new Map<string, MenuItem>();
            for (const item of customItems) {
              dbItemsById.set(item.id, item);
            }
            
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
            
            // Add database custom items that don't exist in INITIAL_ITEMS
            const initialIds = new Set(INITIAL_ITEMS.map(i => i.id));
            const newCustomItems = customItems.filter((item: MenuItem) => !initialIds.has(item.id));
            
            return { items: [...updatedItems, ...newCustomItems] };
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
