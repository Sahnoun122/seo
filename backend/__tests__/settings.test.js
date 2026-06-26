import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import settingsRoutes from '../routes/settingsRoutes.js';
import errorHandler from '../middleware/errorHandler.js';
import { connect, closeDatabase, clearDatabase } from '../testSetup.js';

process.env.JWT_SECRET = 'test_secret_key_that_is_at_least_32_chars';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef';

const app = express();
app.use(express.json());
app.use('/api/settings', settingsRoutes);
app.use(errorHandler);

const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });

const createAdmin = (overrides = {}) =>
  User.create({ name: 'Admin', email: 'admin@example.com', password: 'Hashed12', role: 'admin', ...overrides });

const createRegularUser = (overrides = {}) =>
  User.create({ name: 'User', email: 'user@example.com', password: 'Hashed12', role: 'user', ...overrides });

beforeAll(async () => { await connect(); });
afterEach(async () => { await clearDatabase(); });
afterAll(async () => { await closeDatabase(); });

// ─────────────────────────────────────────────────
// GET /api/settings
// ─────────────────────────────────────────────────
describe('GET /api/settings', () => {
  it('returns systemSettings, personalSettings, and users list for admin', async () => {
    const admin = await createAdmin();
    const token = makeToken(admin._id);

    await createRegularUser();

    const res = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.systemSettings).toBeDefined();
    expect(res.body.personalSettings).toBeDefined();
    expect(Array.isArray(res.body.users)).toBe(true);
  });

  it('admin systemSettings includes allowUserKeys, defaultModel, openaiApiKey, defaultUserCredits', async () => {
    const admin = await createAdmin();
    const token = makeToken(admin._id);

    const res = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.systemSettings).toMatchObject({
      allowUserKeys: expect.any(Boolean),
      defaultModel: expect.any(String),
      openaiApiKey: expect.any(String),
      defaultUserCredits: expect.any(Number),
    });
  });

  it('regular user does not receive users list', async () => {
    const user = await createRegularUser();
    const token = makeToken(user._id);

    const res = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.users).toBeUndefined();
  });

  it('regular user systemSettings only includes allowUserKeys and defaultModel', async () => {
    const user = await createRegularUser();
    const token = makeToken(user._id);

    const res = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.systemSettings).toHaveProperty('allowUserKeys');
    expect(res.body.systemSettings).toHaveProperty('defaultModel');
    expect(res.body.systemSettings.openaiApiKey).toBeUndefined();
  });

  it('users list does not expose passwords', async () => {
    const admin = await createAdmin();
    const token = makeToken(admin._id);
    await createRegularUser();

    const res = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${token}`);

    res.body.users.forEach((u) => {
      expect(u.password).toBeUndefined();
    });
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/settings');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────
// PUT /api/settings — profile updates
// ─────────────────────────────────────────────────
describe('PUT /api/settings — profile updates', () => {
  let user, token;
  beforeEach(async () => {
    user = await createRegularUser();
    token = makeToken(user._id);
  });

  it('updates user display name', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'New Name' });

    expect(res.status).toBe(200);
    expect(res.body.personalSettings.name).toBe('New Name');
  });

  it('persists name change in the database', async () => {
    await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ name: 'Persisted Name' });

    const updated = await User.findById(user._id);
    expect(updated.name).toBe('Persisted Name');
  });

  it('returns 400 if email is already taken by another user', async () => {
    await createAdmin(); // admin has email admin@example.com

    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ email: 'admin@example.com' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/email is already taken/i);
  });

  it('returns 400 if new password does not meet strength requirements', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ password: '123' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/8 characters/i);
  });

  it('updates preferred model and language', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ preferredModel: 'deepseek', defaultLanguage: 'Spanish' });

    expect(res.status).toBe(200);
    expect(res.body.personalSettings.settings.preferredModel).toBe('deepseek');
    expect(res.body.personalSettings.settings.defaultLanguage).toBe('Spanish');
  });

  it('updates WordPress connection details', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ wpUrl: 'https://mysite.com', wpUsername: 'editor' });

    expect(res.status).toBe(200);
    expect(res.body.personalSettings.settings.wpUrl).toBe('https://mysite.com');
    expect(res.body.personalSettings.settings.wpUsername).toBe('editor');
  });

  it('returns 401 without token', async () => {
    const res = await request(app).put('/api/settings').send({ name: 'X' });
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────
// PUT /api/settings — admin global settings update
// ─────────────────────────────────────────────────
describe('PUT /api/settings — admin global settings', () => {
  let admin, token;
  beforeEach(async () => {
    admin = await createAdmin();
    token = makeToken(admin._id);
    // Initialize system settings
    await Settings.create({ defaultModel: 'gpt-4o', allowUserKeys: true, defaultUserCredits: 10 });
  });

  it('admin can update defaultModel globally', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ systemSettings: { defaultModel: 'gpt-4o-mini' } });

    expect(res.status).toBe(200);
    expect(res.body.systemSettings.defaultModel).toBe('gpt-4o-mini');
  });

  it('admin can toggle allowUserKeys', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ systemSettings: { allowUserKeys: false } });

    expect(res.status).toBe(200);
    expect(res.body.systemSettings.allowUserKeys).toBe(false);
  });

  it('admin can set defaultUserCredits', async () => {
    const res = await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${token}`)
      .send({ systemSettings: { defaultUserCredits: 50 } });

    expect(res.status).toBe(200);
    expect(res.body.systemSettings.defaultUserCredits).toBe(50);
  });

  it('regular user systemSettings update is ignored', async () => {
    const user = await createRegularUser();
    const userToken = makeToken(user._id);

    await request(app)
      .put('/api/settings')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ systemSettings: { defaultModel: 'hacked-model' } });

    const settings = await Settings.findOne({});
    expect(settings.defaultModel).toBe('gpt-4o'); // unchanged
  });
});
