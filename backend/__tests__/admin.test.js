import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import adminRoutes from '../routes/adminRoutes.js';
import errorHandler from '../middleware/errorHandler.js';
import { connect, closeDatabase, clearDatabase } from '../testSetup.js';

process.env.JWT_SECRET = 'test_secret_key_that_is_at_least_32_chars';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef';

const app = express();
app.use(express.json());
app.use('/api/admin', adminRoutes);
app.use(errorHandler);

const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });

const createAdmin = () =>
  User.create({ name: 'Admin', email: 'admin@example.com', password: 'Hashed12', role: 'admin', credits: 100 });

const createUser = (overrides = {}) =>
  User.create({ name: 'User', email: `user-${Date.now()}@example.com`, password: 'Hashed12', role: 'user', credits: 10, ...overrides });

beforeAll(async () => { await connect(); });
afterEach(async () => { await clearDatabase(); });
afterAll(async () => { await closeDatabase(); });

// ─────────────────────────────────────────────────
// Authorization middleware
// ─────────────────────────────────────────────────
describe('Admin route authorization', () => {
  it('returns 401 without any token', async () => {
    const res = await request(app).get('/api/admin/users');
    expect(res.status).toBe(401);
  });

  it('returns 403 when regular user accesses admin route', async () => {
    const regularUser = await createUser({ email: 'regular@example.com' });
    const token = makeToken(regularUser._id);

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────
// GET /api/admin/users
// ─────────────────────────────────────────────────
describe('GET /api/admin/users', () => {
  let admin, token;
  beforeEach(async () => {
    admin = await createAdmin();
    token = makeToken(admin._id);
  });

  it('returns user list with pagination metadata', async () => {
    await createUser({ email: 'u1@example.com' });
    await createUser({ email: 'u2@example.com' });

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.users.length).toBeGreaterThanOrEqual(2);
    expect(res.body.data.pagination).toMatchObject({
      total: expect.any(Number),
      page: 1,
      pages: expect.any(Number),
      limit: expect.any(Number),
    });
  });

  it('does not expose password field in any user', async () => {
    await createUser({ email: 'u1@example.com' });

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);

    res.body.data.users.forEach((u) => {
      expect(u.password).toBeUndefined();
    });
  });

  it('paginates with custom page and limit', async () => {
    for (let i = 0; i < 12; i++) {
      await createUser({ email: `u${i}@example.com` });
    }

    const res = await request(app)
      .get('/api/admin/users?page=2&limit=5')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.users.length).toBeLessThanOrEqual(5);
    expect(res.body.data.pagination.page).toBe(2);
  });

  it('returns users sorted newest first', async () => {
    const first = await createUser({ email: 'first@example.com' });
    await new Promise((r) => setTimeout(r, 10));
    const second = await createUser({ email: 'second@example.com' });

    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${token}`);

    const emails = res.body.data.users.map((u) => u.email);
    expect(emails.indexOf('second@example.com')).toBeLessThan(emails.indexOf('first@example.com'));
  });
});

// ─────────────────────────────────────────────────
// PUT /api/admin/users/:id/credits
// ─────────────────────────────────────────────────
describe('PUT /api/admin/users/:id/credits', () => {
  let admin, token, targetUser;
  beforeEach(async () => {
    admin = await createAdmin();
    token = makeToken(admin._id);
    targetUser = await createUser({ email: 'target@example.com', credits: 5 });
  });

  it('updates user credits to the specified value', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${targetUser._id}/credits`)
      .set('Authorization', `Bearer ${token}`)
      .send({ credits: 250 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.credits).toBe(250);
  });

  it('persists updated credits in the database', async () => {
    await request(app)
      .put(`/api/admin/users/${targetUser._id}/credits`)
      .set('Authorization', `Bearer ${token}`)
      .send({ credits: 999 });

    const updated = await User.findById(targetUser._id);
    expect(updated.credits).toBe(999);
  });

  it('returns 400 when credits field is missing', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${targetUser._id}/credits`)
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
  });

  it('returns 400 when credits is a string instead of number', async () => {
    const res = await request(app)
      .put(`/api/admin/users/${targetUser._id}/credits`)
      .set('Authorization', `Bearer ${token}`)
      .send({ credits: 'fifty' });

    expect(res.status).toBe(400);
  });

  it('returns 404 for nonexistent user ID', async () => {
    const res = await request(app)
      .put('/api/admin/users/000000000000000000000001/credits')
      .set('Authorization', `Bearer ${token}`)
      .send({ credits: 100 });

    expect(res.status).toBe(404);
  });

  it('returns 403 for non-admin user', async () => {
    const regular = await createUser({ email: 'regular@example.com' });
    const regularToken = makeToken(regular._id);

    const res = await request(app)
      .put(`/api/admin/users/${targetUser._id}/credits`)
      .set('Authorization', `Bearer ${regularToken}`)
      .send({ credits: 100 });

    expect(res.status).toBe(403);
  });
});

// ─────────────────────────────────────────────────
// DELETE /api/admin/users/:id
// ─────────────────────────────────────────────────
describe('DELETE /api/admin/users/:id', () => {
  let admin, token, targetUser;
  beforeEach(async () => {
    admin = await createAdmin();
    token = makeToken(admin._id);
    targetUser = await createUser({ email: 'target@example.com' });
  });

  it('deletes a user successfully', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${targetUser._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(await User.findById(targetUser._id)).toBeNull();
  });

  it('prevents admin from deleting their own account', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${admin._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/own admin account/i);
    expect(await User.findById(admin._id)).not.toBeNull();
  });

  it('returns 404 for nonexistent user ID', async () => {
    const res = await request(app)
      .delete('/api/admin/users/000000000000000000000001')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 403 for non-admin user', async () => {
    const regular = await createUser({ email: 'regular@example.com' });
    const regularToken = makeToken(regular._id);

    const res = await request(app)
      .delete(`/api/admin/users/${targetUser._id}`)
      .set('Authorization', `Bearer ${regularToken}`);

    expect(res.status).toBe(403);
  });
});
