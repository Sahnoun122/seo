import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';

// Lazy-load sharp so a missing native binary doesn't crash the entire server at startup
let sharpLib;
const getSharp = async () => {
  if (!sharpLib) {
    const mod = await import('sharp');
    sharpLib = mod.default;
  }
  return sharpLib;
};

const UPLOADS_DIR = path.resolve('uploads');

class ImageService {
  generateFilename() {
    return crypto.randomBytes(16).toString('hex');
  }

  async ensureDirectoryExists(folderPath) {
    try {
      await fs.access(folderPath);
    } catch {
      await fs.mkdir(folderPath, { recursive: true });
    }
  }

  async optimizeAndGenerateThumbnails(buffer) {
    const sharp = await getSharp();
    const original = await sharp(buffer).webp({ quality: 80 }).toBuffer();
    const small    = await sharp(buffer).resize({ width: 150, height: 150, fit: 'cover' }).webp({ quality: 80 }).toBuffer();
    const medium   = await sharp(buffer).resize({ width: 600,  withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    const large    = await sharp(buffer).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    return { original, small, medium, large };
  }

  async uploadToLocal(buffer, filePath) {
    await fs.writeFile(filePath, buffer);
  }

  async uploadImage(file, folder = 'misc') {
    const hash = this.generateFilename();
    const folderPath = path.join(UPLOADS_DIR, folder);
    await this.ensureDirectoryExists(folderPath);

    const baseKey = `${folder}/${hash}`; 
    const finalMimeType = 'image/webp';

    // Process all images to webp format for optimization
    const buffers = await this.optimizeAndGenerateThumbnails(file.buffer);

    // Upload to Local concurrently
    await Promise.all([
      this.uploadToLocal(buffers.original, path.join(UPLOADS_DIR, `${baseKey}.webp`)),
      this.uploadToLocal(buffers.small, path.join(UPLOADS_DIR, `${baseKey}-small.webp`)),
      this.uploadToLocal(buffers.medium, path.join(UPLOADS_DIR, `${baseKey}-medium.webp`)),
      this.uploadToLocal(buffers.large, path.join(UPLOADS_DIR, `${baseKey}-large.webp`))
    ]);

    return {
      path: `${baseKey}.webp`,
      filename: `${hash}.webp`,
      mimetype: finalMimeType,
      size: buffers.original.length,
      thumbnails: {
        small: `${baseKey}-small.webp`,
        medium: `${baseKey}-medium.webp`,
        large: `${baseKey}-large.webp`
      }
    };
  }

  async deleteImagePaths(paths) {
    const promises = paths.map(async key => {
      try {
        await fs.unlink(path.join(UPLOADS_DIR, key));
      } catch (err) {
        console.error(`Failed to delete ${key}`, err);
      }
    });
    await Promise.all(promises);
  }

  getLocalFilePath(key) {
    return path.join(UPLOADS_DIR, key);
  }
}

export default new ImageService();
