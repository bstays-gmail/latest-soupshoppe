import type { Express, Request, Response } from "express";
import { generateImageBuffer } from "./client";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";
import { v2 as cloudinary } from "cloudinary";
import { storage } from "../../storage";

const GENERATED_IMAGES_DIR = join(process.cwd(), "public", "generated-images");

if (!existsSync(GENERATED_IMAGES_DIR)) {
  mkdirSync(GENERATED_IMAGES_DIR, { recursive: true });
}

// Configure Cloudinary - handle both CLOUDINARY_URL and individual env vars
if (process.env.CLOUDINARY_URL) {
  // CLOUDINARY_URL auto-configures cloudinary
} else {
  // Extract cloud name if the env var contains full URL
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME || '';
  if (cloudName.includes('@')) {
    // Parse cloud name from CLOUDINARY_URL format
    const match = cloudName.match(/@([^/]+)/);
    cloudName = match ? match[1] : 'dlcrh8uee';
  }
  cloudinary.config({
    cloud_name: cloudName || 'dlcrh8uee',
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

// Upload buffer to Cloudinary and return secure URL
async function uploadToCloudinary(buffer: Buffer, itemId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: "soup-shoppe-menu/custom",
        public_id: itemId,
        resource_type: "image",
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else if (result) {
          resolve(result.secure_url);
        } else {
          reject(new Error("No result from Cloudinary"));
        }
      }
    );
    uploadStream.end(buffer);
  });
}

export function registerImageRoutes(app: Express): void {
  app.post("/api/generate-image", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    
    try {
      const { prompt, size = "1024x1024", itemId } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
      }

      // Use the generateImageBuffer function which handles model selection
      const buffer = await generateImageBuffer(prompt, size as "1024x1024" | "512x512" | "256x256");
      
      const imageId = itemId || randomUUID();
      
      // Try to upload to Cloudinary first (works across all environments)
      let imageUrl: string;
      const hasCloudinaryConfig = process.env.CLOUDINARY_CLOUD_NAME && 
                                   process.env.CLOUDINARY_API_KEY && 
                                   process.env.CLOUDINARY_API_SECRET;
      
      if (hasCloudinaryConfig) {
        try {
          imageUrl = await uploadToCloudinary(buffer, imageId);
          console.log(`Image uploaded to Cloudinary: ${imageUrl}`);
          // Save the Cloudinary URL to the database so it persists
          await storage.saveGeneratedImage(imageId, imageUrl);
        } catch (cloudinaryError) {
          console.error("Cloudinary upload failed, falling back to local storage:", cloudinaryError);
          // Fallback to local storage
          const filename = `${imageId}.png`;
          const filepath = join(GENERATED_IMAGES_DIR, filename);
          writeFileSync(filepath, buffer);
          imageUrl = `/generated-images/${filename}`;
        }
      } else {
        // No Cloudinary config, use local storage
        const filename = `${imageId}.png`;
        const filepath = join(GENERATED_IMAGES_DIR, filename);
        writeFileSync(filepath, buffer);
        imageUrl = `/generated-images/${filename}`;
      }
      
      res.json({ url: imageUrl, saved: true, isCloudinary: imageUrl.startsWith('http') });
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });
}

