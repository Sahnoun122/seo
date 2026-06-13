import crypto from 'crypto';

const ALGORITHM = 'aes-256-cbc';

const getKey = () => {
  const raw = process.env.ENCRYPTION_KEY || '';
  if (raw.length < 32) {
    console.warn('[encryption] WARNING: ENCRYPTION_KEY is shorter than 32 characters. Keys will be padded — set a proper 32-char key in production.');
  }
  return Buffer.from(raw.padEnd(32, '0').slice(0, 32));
};

export const encrypt = (text) => {
  if (!text) return text;
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(String(text), 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
};

export const decrypt = (text) => {
  if (!text) return text;
  try {
    const parts = text.split(':');
    if (parts.length !== 2) return text;
    const iv = Buffer.from(parts[0], 'hex');
    const encrypted = Buffer.from(parts[1], 'hex');
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch {
    return text;
  }
};
