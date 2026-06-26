import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import crypto from 'crypto';
import User from '../models/User.js';
import PasswordReset from '../models/PasswordReset.js';
import { connect, closeDatabase, clearDatabase } from '../testSetup.js';
import errorHandler from '../middleware/errorHandler.js';

process.env.JWT_SECRET = 'test_secret_key_that_is_at_least_32_chars';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef';
process.env.NODE_ENV = 'test';

// Mock email service BEFORE importing routes
jest.unstable_mockModule('../services/emailService.js', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
  sendEmailVerificationEmail: jest.fn().mockResolvedValue({ success: true }),
}));

const authRoutes = (await import('../routes/authRoutes.js')).default;
const emailService = await import('../services/emailService.js');

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

const createUser = (overrides = {}) =>
  User.create({ name: 'Reset User', email: 'reset@example.com', password: 'password123', ...overrides });

beforeAll(async () => { await connect(); });
afterEach(async () => { await clearDatabase(); jest.clearAllMocks(); });
afterAll(async () => { await closeDatabase(); });

// ─────────────────────────────────────────────────
// POST /api/auth/forgot-password
// ─────────────────────────────────────────────────
describe('POST /api/auth/forgot-password', () => {
  it('returns 200 with generic success when user exists', async () => {
    await createUser();

    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'reset@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.message).toMatch(/reset link/i);
  });

  it('calls sendPasswordResetEmail when user exists', async () => {
    await createUser();

    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'reset@example.com' });

    expect(emailService.sendPasswordResetEmail).toHaveBeenCalledTimes(1);
  });

  it('returns same 200 response for nonexistent email (email enumeration prevention)', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('does NOT call email service for nonexistent user', async () => {
    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'nobody@example.com' });

    expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('returns 400 on invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'not-valid' });

    expect(res.status).toBe(400);
  });

  it('creates a PasswordReset record in the database', async () => {
    const user = await createUser();

    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'reset@example.com' });

    const record = await PasswordReset.findOne({ user: user._id });
    expect(record).not.toBeNull();
    expect(record.used).toBe(false);
  });

  it('invalidates previous tokens when a new one is requested', async () => {
    const user = await createUser();

    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'reset@example.com' });

    await request(app)
      .post('/api/auth/forgot-password')
      .send({ email: 'reset@example.com' });

    const count = await PasswordReset.countDocuments({ user: user._id });
    expect(count).toBe(1);
  });
});

// ─────────────────────────────────────────────────
// POST /api/auth/reset-password/:token
// ─────────────────────────────────────────────────
describe('POST /api/auth/reset-password/:token', () => {
  const newPassword = 'newSecurePass456';

  const setupReset = async () => {
    const user = await createUser();
    const rawToken = await PasswordReset.createToken(user._id);
    return { user, rawToken };
  };

  it('resets password with a valid token', async () => {
    const { rawToken } = await setupReset();

    const res = await request(app)
      .post(`/api/auth/reset-password/${rawToken}`)
      .send({ password: newPassword });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('new password is hashed and login works after reset', async () => {
    const { user, rawToken } = await setupReset();

    await request(app)
      .post(`/api/auth/reset-password/${rawToken}`)
      .send({ password: newPassword });

    const updatedUser = await User.findById(user._id).select('+password');
    expect(updatedUser.password).not.toBe(newPassword);
    expect(await updatedUser.matchPassword(newPassword)).toBe(true);
    expect(await updatedUser.matchPassword('password123')).toBe(false);
  });

  it('marks the token as used after successful reset', async () => {
    const { user, rawToken } = await setupReset();

    await request(app)
      .post(`/api/auth/reset-password/${rawToken}`)
      .send({ password: newPassword });

    const record = await PasswordReset.findOne({ user: user._id });
    expect(record.used).toBe(true);
  });

  it('returns 400 when token is invalid', async () => {
    const res = await request(app)
      .post('/api/auth/reset-password/completely-invalid-token')
      .send({ password: newPassword });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/invalid or has expired/i);
  });

  it('returns 400 when token has already been used', async () => {
    const { rawToken } = await setupReset();

    await request(app)
      .post(`/api/auth/reset-password/${rawToken}`)
      .send({ password: newPassword });

    const res = await request(app)
      .post(`/api/auth/reset-password/${rawToken}`)
      .send({ password: 'anotherPass789' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when new password is shorter than 6 chars', async () => {
    const { rawToken } = await setupReset();

    const res = await request(app)
      .post(`/api/auth/reset-password/${rawToken}`)
      .send({ password: '123' });

    expect(res.status).toBe(400);
  });

  it('returns 400 for an expired token', async () => {
    const user = await createUser();

    const rawToken = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

    await PasswordReset.create({
      user: user._id,
      token: hashedToken,
      expiresAt: new Date(Date.now() - 1000), // already expired
    });

    const res = await request(app)
      .post(`/api/auth/reset-password/${rawToken}`)
      .send({ password: newPassword });

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────
// PasswordReset model static methods
// ─────────────────────────────────────────────────
describe('PasswordReset model', () => {
  let user;
  beforeEach(async () => { user = await createUser(); });

  it('createToken returns a raw string token', async () => {
    const rawToken = await PasswordReset.createToken(user._id);
    expect(typeof rawToken).toBe('string');
    expect(rawToken.length).toBe(64); // 32 bytes → 64 hex chars
  });

  it('stores a SHA-256 hash, not the raw token', async () => {
    const rawToken = await PasswordReset.createToken(user._id);
    const record = await PasswordReset.findOne({ user: user._id });
    expect(record.token).not.toBe(rawToken);
    expect(record.token).toHaveLength(64); // SHA-256 hex
  });

  it('findValidToken returns record for correct raw token', async () => {
    const rawToken = await PasswordReset.createToken(user._id);
    const record = await PasswordReset.findValidToken(rawToken);
    expect(record).not.toBeNull();
    expect(record.user.toString()).toBe(user._id.toString());
  });

  it('findValidToken returns null for wrong token', async () => {
    await PasswordReset.createToken(user._id);
    const record = await PasswordReset.findValidToken('wrong-token');
    expect(record).toBeNull();
  });
});
