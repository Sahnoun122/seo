import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import crypto from 'crypto';
import s3Client, { s3BucketName } from '../config/s3.js';

class ImageService {
  constructor() {
    this.s3 = s3Client;
    this.bucket = s3BucketName;
  }

  generateFilename() {
    return crypto.randomBytes(16).toString('hex');
  }

  async optimizeAndGenerateThumbnails(buffer) {
    const original = await sharp(buffer).webp({ quality: 80 }).toBuffer();
    const small = await sharp(buffer).resize({ width: 150, height: 150, fit: 'cover' }).webp({ quality: 80 }).toBuffer();
    const medium = await sharp(buffer).resize({ width: 600, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    const large = await sharp(buffer).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 80 }).toBuffer();
    
    return { original, small, medium, large };
  }

  async uploadToS3(buffer, key, mimetype) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
    });
    await this.s3.send(command);
  }

  async uploadImage(file, folder = 'misc') {
    const hash = this.generateFilename();
    const baseKey = `${folder}/${hash}`; 
    const finalMimeType = 'image/webp';

    // Process all images to webp format for optimization
    const buffers = await this.optimizeAndGenerateThumbnails(file.buffer);

    // Upload to S3 concurrently
    await Promise.all([
      this.uploadToS3(buffers.original, `${baseKey}.webp`, finalMimeType),
      this.uploadToS3(buffers.small, `${baseKey}-small.webp`, finalMimeType),
      this.uploadToS3(buffers.medium, `${baseKey}-medium.webp`, finalMimeType),
      this.uploadToS3(buffers.large, `${baseKey}-large.webp`, finalMimeType)
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
    const promises = paths.map(key => {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: key,
      });
      return this.s3.send(command).catch(err => console.error(`Failed to delete ${key}`, err));
    });
    await Promise.all(promises);
  }

  async getSignedUrl(key, expiresIn = 3600) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });
    return getSignedUrl(this.s3, command, { expiresIn });
  }
}

export default new ImageService();
