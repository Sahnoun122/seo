import crypto from 'crypto';
import logger from './logger.js';

const ALGORITHM = 'aes-256-gcm';
const LEGACY_ALGORITHM = 'aes-256-cbc'; // kept only to decrypt values written before the GCM migration

const getKey = () => {
  const raw = process.env.ENCRYPTION_KEY || '';
  return Buffer.from(raw.padEnd(32, '0').slice(0, 32));
};

export const encrypt = (text) => {
  if (!text) return text;
  const iv = crypto.randomBytes(12); // 96-bit IV, recommended size for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
};

export const decrypt = (text) => {
  if (!text) return text;
  const parts = text.split(':');
  try {
    if (parts.length === 3) {
      const [ivHex, authTagHex, encryptedHex] = parts;
      const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'));
      decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));
      return Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]).toString('utf8');
    }
    if (parts.length === 2) {
      // Legacy AES-256-CBC value, written before the GCM migration — still readable, never re-written this way.
      const [ivHex, encryptedHex] = parts;
      const decipher = crypto.createDecipheriv(LEGACY_ALGORITHM, getKey(), Buffer.from(ivHex, 'hex'));
      return Buffer.concat([decipher.update(Buffer.from(encryptedHex, 'hex')), decipher.final()]).toString('utf8');
    }
    return text;
  } catch (err) {
    logger.warn(`Failed to decrypt a stored value — this usually means ENCRYPTION_KEY changed since it was saved: ${err.message}`);
    return text;
  }
};
