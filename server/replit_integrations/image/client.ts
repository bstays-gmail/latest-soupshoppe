import fs from "node:fs";
import OpenAI, { toFile } from "openai";
import { Buffer } from "node:buffer";

// Lazy initialization for OpenAI client
let _openai: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!_openai) {
    _openai = new OpenAI({
      apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
      baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    });
  }
  return _openai;
}

// Export getter for openai client (for backwards compatibility)
export const openai = new Proxy({} as OpenAI, {
  get(_, prop) {
    const client = getOpenAI();
    const value = (client as any)[prop];
    if (typeof value === 'function') {
      return value.bind(client);
    }
    return value;
  }
});

/**
 * Generate an image and return as Buffer.
 * Uses dall-e-3 for standard OpenAI API or gpt-image-1 for Replit AI Integrations.
 */
export async function generateImageBuffer(
  prompt: string,
  size: "1024x1024" | "512x512" | "256x256" = "1024x1024"
): Promise<Buffer> {
  const client = getOpenAI();
  const isReplitAI = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL?.includes('replit') || 
                     process.env.AI_INTEGRATIONS_OPENAI_BASE_URL?.includes('modelfarm');
  
  // Use appropriate model based on environment
  const model = isReplitAI ? "gpt-image-1" : "dall-e-3";
  
  // dall-e-3 only supports 1024x1024, 1792x1024, or 1024x1792
  const imageSize = model === "dall-e-3" ? "1024x1024" : size;
  
  const response = await client.images.generate({
    model,
    prompt,
    size: imageSize,
    response_format: "b64_json",
  });
  const base64 = response.data?.[0]?.b64_json ?? "";
  return Buffer.from(base64, "base64");
}

/**
 * Edit/combine multiple images into a composite.
 * Uses gpt-image-1 model via Replit AI Integrations.
 */
export async function editImages(
  imageFiles: string[],
  prompt: string,
  outputPath?: string
): Promise<Buffer> {
  const images = await Promise.all(
    imageFiles.map((file) =>
      toFile(fs.createReadStream(file), file, {
        type: "image/png",
      })
    )
  );

  const client = getOpenAI();
  const response = await client.images.edit({
    model: "gpt-image-1",
    image: images,
    prompt,
  });

  const imageBase64 = response.data?.[0]?.b64_json ?? "";
  const imageBytes = Buffer.from(imageBase64, "base64");

  if (outputPath) {
    fs.writeFileSync(outputPath, imageBytes);
  }

  return imageBytes;
}
