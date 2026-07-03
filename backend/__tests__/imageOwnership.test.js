import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import fs from 'node:fs/promises';
import path from 'node:path';
import User from '../models/User.js';
import Image from '../models/Image.js';
import imageRoutes from '../routes/imageRoutes.js';
import errorHandler from '../middleware/errorHandler.js';
import { connect, closeDatabase, clearDatabase } from '../testSetup.js';

process.env.JWT_SECRET = 'test_secret_key_that_is_at_least_32_chars';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef';

const app = express();
app.use(express.json());
app.use('/api/images', imageRoutes);
app.use(errorHandler);

// Valid 1×1 PNG (generated via sharp, round-trip verified) — needed because
// ImageService really processes the buffer with Sharp before storing it.
const TINY_PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAADElEQVR4nGP4z8AAAAMBAQDJ/pLvAAAAAElFTkSuQmCC',
  'base64'
);

const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });

const createUser = (overrides = {}) =>
  User.create({ name: 'User', email: `user-${Date.now()}-${Math.random()}@example.com`, password: 'Hashed12', credits: 10, ...overrides });

const createImage = (userId, overrides = {}) =>
  Image.create({
    user: userId,
    path: `misc/${Date.now()}-${Math.random()}.webp`,
    filename: 'fake.webp',
    thumbnails: { small: '', medium: '', large: '' },
    size: 100,
    mimetype: 'image/webp',
    ...overrides,
  });

// A couple of tests exercise the real ImageService pipeline (Sharp + local
// disk fallback) rather than mocking it, since that's where the ownership
// bug actually lived. Track what they write so we can clean it up afterward.
const UPLOADS_DIR = path.resolve('uploads');
const writtenFiles = [];
const trackWritten = (imageDoc) => {
  const keys = [imageDoc.path, imageDoc.thumbnails?.small, imageDoc.thumbnails?.medium, imageDoc.thumbnails?.large].filter(Boolean);
  writtenFiles.push(...keys);
};

beforeAll(async () => { await connect(); });
afterEach(async () => { await clearDatabase(); });
afterAll(async () => {
  await closeDatabase();
  await Promise.all(writtenFiles.map((key) => fs.unlink(path.join(UPLOADS_DIR, key)).catch(() => {})));
});

describe('Image ownership — IDOR protection', () => {
  describe('GET /api/images (list by entity)', () => {
    it('only returns images owned by the requesting user', async () => {
      const owner = await createUser();
      const intruder = await createUser();
      const articleId = new (await import('mongoose')).default.Types.ObjectId();

      await createImage(owner._id, { imageableId: articleId, imageableType: 'Article' });

      const res = await request(app)
        .get(`/api/images?imageableId=${articleId}&imageableType=Article`)
        .set('Authorization', `Bearer ${makeToken(intruder._id)}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(0);
    });

    it("returns the owner's own images for the same entity", async () => {
      const owner = await createUser();
      const articleId = new (await import('mongoose')).default.Types.ObjectId();
      await createImage(owner._id, { imageableId: articleId, imageableType: 'Article' });

      const res = await request(app)
        .get(`/api/images?imageableId=${articleId}&imageableType=Article`)
        .set('Authorization', `Bearer ${makeToken(owner._id)}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toHaveLength(1);
    });
  });

  describe('DELETE /api/images/:id', () => {
    it("returns 403 when a non-owner tries to delete another user's image", async () => {
      const owner = await createUser();
      const intruder = await createUser();
      const image = await createImage(owner._id);

      const res = await request(app)
        .delete(`/api/images/${image._id}`)
        .set('Authorization', `Bearer ${makeToken(intruder._id)}`);

      expect(res.status).toBe(403);
      expect(await Image.findById(image._id)).not.toBeNull(); // untouched
    });

    it('allows the owner to delete their own image', async () => {
      const owner = await createUser();
      const image = await createImage(owner._id);

      const res = await request(app)
        .delete(`/api/images/${image._id}`)
        .set('Authorization', `Bearer ${makeToken(owner._id)}`);

      expect(res.status).toBe(200);
      expect(await Image.findById(image._id)).toBeNull();
    });

    it('returns 404 for a nonexistent image (not 403)', async () => {
      const user = await createUser();
      const res = await request(app)
        .delete('/api/images/000000000000000000000001')
        .set('Authorization', `Bearer ${makeToken(user._id)}`);

      expect(res.status).toBe(404);
    });
  });

  describe('PATCH /api/images/:id/primary', () => {
    it("returns 403 when a non-owner tries to set another user's image as primary", async () => {
      const owner = await createUser();
      const intruder = await createUser();
      const image = await createImage(owner._id, { isPrimary: false });

      const res = await request(app)
        .patch(`/api/images/${image._id}/primary`)
        .set('Authorization', `Bearer ${makeToken(intruder._id)}`);

      expect(res.status).toBe(403);
      expect((await Image.findById(image._id)).isPrimary).toBe(false);
    });

    it('allows the owner to set their own image as primary', async () => {
      const owner = await createUser();
      const image = await createImage(owner._id, { isPrimary: false });

      const res = await request(app)
        .patch(`/api/images/${image._id}/primary`)
        .set('Authorization', `Bearer ${makeToken(owner._id)}`);

      expect(res.status).toBe(200);
      expect((await Image.findById(image._id)).isPrimary).toBe(true);
    });

    it("does not let a non-owner's request affect another owner's other images via updateMany", async () => {
      const owner = await createUser();
      const intruder = await createUser();
      const articleId = new (await import('mongoose')).default.Types.ObjectId();
      const ownerImage1 = await createImage(owner._id, { imageableId: articleId, imageableType: 'Article', isPrimary: true });
      const ownerImage2 = await createImage(owner._id, { imageableId: articleId, imageableType: 'Article', isPrimary: false });

      await request(app)
        .patch(`/api/images/${ownerImage2._id}/primary`)
        .set('Authorization', `Bearer ${makeToken(intruder._id)}`); // 403, should be a no-op

      expect((await Image.findById(ownerImage1._id)).isPrimary).toBe(true);
      expect((await Image.findById(ownerImage2._id)).isPrimary).toBe(false);
    });
  });

  describe('PUT /api/images/:id/replace', () => {
    it("returns 403 when a non-owner tries to replace another user's image", async () => {
      const owner = await createUser();
      const intruder = await createUser();
      const image = await createImage(owner._id);

      const res = await request(app)
        .put(`/api/images/${image._id}/replace`)
        .set('Authorization', `Bearer ${makeToken(intruder._id)}`)
        .attach('image', TINY_PNG, { filename: 'evil.png', contentType: 'image/png' });

      expect(res.status).toBe(403);
      const untouched = await Image.findById(image._id);
      expect(untouched.filename).toBe('fake.webp'); // never overwritten
    });

    it('allows the owner to replace their own image', async () => {
      const owner = await createUser();
      const image = await createImage(owner._id);

      const res = await request(app)
        .put(`/api/images/${image._id}/replace`)
        .set('Authorization', `Bearer ${makeToken(owner._id)}`)
        .attach('image', TINY_PNG, { filename: 'new.png', contentType: 'image/png' });

      expect(res.status).toBe(200);
      const updated = await Image.findById(image._id);
      expect(updated.filename).not.toBe('fake.webp');
      trackWritten(updated);
    });
  });

  describe('Image creation endpoints stamp ownership', () => {
    it('POST /api/images/upload stores the uploader as the image owner', async () => {
      const user = await createUser();

      const res = await request(app)
        .post('/api/images/upload/single')
        .set('Authorization', `Bearer ${makeToken(user._id)}`)
        .attach('image', TINY_PNG, { filename: 'cover.png', contentType: 'image/png' });

      expect(res.status).toBe(201);
      const saved = await Image.findById(res.body.data[0]._id);
      expect(saved.user.toString()).toBe(user._id.toString());
      trackWritten(saved);
    });
  });
});
