import type { Express, Request, Response } from "express";
import { openai } from "./client";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { randomUUID } from "crypto";

const GENERATED_IMAGES_DIR = join(process.cwd(), "public", "generated-images");

if (!existsSync(GENERATED_IMAGES_DIR)) {
  mkdirSync(GENERATED_IMAGES_DIR, { recursive: true });
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

      const response = await openai.images.generate({
        model: "gpt-image-1",
        prompt,
        n: 1,
        size: size as "1024x1024" | "512x512" | "256x256",
      });

      const imageData = response.data?.[0];
      
      if (imageData?.b64_json) {
        const filename = `${itemId || randomUUID()}.png`;
        const filepath = join(GENERATED_IMAGES_DIR, filename);
        const buffer = Buffer.from(imageData.b64_json, "base64");
        writeFileSync(filepath, buffer);
        
        const imageUrl = `/generated-images/${filename}`;
        res.json({ url: imageUrl, saved: true });
      } else if (imageData?.url) {
        res.json({ url: imageData.url, saved: false });
      } else {
        res.status(500).json({ error: "No image data received" });
      }
    } catch (error) {
      console.error("Error generating image:", error);
      res.status(500).json({ error: "Failed to generate image" });
    }
  });
}

