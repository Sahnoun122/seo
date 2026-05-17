import { S3Client } from '@aws-sdk/client-s3';

/**
 * Pre-configured AWS S3 Client instance.
 * Credentials and region are populated from environment parameters.
 */
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  }
});

export const s3BucketName = process.env.AWS_S3_BUCKET || 'my-app-bucket';
export default s3Client;
