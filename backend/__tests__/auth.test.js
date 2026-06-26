import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import authRoutes from '../routes/authRoutes.js';
import User from '../models/User.js';
import errorHandler from '../middleware/errorHandler.js';
import { connect, closeDatabase, clearDatabase } from '../testSetup.js';

process.env.JWT_SECRET = 'test_secret_key_that_is_at_least_32_chars';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef';

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use(errorHandler);

const DEFAULT_USER = { name: 'Test User', email: 'test@example.com', password: 'Password123' };

const doRegister = (data = {}) =>
  request(app).post('/api/auth/register').send({ ...DEFAULT_USER, ...data });

const doLogin = (data = {}) =>
  request(app).post('/api/auth/login').send({ email: DEFAULT_USER.email, password: DEFAULT_USER.password, ...data });

beforeAll(async () => { await connect(); });
afterEach(async () => { await clearDatabase(); });
afterAll(async () => { await closeDatabase(); });

// ─────────────────────────────────────────────────
// REGISTER
// ─────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  it('creates first user with role=admin and returns token', async () => {
    const res = await doRegister();
    expect(res.status).toBe(201);
    expect(res.body).toMatchObject({
      email: 'test@example.com',
      role: 'admin',
    });
    expect(res.body.token).toBeDefined();
    expect(res.body.password).toBeUndefined();
  });

  it('creates second user with role=user', async () => {
    await doRegister();
    const res = await doRegister({ email: 'second@example.com' });
    expect(res.status).toBe(201);
    expect(res.body.role).toBe('user');
  });

  it('assigns default 10 credits to new user', async () => {
    const res = await doRegister();
    expect(res.body.credits).toBe(10);
  });

  it('returns 400 when email is already taken', async () => {
    await doRegister();
    const res = await doRegister();
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/user already exists/i);
  });

  it('returns 400 when name is missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'x@x.com', password: 'Secret123' });
    expect(res.status).toBe(400);
  });

  it('returns 400 on invalid email format', async () => {
    const res = await doRegister({ email: 'not-an-email' });
    expect(res.status).toBe(400);
  });

  it('returns 400 on password shorter than 8 characters', async () => {
    const res = await doRegister({ password: '123' });
    expect(res.status).toBe(400);
  });

  it('stores password as bcrypt hash (not plaintext)', async () => {
    await doRegister();
    const user = await User.findOne({ email: DEFAULT_USER.email }).select('+password');
    expect(user.password).not.toBe(DEFAULT_USER.password);
    expect(user.password).toMatch(/^\$2[ab]\$/);
  });

  it('JWT payload contains user _id', async () => {
    const res = await doRegister();
    const decoded = jwt.verify(res.body.token, process.env.JWT_SECRET);
    expect(decoded.id).toBeDefined();
  });
});

// ─────────────────────────────────────────────────
// LOGIN
// ─────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  beforeEach(async () => { await doRegister(); });

  it('returns token and user data on correct credentials', async () => {
    const res = await doLogin();
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    expect(res.body.email).toBe(DEFAULT_USER.email);
  });

  it('returns 401 on wrong password', async () => {
    const res = await doLogin({ password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/invalid credentials/i);
  });

  it('returns 401 on nonexistent email', async () => {
    const res = await doLogin({ email: 'nobody@example.com' });
    expect(res.status).toBe(401);
  });

  it('returns 400 on missing email', async () => {
    const res = await request(app).post('/api/auth/login').send({ password: 'password123' });
    expect(res.status).toBe(400);
  });

  it('returns 400 on missing password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: DEFAULT_USER.email });
    expect(res.status).toBe(400);
  });

  it('does not expose password in response', async () => {
    const res = await doLogin();
    expect(res.body.password).toBeUndefined();
  });

  it('response includes role and credits', async () => {
    const res = await doLogin();
    expect(res.body.role).toBeDefined();
    expect(res.body.credits).toBeDefined();
  });
});

// ─────────────────────────────────────────────────
// GET /me
// ─────────────────────────────────────────────────
describe('GET /api/auth/me', () => {
  let token;
  beforeEach(async () => {
    const res = await doRegister();
    token = res.body.token;
  });

  it('returns current user with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.email).toBe(DEFAULT_USER.email);
    expect(res.body.role).toBe('admin');
  });

  it('returns 401 with no token', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 with malformed token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer this.is.bad');
    expect(res.status).toBe(401);
  });

  it('returns 401 after user is deleted', async () => {
    await User.deleteMany({});
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────
// GET /settings
// ─────────────────────────────────────────────────
describe('GET /api/auth/settings', () => {
  let token;
  beforeEach(async () => {
    const res = await doRegister();
    token = res.body.token;
  });

  it('returns settings object with valid token', async () => {
    const res = await request(app)
      .get('/api/auth/settings')
      .set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.settings).toBeDefined();
  });

  it('settings include expected default keys', async () => {
    const res = await request(app)
      .get('/api/auth/settings')
      .set('Authorization', `Bearer ${token}`);
    const { settings } = res.body;
    expect(settings).toHaveProperty('preferredModel');
    expect(settings).toHaveProperty('defaultLanguage');
    expect(settings).toHaveProperty('defaultTone');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/auth/settings');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────
// PUT /settings
// ─────────────────────────────────────────────────
describe('PUT /api/auth/settings', () => {
  let token;
  beforeEach(async () => {
    const res = await doRegister();
    token = res.body.token;
  });

  const authed = () =>
    request(app).put('/api/auth/settings').set('Authorization', `Bearer ${token}`);

  it('updates preferredModel', async () => {
    const res = await authed().send({ preferredModel: 'gpt-4o-mini' });
    expect(res.status).toBe(200);
    expect(res.body.settings.preferredModel).toBe('gpt-4o-mini');
  });

  it('updates defaultLanguage', async () => {
    const res = await authed().send({ defaultLanguage: 'English' });
    expect(res.status).toBe(200);
    expect(res.body.settings.defaultLanguage).toBe('English');
  });

  it('updates defaultTone', async () => {
    const res = await authed().send({ defaultTone: 'Persuasive' });
    expect(res.status).toBe(200);
    expect(res.body.settings.defaultTone).toBe('Persuasive');
  });

  it('updates WordPress URL and username', async () => {
    const res = await authed().send({ wpUrl: 'https://myblog.com', wpUsername: 'admin' });
    expect(res.status).toBe(200);
    expect(res.body.settings.wpUrl).toBe('https://myblog.com');
    expect(res.body.settings.wpUsername).toBe('admin');
  });

  it('persists settings in the database', async () => {
    await authed().send({ preferredModel: 'deepseek' });
    const user = await User.findOne({ email: DEFAULT_USER.email });
    expect(user.settings.preferredModel).toBe('deepseek');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).put('/api/auth/settings').send({ preferredModel: 'x' });
    expect(res.status).toBe(401);
  });
});
