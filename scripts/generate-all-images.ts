import OpenAI from 'openai';
import { v2 as cloudinary } from 'cloudinary';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Pool } from 'pg';

// Configure OpenAI
const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || 'https://api.openai.com/v1',
});

// Configure Cloudinary - extract cloud name from URL if needed
function extractCloudName(value: string): string {
  if (value.includes('cloudinary://')) {
    const match = value.match(/@([^/\s]+)$/);
    return match ? match[1] : value;
  }
  return value;
}

const cloudName = extractCloudName(process.env.CLOUDINARY_CLOUD_NAME || 'dlcrh8uee');
const apiKey = process.env.CLOUDINARY_API_KEY || '';
const apiSecret = process.env.CLOUDINARY_API_SECRET || '';

console.log(`Cloudinary config: cloud_name=${cloudName}, api_key=${apiKey.substring(0, 5)}...`);

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

// Configure Database
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const GENERATED_IMAGES_DIR = join(process.cwd(), "public", "generated-images");

if (!existsSync(GENERATED_IMAGES_DIR)) {
  mkdirSync(GENERATED_IMAGES_DIR, { recursive: true });
}

// Load existing Cloudinary URLs from database
async function getExistingCloudinaryUrls(): Promise<Record<string, string>> {
  const result = await pool.query('SELECT item_id, image_url FROM generated_images WHERE image_url LIKE $1', ['%cloudinary%']);
  const urls: Record<string, string> = {};
  for (const row of result.rows) {
    urls[row.item_id] = row.image_url;
  }
  return urls;
}

// Save to database
async function saveToDatabase(itemId: string, cloudinaryUrl: string): Promise<void> {
  await pool.query(
    `INSERT INTO generated_images (item_id, image_url) 
     VALUES ($1, $2) 
     ON CONFLICT (item_id) DO UPDATE SET image_url = $2`,
    [itemId, cloudinaryUrl]
  );
  
  // Also update menu_items if it exists
  await pool.query(
    `UPDATE menu_items SET image_url = $1 WHERE id = $2`,
    [cloudinaryUrl, itemId]
  );
}

const MENU_ITEMS = [
  { id: 's1', type: 'soup', name: 'Angus Beef Barley' },
  { id: 's2', type: 'soup', name: 'Athletic Freakster' },
  { id: 's3', type: 'soup', name: 'Beef Barley' },
  { id: 's4', type: 'soup', name: 'Beef Mushroom Barley' },
  { id: 's5', type: 'soup', name: 'Beef Vegetables' },
  { id: 's6', type: 'soup', name: 'Black Angus Beef Chilli' },
  { id: 's7', type: 'soup', name: 'Broccoli Cheddar' },
  { id: 's8', type: 'soup', name: 'Broccoli Cauliflower' },
  { id: 's9', type: 'soup', name: 'Buffalo Chicken Soup' },
  { id: 's10', type: 'soup', name: 'Butternut Squash' },
  { id: 's10b', type: 'soup', name: 'Butternut Squash Bisque' },
  { id: 's11', type: 'soup', name: 'Cabbage Soup' },
  { id: 's11b', type: 'soup', name: 'Carrot Bisque' },
  { id: 's11c', type: 'soup', name: 'Carrot Creamer' },
  { id: 's12', type: 'soup', name: 'Carrot Ginger' },
  { id: 's12b', type: 'soup', name: 'Chickpeas Carrot Bisque' },
  { id: 's13', type: 'soup', name: 'Chicken Buffalo Soup' },
  { id: 's14', type: 'soup', name: 'Chicken Florentine' },
  { id: 's15', type: 'soup', name: 'Chicken Lime Orzo' },
  { id: 's16', type: 'soup', name: 'Chicken Mushroom Orzo' },
  { id: 's17', type: 'soup', name: 'Chicken Noodle' },
  { id: 's18', type: 'soup', name: 'Chicken Pot Pie' },
  { id: 's19', type: 'soup', name: 'Chicken Spinach & Potato' },
  { id: 's20', type: 'soup', name: 'Chickpea Soup' },
  { id: 's21', type: 'soup', name: 'Chickpeas Whitebeans' },
  { id: 's22', type: 'soup', name: 'Chunky Celery' },
  { id: 's23', type: 'soup', name: 'Clam Chowder' },
  { id: 's24', type: 'soup', name: 'Cornbeef Cabbage Chickpeas' },
  { id: 's25', type: 'soup', name: 'Cornbeef, Cabbage, Tomato' },
  { id: 's26', type: 'soup', name: 'Creamy Carrots' },
  { id: 's27', type: 'soup', name: 'Creamy Chicken Corn' },
  { id: 's28', type: 'soup', name: 'Creamy Chicken Rice' },
  { id: 's29', type: 'soup', name: 'Creamy Mushroom' },
  { id: 's30', type: 'soup', name: 'Creamy Rice Spinach' },
  { id: 's31', type: 'soup', name: 'Creamy Tomato Basil' },
  { id: 's32', type: 'soup', name: 'French Onion' },
  { id: 's33', type: 'soup', name: 'Garden Minestrone' },
  { id: 's34', type: 'soup', name: 'Gazpacho' },
  { id: 's35', type: 'soup', name: 'Golden Split Pea' },
  { id: 's36', type: 'soup', name: 'Green Peas' },
  { id: 's37', type: 'soup', name: 'Green Peas Ham' },
  { id: 's38', type: 'soup', name: 'Italian Wedding' },
  { id: 's39', type: 'soup', name: 'Kidney Bean' },
  { id: 's40', type: 'soup', name: 'Lemon Chicken Orzo' },
  { id: 's41', type: 'soup', name: 'Lucky Lentil' },
  { id: 's42', type: 'soup', name: 'Manhattan Clam Chowder' },
  { id: 's43', type: 'soup', name: 'Mushroom Barley' },
  { id: 's44', type: 'soup', name: 'Mushroom Bisque' },
  { id: 's45', type: 'soup', name: 'New England Clam Chowder' },
  { id: 's46', type: 'soup', name: 'Pasta Fagioli' },
  { id: 's47', type: 'soup', name: 'Potato Bacon' },
  { id: 's48', type: 'soup', name: 'Potato Bacon Cheddar' },
  { id: 's49', type: 'soup', name: 'Potato Cheddar Bacon' },
  { id: 's50', type: 'soup', name: 'Potato Soup' },
  { id: 's51', type: 'soup', name: 'Roasted Green Peas' },
  { id: 's52', type: 'soup', name: 'Roasted Red Pepper Bisque' },
  { id: 's53', type: 'soup', name: 'Rustic Tomato' },
  { id: 's54', type: 'soup', name: 'Santa Fe Black Bean' },
  { id: 's55', type: 'soup', name: 'Seafood Bisque' },
  { id: 's56', type: 'soup', name: 'Smoked Ham Potato' },
  { id: 's57', type: 'soup', name: 'Southwest Black Beans' },
  { id: 's58', type: 'soup', name: 'Spinach Orzo' },
  { id: 's59', type: 'soup', name: 'Summer Vegetable Soup' },
  { id: 's60', type: 'soup', name: 'Tomato Bisque' },
  { id: 's61', type: 'soup', name: 'Tomato Soup' },
  { id: 's62', type: 'soup', name: 'Vegetable Bisque' },
  { id: 's63', type: 'soup', name: 'White Chilli Turkey' },
  { id: 's64', type: 'soup', name: 'Wild Rice & Vegetable' },
  { id: 's65', type: 'soup', name: 'Green Pea w/Ham' },
  { id: 's66', type: 'soup', name: 'Creamy Cauliflower' },
  { id: 's67', type: 'soup', name: 'Summer Veggies' },
  { id: 's68', type: 'soup', name: 'Shrimp Chowder' },
  { id: 's69', type: 'soup', name: 'Split Pea' },
  { id: 's70', type: 'soup', name: 'Shrimp & Corn Chowder' },
  { id: 's71', type: 'soup', name: 'Potato Cheddar & Bacon' },
  { id: 's72', type: 'soup', name: 'Lucky Lentil' },
  { id: 's73', type: 'soup', name: 'Lemon Chicken Orzo' },
  { id: 'p1', type: 'panini', name: 'BBQ Meatballs' },
  { id: 'p2', type: 'panini', name: 'BBQ Pulled Pork' },
  { id: 'p3', type: 'panini', name: 'BBQ Turkey Bacon' },
  { id: 'p4', type: 'panini', name: 'Beef Corned Reuben' },
  { id: 'p5', type: 'panini', name: 'Broccoli Cheddar' },
  { id: 'p6', type: 'panini', name: 'Buffalo Chicken' },
  { id: 'p7', type: 'panini', name: 'Buffalo Chicken Cutlet with Blue Cheese and Bacon' },
  { id: 'p8', type: 'panini', name: 'Buffalo Chicken Cutlet with Blue Cheese and Chipotle Mayo' },
  { id: 'p9', type: 'panini', name: 'Corn Beef with Coleslaw and Swiss Cheese' },
  { id: 'p10', type: 'panini', name: 'Crab Cake' },
  { id: 'p11', type: 'panini', name: 'Cuban Panini with Ham and Pork' },
  { id: 'p12', type: 'panini', name: 'Curried Chicken Salad' },
  { id: 'p13', type: 'panini', name: 'Egg Salad' },
  { id: 'p14', type: 'panini', name: 'Grilled Chicken' },
  { id: 'p15', type: 'panini', name: 'Grilled Chicken with Bacon and Pesto Mayo' },
  { id: 'p16', type: 'panini', name: 'Grilled Chicken with Sauteed Peppers and Onions' },
  { id: 'p17', type: 'panini', name: 'Grilled Chicken Pesto with Bacon' },
  { id: 'p18', type: 'panini', name: 'Grilled Chicken with Bacon Chipotle and Pepper Jack' },
  { id: 'p19', type: 'panini', name: 'Ham with Pickle and Cheddar' },
  { id: 'p20', type: 'panini', name: 'Ham with Swiss Cheese and Cole Slaw' },
  { id: 'p21', type: 'panini', name: 'Ham Turkey Joe with Coleslaw' },
  { id: 'p22', type: 'panini', name: 'Ham Honey Mustard with Provolone' },
  { id: 'p23', type: 'panini', name: 'Ham Mozzarella with Sweet Onion Relish' },
  { id: 'p24', type: 'panini', name: 'Herb Roasted Chicken with Mashed Potatoes' },
  { id: 'p25', type: 'panini', name: 'Honey Mustard Cranberry with Ham and Bacon' },
  { id: 'p26', type: 'panini', name: 'Meatball Parmesan' },
  { id: 'p27', type: 'panini', name: 'Pastrami with Swiss Cheese' },
  { id: 'p28', type: 'panini', name: 'Pastrami Reuben with Sauerkraut' },
  { id: 'p29', type: 'panini', name: 'Pastrami with Sauerkraut and Swiss' },
  { id: 'p30', type: 'panini', name: 'Pesto Mayo Grilled Chicken with Bacon' },
  { id: 'p31', type: 'panini', name: 'Pork Chop' },
  { id: 'p32', type: 'panini', name: 'Roast Beef with Provolone and Horseradish' },
  { id: 'p33', type: 'panini', name: 'Shredded Chicken BBQ with Bacon' },
  { id: 'p34', type: 'panini', name: 'Smoked Ham BBQ' },
  { id: 'p35', type: 'panini', name: 'Tuna Melt' },
  { id: 'p36', type: 'panini', name: 'Turkey & Cranberry' },
  { id: 'p37', type: 'panini', name: 'Turkey Bacon Cheddar' },
  { id: 'p38', type: 'panini', name: 'Turkey Bacon Ham with Swiss' },
  { id: 'p39', type: 'panini', name: 'Turkey Bacon Pepperjack with Ranch' },
  { id: 'p40', type: 'panini', name: 'Turkey Brie with Chipotle Mayo' },
  { id: 'p41', type: 'panini', name: 'Ham Bacon on Ciabatta' },
  { id: 'p42', type: 'panini', name: 'Grilled Chicken Bacon Chipotle Pepperjack' },
  { id: 'p43', type: 'panini', name: 'Pastrami Reuben' },
  { id: 'p44', type: 'panini', name: 'Texas Meatloaf with Bacon and BBQ' },
  { id: 'p45', type: 'panini', name: 'Godfather Chicken Cutlet' },
  { id: 'p46', type: 'panini', name: 'Smothered Chicken with Mushrooms' },
  { id: 'p47', type: 'panini', name: 'Chicken Cordon Bleu' },
  { id: 'sw1', type: 'sandwich', name: 'Asian Grilled Chicken in Spinach Wrap' },
  { id: 'sw2', type: 'sandwich', name: 'Asian Sesame Grilled Chicken Wrap' },
  { id: 'sw3', type: 'sandwich', name: 'BBQ Grilled Chicken on Semolina' },
  { id: 'sw4', type: 'sandwich', name: 'BBQ Grilled Chicken in Spinach Wrap' },
  { id: 'sw5', type: 'sandwich', name: 'Blackened Chicken Southwest Salad Wrap' },
  { id: 'sw6', type: 'sandwich', name: 'Buffalo Chicken with Bacon and Blue Cheese' },
  { id: 'sw7', type: 'sandwich', name: 'Caprese Chicken' },
  { id: 'sw8', type: 'sandwich', name: 'Chicken Bacon Ranch Wrap' },
  { id: 'sw9', type: 'sandwich', name: 'Chicken Caprese Wrap' },
  { id: 'sw10', type: 'sandwich', name: 'Chicken Cutlet Bacon Mayo Wrap' },
  { id: 'sw11', type: 'sandwich', name: 'Cobb Salad' },
  { id: 'sw12', type: 'sandwich', name: 'Cod Sandwich' },
  { id: 'sw13', type: 'sandwich', name: 'Corn Beef with Coleslaw Sandwich' },
  { id: 'sw14', type: 'sandwich', name: 'Crab Salad' },
  { id: 'sw15', type: 'sandwich', name: 'Curried Chicken Salad with Spinach' },
  { id: 'sw16', type: 'sandwich', name: 'Egg Salad Bacon Spinach Wrap' },
  { id: 'sw17', type: 'sandwich', name: 'Egg Salad Spinach with Honey Mustard' },
  { id: 'sw18', type: 'sandwich', name: 'Grilled BBQ Chicken with Bacon Wrap' },
  { id: 'sw19', type: 'sandwich', name: 'Grilled BBQ Chicken Cheddar Wrap' },
  { id: 'sw20', type: 'sandwich', name: 'Grilled Chicken Avocado Wrap' },
  { id: 'sw21', type: 'sandwich', name: 'Grilled Chicken Buffalo Bacon Wrap' },
  { id: 'sw22', type: 'sandwich', name: 'Grilled Chicken Bacon Cheddar' },
  { id: 'sw23', type: 'sandwich', name: 'Grilled Chicken Roasted Pepper Wrap' },
  { id: 'sw24', type: 'sandwich', name: 'Halana Wrap with Avocado' },
  { id: 'sw25', type: 'sandwich', name: 'Ham Cheddar Pickle Sandwich' },
  { id: 'sw26', type: 'sandwich', name: 'Ham Mozzarella with Balsamic' },
  { id: 'sw27', type: 'sandwich', name: 'Ham Prosciutto with Roasted Peppers' },
  { id: 'sw28', type: 'sandwich', name: 'Herb Roasted Turkey Pesto' },
  { id: 'sw29', type: 'sandwich', name: 'Homemade Chicken Pot Pie' },
  { id: 'sw30', type: 'sandwich', name: 'Jerk Roasted Chicken with Mashed Potatoes' },
  { id: 'sw31', type: 'sandwich', name: 'Pastrami with Coleslaw Wrap' },
  { id: 'sw32', type: 'sandwich', name: 'Roasted Turkey Portobello with Pesto' },
  { id: 'sw33', type: 'sandwich', name: 'Smoked Ham Sloppy Joe' },
  { id: 'sw34', type: 'sandwich', name: 'Tuna Fish on Focaccia' },
  { id: 'sw35', type: 'sandwich', name: 'Turkey Bacon with Pesto Mayo Wrap' },
  { id: 'sw36', type: 'sandwich', name: 'Turkey Club with Avocado' },
  { id: 'sw37', type: 'sandwich', name: 'Turkey Club Wrap' },
  { id: 'sw38', type: 'sandwich', name: 'Turkey BLT on Semolina' },
  { id: 'sw39', type: 'sandwich', name: 'Turkey BLT with Avocado' },
  { id: 'sw40', type: 'sandwich', name: 'Turkey Brie Chipotle Sandwich' },
  { id: 'sw41', type: 'sandwich', name: 'Turkey Brie Cranberry on Semolina' },
  { id: 'sw42', type: 'sandwich', name: 'Turkey Fig Jam Brie Wrap' },
  { id: 'sw43', type: 'sandwich', name: 'Turkey Swiss BLT with Pesto' },
  { id: 'sw44', type: 'sandwich', name: 'Turkey Club on White Bread' },
  { id: 'sw45', type: 'sandwich', name: 'Grilled Chicken Pesto Peppers Wrap' },
  { id: 'sw46', type: 'sandwich', name: 'Egg Salad Bacon Lettuce Wrap' },
  { id: 'sw47', type: 'sandwich', name: 'Roast Beef with Horseradish' },
  { id: 'sw48', type: 'sandwich', name: 'Turkey Swiss Cranberry on 7 Grain' },
  { id: 'sw49', type: 'sandwich', name: 'Roast Beef Mozzarella Pesto Wrap' },
  { id: 'sw50', type: 'sandwich', name: 'Egg Salad BLT on 7 Grain' },
  { id: 'sw51', type: 'sandwich', name: 'Shrimp Salad Sandwich' },
  { id: 'sw52', type: 'sandwich', name: 'Turkey Bacon Pepperjack on Semolina' },
  { id: 'sw53', type: 'sandwich', name: 'Pastrami Sloppy Joe Wrap' },
  { id: 'sw54', type: 'sandwich', name: 'Turkey Bacon Pepperjack on Ciabatta' },
  { id: 'sl1', type: 'salad', name: 'Apple Salad with Italian Dressing' },
  { id: 'sl2', type: 'salad', name: 'Arugula Mango Salad with Walnuts' },
  { id: 'sl3', type: 'salad', name: 'Asian Chicken Salad with Mandarin' },
  { id: 'sl4', type: 'salad', name: 'Asian Sesame Grilled Chicken Salad' },
  { id: 'sl5', type: 'salad', name: 'Blackened Chicken Caesar' },
  { id: 'sl6', type: 'salad', name: 'Berry Spinach Salad with Feta' },
  { id: 'sl7', type: 'salad', name: 'Chef Salad with Turkey and Ham' },
  { id: 'sl8', type: 'salad', name: 'Chicken Bruschetta Salad' },
  { id: 'sl9', type: 'salad', name: 'Chicken Caesar Salad' },
  { id: 'sl10', type: 'salad', name: 'Classic Cobb Salad' },
  { id: 'sl11', type: 'salad', name: 'Greek Salad with Grilled Chicken' },
  { id: 'sl12', type: 'salad', name: 'Greek Salad with Feta' },
  { id: 'sl13', type: 'salad', name: 'Grilled Chicken Caesar' },
  { id: 'sl14', type: 'salad', name: 'Mango Cranberry Salad' },
  { id: 'sl15', type: 'salad', name: 'Peach Cranberry Feta Salad' },
  { id: 'sl16', type: 'salad', name: 'Strawberry Cranberry Almond Salad' },
  { id: 'sl17', type: 'salad', name: 'Summer Berry Salad' },
  { id: 'sl18', type: 'salad', name: 'Tropical Mango Strawberry Salad' },
  { id: 'e1', type: 'entree', name: '7 Cheese Mac n Cheese' },
  { id: 'e2', type: 'entree', name: 'Asian Fried Rice with Chicken' },
  { id: 'e3', type: 'entree', name: 'Beef Stew with Egg Noodles' },
  { id: 'e4', type: 'entree', name: 'Breaded Cheese Ravioli with Marinara' },
  { id: 'e5', type: 'entree', name: 'Chicken Cutlet with Bacon' },
  { id: 'e6', type: 'entree', name: 'Chicken Lo Mein with Vegetables' },
  { id: 'e7', type: 'entree', name: 'Chicken Mulligatawny' },
  { id: 'e8', type: 'entree', name: 'Chicken Stir Fry' },
  { id: 'e9', type: 'entree', name: 'Chinese Chicken Fried Rice' },
  { id: 'e10', type: 'entree', name: 'Creamy Chicken Rigatoni' },
  { id: 'e11', type: 'entree', name: 'Creamy Mushroom Chicken with Rice' },
  { id: 'e12', type: 'entree', name: 'Creamy Mushroom Penne with Chicken' },
  { id: 'e13', type: 'entree', name: 'Egg Noodle with Teriyaki Meatballs' },
  { id: 'e14', type: 'entree', name: 'Herb Roasted Chicken with Mashed Potatoes' },
  { id: 'e15', type: 'entree', name: 'Herb Roasted Chicken with Veggies' },
  { id: 'e16', type: 'entree', name: 'Honey Roasted Chicken Pot Pie' },
  { id: 'e17', type: 'entree', name: 'Jerk Roasted Chicken with Mashed Potatoes' },
  { id: 'e18', type: 'entree', name: 'Mac & Cheese' },
  { id: 'e19', type: 'entree', name: 'Mac N Cheese with Bacon' },
  { id: 'e20', type: 'entree', name: 'Oven Roasted Turkey with Stuffing' },
  { id: 'e21', type: 'entree', name: 'Penne Marinara with Chicken Parmesan' },
  { id: 'e22', type: 'entree', name: 'Penne Pasta Marinara with Chicken' },
  { id: 'e23', type: 'entree', name: 'Penne Pasta with Garlic Chicken' },
  { id: 'e24', type: 'entree', name: 'Penne Vodka with Grilled Chicken' },
  { id: 'e25', type: 'entree', name: 'Pork Loin with Mashed Potatoes' },
  { id: 'e26', type: 'entree', name: 'Pulled BBQ Chicken with Rice' },
  { id: 'e27', type: 'entree', name: 'Roasted Chicken with Rice' },
  { id: 'e28', type: 'entree', name: 'Seared Beef with Mashed Potatoes' },
  { id: 'e29', type: 'entree', name: 'Shepherds Pie with Side Salad' },
  { id: 'e30', type: 'entree', name: 'Sweetheart Meatballs over Noodles' },
  { id: 'e31', type: 'entree', name: 'Teriyaki Chicken Over Egg Noodles' },
  { id: 'e32', type: 'entree', name: 'Teriyaki Meatballs with Jasmine Rice' },
  { id: 'e33', type: 'entree', name: 'Tri-Color Tortellini with White Sauce' },
  { id: 'e34', type: 'entree', name: 'Vegetable Soup with Rice' },
  { id: 'e35', type: 'entree', name: 'Vodka Penne with Grilled Chicken' },
  { id: 'e36', type: 'entree', name: 'White Wine Penne with Chicken and Bacon' },
  { id: 'e37', type: 'entree', name: 'Teriyaki Egg Noodles with Chicken' },
];

function getPromptForItem(item: { id: string; type: string; name: string }): string {
  const typeDescriptions: Record<string, string> = {
    soup: 'a delicious bowl of soup',
    panini: 'a hot pressed panini sandwich',
    sandwich: 'a fresh gourmet sandwich',
    salad: 'a fresh and colorful salad',
    entree: 'a hearty main course entree',
  };

  const baseType = typeDescriptions[item.type] || 'a delicious food item';
  
  return `Professional food photography of ${item.name} served as ${baseType}. Restaurant quality presentation on a white plate, warm lighting, shallow depth of field, appetizing and inviting, high-end restaurant style, photorealistic, 4K quality.`;
}

async function uploadToCloudinary(buffer: Buffer, itemId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'soup-shoppe-menu',
        public_id: itemId,
        resource_type: 'image',
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error('No result from Cloudinary'));
        }
      }
    );
    uploadStream.end(buffer);
  });
}

async function generateAndUploadImage(
  item: { id: string; type: string; name: string },
  existingUrls: Record<string, string>
): Promise<{ success: boolean; url?: string; skipped?: boolean }> {
  // Check if already in Cloudinary (database)
  if (existingUrls[item.id]) {
    return { success: true, url: existingUrls[item.id], skipped: true };
  }

  // Check if local file exists - upload it to Cloudinary
  const localPath = join(GENERATED_IMAGES_DIR, `${item.id}.png`);
  if (existsSync(localPath)) {
    try {
      console.log(`[UPLOADING] ${item.id}: ${item.name} - local file to Cloudinary...`);
      const buffer = readFileSync(localPath);
      const cloudinaryUrl = await uploadToCloudinary(buffer, item.id);
      await saveToDatabase(item.id, cloudinaryUrl);
      console.log(`[UPLOADED] ${item.id}: ${item.name} -> ${cloudinaryUrl}`);
      return { success: true, url: cloudinaryUrl };
    } catch (error: any) {
      console.error(`[ERROR] ${item.id}: ${item.name} - upload failed: ${error.message}`);
      return { success: false };
    }
  }

  // Generate new image
  try {
    const prompt = getPromptForItem(item);
    console.log(`[GENERATING] ${item.id}: ${item.name}...`);
    
    const response = await openai.images.generate({
      model: "gpt-image-1",
      prompt,
      n: 1,
      size: "1024x1024",
    });

    const imageData = response.data?.[0];
    
    if (imageData?.b64_json) {
      const buffer = Buffer.from(imageData.b64_json, "base64");
      
      // Save locally as backup
      writeFileSync(localPath, buffer);
      console.log(`[SAVED LOCAL] ${item.id}: ${item.name}`);
      
      // Upload to Cloudinary
      const cloudinaryUrl = await uploadToCloudinary(buffer, item.id);
      await saveToDatabase(item.id, cloudinaryUrl);
      console.log(`[UPLOADED] ${item.id}: ${item.name} -> ${cloudinaryUrl}`);
      
      return { success: true, url: cloudinaryUrl };
    } else {
      console.error(`[ERROR] ${item.id}: ${item.name} - no image data from OpenAI`);
      return { success: false };
    }
  } catch (error: any) {
    console.error(`[ERROR] ${item.id}: ${item.name} - ${error.message}`);
    return { success: false };
  }
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log(`Starting bulk image generation for ${MENU_ITEMS.length} items...`);
  console.log(`Images will be saved locally and uploaded to Cloudinary`);
  console.log(`Cloudinary cloud: ${process.env.CLOUDINARY_CLOUD_NAME}`);
  console.log('---');
  
  // Load existing URLs from database
  const existingUrls = await getExistingCloudinaryUrls();
  console.log(`Found ${Object.keys(existingUrls).length} existing Cloudinary URLs in database`);
  console.log('---');
  
  let successCount = 0;
  let failCount = 0;
  let skipCount = 0;

  for (let i = 0; i < MENU_ITEMS.length; i++) {
    const item = MENU_ITEMS[i];
    
    const result = await generateAndUploadImage(item, existingUrls);
    
    if (result.success) {
      if (result.skipped) {
        skipCount++;
        console.log(`[${i + 1}/${MENU_ITEMS.length}] SKIP (already in DB): ${item.name}`);
      } else {
        successCount++;
      }
    } else {
      failCount++;
    }

    if (!result.skipped) {
      console.log(`[${i + 1}/${MENU_ITEMS.length}] Progress: ${successCount} generated, ${failCount} failed, ${skipCount} skipped`);
    }
    
    // Rate limiting - wait 2 seconds between API requests (only for new generations)
    if (i < MENU_ITEMS.length - 1 && !result.skipped) {
      await sleep(2000);
    }
  }

  console.log('---');
  console.log(`COMPLETE: ${successCount} generated, ${failCount} failed, ${skipCount} skipped`);
  console.log(`Total items processed: ${MENU_ITEMS.length}`);
  
  await pool.end();
}

main().catch(console.error);
