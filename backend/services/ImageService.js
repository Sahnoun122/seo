/**
 * ImageService — Universal S3/MinIO + Local Fallback
 *
 * Production (Vercel / Docker / any serverless):
 *   AWS S3  → set: AWS_S3_BUCKET, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 *   MinIO   → set: S3_ENDPOINT, S3_ACCESS_KEY, S3_SECRET_KEY, S3_BUCKET, S3_REGION
 *
 * Development (local, no docker):
 *   Leave S3 vars unset → writes to ./uploads/ on disk automatically.
 */

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  CreateBucketCommand,
  HeadBucketCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import logger from '../utils/logger.js';

// ── Sharp lazy-loader ────────────────────────────────────────────────────────
let sharpLib;
const getSharp = async () => {
  if (!sharpLib) {
    const mod = await import('sharp');
    sharpLib = mod.default;
  }
  return sharpLib;
};

// ── Storage mode detection ────────────────────────────────────────────────────
const useS3 = () =>
  Boolean(
    (process.env.AWS_S3_BUCKET || process.env.S3_BUCKET) &&
    (process.env.AWS_ACCESS_KEY_ID || process.env.S3_ACCESS_KEY)
  );

const isMinIO = () => Boolean(process.env.S3_ENDPOINT);

// ── S3 Client factory (AWS or MinIO) ──────────────────────────────────────────
let _s3Client = null;
const getS3Client = () => {
  if (_s3Client) return _s3Client;

  const endpoint    = process.env.S3_ENDPOINT;
  const region      = process.env.S3_REGION || process.env.AWS_REGION || 'us-east-1';
  const accessKeyId = process.env.S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.S3_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY;

  const config = { region, credentials: { accessKeyId, secretAccessKey } };

  if (endpoint) {
    config.endpoint = endpoint;
    config.forcePathStyle = true; // required for MinIO path-style URLs
  }

  _s3Client = new S3Client(config);
  return _s3Client;
};

const getBucket = () => process.env.S3_BUCKET || process.env.AWS_S3_BUCKET;

// ── Local fallback directory ──────────────────────────────────────────────────
const UPLOADS_DIR = path.resolve('uploads');

class ImageService {
  // ── Internal helpers ─────────────────────────────────────────────────────────

  generateFilename() {
    return crypto.randomBytes(16).toString('hex');
  }

  async ensureLocalDir(folderPath) {
    try {
      await fs.access(folderPath);
    } catch {
      await fs.mkdir(folderPath, { recursive: true });
    }
  }

  async optimizeAndGenerateThumbnails(buffer) {
    const sharp = await getSharp();
    const [original, small, medium, large] = await Promise.all([
      sharp(buffer).webp({ quality: 82 }).toBuffer(),
      sharp(buffer).resize({ width: 150, height: 150, fit: 'cover' }).webp({ quality: 80 }).toBuffer(),
      sharp(buffer).resize({ width: 600, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer(),
      sharp(buffer).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer(),
    ]);
    return { original, small, medium, large };
  }

  // ── Bucket auto-creation (MinIO only) ────────────────────────────────────────
  async _ensureBucketExists() {
    if (!isMinIO()) return; // AWS S3 bucket must exist, MinIO we can create it
    const s3     = getS3Client();
    const bucket = getBucket();
    try {
      await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    } catch (err) {
      if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
        logger.info(`MinIO: bucket "${bucket}" not found — creating it now.`);
        await s3.send(new CreateBucketCommand({ Bucket: bucket }));
        logger.info(`MinIO: bucket "${bucket}" created.`);
      } else {
        throw err;
      }
    }
  }

  // ── S3 / MinIO core operations ────────────────────────────────────────────────

  async _uploadToS3(buffer, key) {
    const s3 = getS3Client();
    await s3.send(
      new PutObjectCommand({
        Bucket: getBucket(),
        Key: key,
        Body: buffer,
        ContentType: 'image/webp',
      })
    );
  }

  async _deleteFromS3(key) {
    try {
      const s3 = getS3Client();
      await s3.send(new DeleteObjectCommand({ Bucket: getBucket(), Key: key }));
    } catch (err) {
      logger.warn(`S3 delete failed for key "${key}": ${err.message}`);
    }
  }

  /**
   * Generate a temporary pre-signed URL to serve the image securely.
   * Works for both AWS S3 and MinIO (1-hour expiry by default).
   */
  async getSignedImageUrl(key, expiresInSeconds = 3600) {
    if (!useS3()) return null;
    const s3 = getS3Client();
    return getSignedUrl(
      s3,
      new GetObjectCommand({ Bucket: getBucket(), Key: key }),
      { expiresIn: expiresInSeconds }
    );
  }

  // ── Local disk upload ─────────────────────────────────────────────────────────

  async _uploadToLocal(buffer, filePath) {
    await fs.writeFile(filePath, buffer);
  }

  // ── Public API ────────────────────────────────────────────────────────────────

  /**
   * Upload an image file (from multer memory storage).
   * Auto-detects S3/MinIO vs local disk based on environment variables.
   */
  async uploadImage(file, folder = 'misc') {
    const hash    = this.generateFilename();
    const baseKey = `${folder}/${hash}`;

    const buffers = await this.optimizeAndGenerateThumbnails(file.buffer);

    if (useS3()) {
      await this._ensureBucketExists();
      await Promise.all([
        this._uploadToS3(buffers.original, `${baseKey}.webp`),
        this._uploadToS3(buffers.small,    `${baseKey}-small.webp`),
        this._uploadToS3(buffers.medium,   `${baseKey}-medium.webp`),
        this._uploadToS3(buffers.large,    `${baseKey}-large.webp`),
      ]);
      logger.info(`[ImageService] Uploaded to ${isMinIO() ? 'MinIO' : 'S3'}: ${baseKey}.webp`);
    } else {
      const folderPath = path.join(UPLOADS_DIR, folder);
      await this.ensureLocalDir(folderPath);
      await Promise.all([
        this._uploadToLocal(buffers.original, path.join(UPLOADS_DIR, `${baseKey}.webp`)),
        this._uploadToLocal(buffers.small,    path.join(UPLOADS_DIR, `${baseKey}-small.webp`)),
        this._uploadToLocal(buffers.medium,   path.join(UPLOADS_DIR, `${baseKey}-medium.webp`)),
        this._uploadToLocal(buffers.large,    path.join(UPLOADS_DIR, `${baseKey}-large.webp`)),
      ]);
      logger.info(`[ImageService] Saved to local disk: ${baseKey}.webp`);
    }

    return {
      path:     `${baseKey}.webp`,
      filename: `${hash}.webp`,
      mimetype: 'image/webp',
      size:     buffers.original.length,
      thumbnails: {
        small:  `${baseKey}-small.webp`,
        medium: `${baseKey}-medium.webp`,
        large:  `${baseKey}-large.webp`,
      },
      storage: useS3() ? (isMinIO() ? 'minio' : 'aws-s3') : 'local',
    };
  }

  /**
   * Delete image paths from S3/MinIO or local disk.
   */
  async deleteImagePaths(paths) {
    await Promise.all(
      paths.filter(Boolean).map(async (key) => {
        try {
          if (useS3()) {
            await this._deleteFromS3(key);
          } else {
            await fs.unlink(path.join(UPLOADS_DIR, key));
          }
        } catch (err) {
          logger.warn(`[ImageService] Failed to delete "${key}": ${err.message}`);
        }
      })
    );
  }

  /**
   * Get the local filesystem path (development only).
   */
  getLocalFilePath(key) {
    return path.join(UPLOADS_DIR, key);
  }

  /**
   * Return a human-readable storage mode for diagnostics.
   */
  getStorageMode() {
    if (!useS3()) return 'local';
    return isMinIO()
      ? `minio (endpoint: ${process.env.S3_ENDPOINT}, bucket: ${getBucket()})`
      : `aws-s3 (region: ${process.env.AWS_REGION}, bucket: ${getBucket()})`;
  }

  /**
   * Run a connectivity check against S3/MinIO.
   * Returns { ok: true } on success or { ok: false, error: string }.
   */
  async healthCheck() {
    if (!useS3()) {
      return { ok: true, mode: 'local', message: 'Using local disk storage.' };
    }
    try {
      const s3 = getS3Client();
      await s3.send(new HeadBucketCommand({ Bucket: getBucket() }));
      return {
        ok: true,
        mode: isMinIO() ? 'minio' : 'aws-s3',
        bucket: getBucket(),
        endpoint: process.env.S3_ENDPOINT || 'https://s3.amazonaws.com',
      };
    } catch (err) {
      return { ok: false, mode: isMinIO() ? 'minio' : 'aws-s3', error: err.message };
    }
  }
}

export default new ImageService();
