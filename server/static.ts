import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  // Serve static assets with long cache (they have content hashes in filenames)
  app.use(express.static(distPath, {
    maxAge: '1y',
    etag: true,
    setHeaders: (res, filePath) => {
      // Assets with hashes can be cached forever
      if (filePath.match(/\.[a-f0-9]{8}\.(js|css)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));

  // fall through to index.html if the file doesn't exist
  // HTML should not be cached so users always get fresh references to hashed assets
  app.use("*", (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
