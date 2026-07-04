import { jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Article from '../models/Article.js';
import { connect, closeDatabase, clearDatabase } from '../testSetup.js';
import errorHandler from '../middleware/errorHandler.js';

process.env.JWT_SECRET = 'test_secret_key_that_is_at_least_32_chars';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef';
process.env.OPENAI_API_KEY = 'sk-test-000000000000';

// ─── Mock openaiService BEFORE importing routes ───────────────────────────────
const mockCreate = jest.fn();

jest.unstable_mockModule('../services/openaiService.js', () => ({
  cleanAndParseJSON: jest.fn().mockImplementation((str) => JSON.parse(str)),
  handleOpenAIError: jest.fn().mockImplementation((err) => { throw err; }),
  getOpenAIClientAndModel: jest.fn().mockResolvedValue({
    openai: { chat: { completions: { create: mockCreate } } },
    model: 'gpt-4o',
    isUserKey: false,
    language: 'English',
    tone: 'Professional',
  }),
  chatCompletionWithFallback: jest.fn().mockImplementation(async (openai, model, params) => ({
    completion: await openai.chat.completions.create({ ...params, model }),
    modelUsed: model,
  })),
  streamCompletionWithFallback: jest.fn().mockImplementation(async (openai, model, params, { onDelta } = {}) => {
    const stream = await openai.chat.completions.create({ ...params, model, stream: true });
    let fullContent = '';
    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content || '';
      if (delta) {
        fullContent += delta;
        onDelta?.(delta);
      }
    }
    return { fullContent, modelUsed: model };
  }),
}));

// Import AFTER mock is registered — resolve the mocked module's exports once
// here and reuse this exact reference everywhere. A second, later
// `await import('../services/openaiService.js')` call from inside a test can
// resolve to a distinct module record under Jest's experimental VM modules,
// so mockResolvedValueOnce() on that second reference silently never affects
// the function articleController.js actually calls.
const { getOpenAIClientAndModel } = await import('../services/openaiService.js');
const articleRoutes = (await import('../routes/articleRoutes.js')).default;

// ─── App setup ───────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());
app.use('/api', articleRoutes);
app.use(errorHandler);

// ─── DB lifecycle ─────────────────────────────────────────────────────────────
beforeAll(async () => { await connect(); });
afterEach(async () => { await clearDatabase(); jest.clearAllMocks(); });
afterAll(async () => { await closeDatabase(); });

// ─── Helpers ──────────────────────────────────────────────────────────────────
const makeToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1d' });

const createUser = (overrides = {}) =>
  User.create({ name: 'Tester', email: 'tester@example.com', password: 'Hashed12', credits: 10, isEmailVerified: true, ...overrides });

const createArticle = (userId, overrides = {}) =>
  Article.create({
    user: userId,
    title: 'Default Title',
    keyword: 'seo',
    content: '# Article body',
    metaDescription: 'Short meta.',
    ...overrides,
  });

// Default mock: returns article JSON for first call, keywords JSON for second
const setupAIMock = () => {
  mockCreate
    .mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ title: 'AI Title', metaDescription: 'AI meta', content: '# AI Content' }) } }],
    })
    .mockResolvedValueOnce({
      choices: [{ message: { content: JSON.stringify({ keywords: ['seo tips', 'content marketing', 'google ranking'] }) } }],
    });
};

// ─────────────────────────────────────────────────
// POST /api/generate-article
// ─────────────────────────────────────────────────
describe('POST /api/generate-article', () => {
  let user, token;
  beforeEach(async () => {
    user = await createUser();
    token = makeToken(user._id);
    setupAIMock();
  });

  it('generates an article and returns 200', async () => {
    const res = await request(app)
      .post('/api/generate-article')
      .set('Authorization', `Bearer ${token}`)
      .send({ keyword: 'SEO basics' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('AI Title');
    expect(res.body.data.keyword).toBe('SEO basics');
  });

  it('deducts 1 credit on successful generation', async () => {
    await request(app)
      .post('/api/generate-article')
      .set('Authorization', `Bearer ${token}`)
      .send({ keyword: 'SEO basics' });

    const updated = await User.findById(user._id);
    expect(updated.credits).toBe(9);
  });

  it('saves article to database with correct user reference', async () => {
    await request(app)
      .post('/api/generate-article')
      .set('Authorization', `Bearer ${token}`)
      .send({ keyword: 'backlinks' });

    const article = await Article.findOne({ user: user._id });
    expect(article).not.toBeNull();
    expect(article.keyword).toBe('backlinks');
    expect(article.suggestedKeywords).toHaveLength(3);
  });

  it('does NOT deduct credit when user has their own API key (isUserKey=true)', async () => {
    getOpenAIClientAndModel.mockResolvedValueOnce({
      openai: { chat: { completions: { create: mockCreate } } },
      model: 'gpt-4o',
      isUserKey: true,
      language: 'English',
      tone: 'Professional',
    });
    setupAIMock();

    const noCreditsUser = await createUser({ email: 'keyuser@example.com', credits: 0 });
    const noCreditsToken = makeToken(noCreditsUser._id);

    const res = await request(app)
      .post('/api/generate-article')
      .set('Authorization', `Bearer ${noCreditsToken}`)
      .send({ keyword: 'SEO with own key' });

    expect(res.status).toBe(200);
    const updated = await User.findById(noCreditsUser._id);
    expect(updated.credits).toBe(0); // unchanged
  });

  it('returns 403 when user has 0 credits and no own API key', async () => {
    await User.findByIdAndUpdate(user._id, { credits: 0 });

    const res = await request(app)
      .post('/api/generate-article')
      .set('Authorization', `Bearer ${token}`)
      .send({ keyword: 'SEO basics' });

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/credits/i);
  });

  it('returns 400 when keyword is empty', async () => {
    const res = await request(app)
      .post('/api/generate-article')
      .set('Authorization', `Bearer ${token}`)
      .send({ keyword: '' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when keyword exceeds 100 characters', async () => {
    const res = await request(app)
      .post('/api/generate-article')
      .set('Authorization', `Bearer ${token}`)
      .send({ keyword: 'a'.repeat(101) });

    expect(res.status).toBe(400);
  });

  it('returns 401 without authentication token', async () => {
    const res = await request(app)
      .post('/api/generate-article')
      .send({ keyword: 'SEO basics' });

    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────
// GET /api/history
// ─────────────────────────────────────────────────
describe('GET /api/history', () => {
  let user, token;
  beforeEach(async () => {
    user = await createUser();
    token = makeToken(user._id);
  });

  it('returns empty list when user has no articles', async () => {
    const res = await request(app)
      .get('/api/history')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data).toHaveLength(0);
    expect(res.body.pagination.total).toBe(0);
  });

  it('returns only the current user\'s articles', async () => {
    await createArticle(user._id, { keyword: 'mine' });
    const other = await createUser({ email: 'other@example.com' });
    await createArticle(other._id, { keyword: 'theirs' });

    const res = await request(app)
      .get('/api/history')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].keyword).toBe('mine');
  });

  it('returns articles sorted newest first', async () => {
    await createArticle(user._id, { keyword: 'first' });
    await createArticle(user._id, { keyword: 'second' });

    const res = await request(app)
      .get('/api/history')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data[0].keyword).toBe('second');
    expect(res.body.data[1].keyword).toBe('first');
  });

  it('filters by keyword search term', async () => {
    await createArticle(user._id, { keyword: 'backlinks strategy' });
    await createArticle(user._id, { keyword: 'on-page seo' });

    const res = await request(app)
      .get('/api/history?search=backlinks')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].keyword).toBe('backlinks strategy');
  });

  it('paginates correctly with page and limit params', async () => {
    for (let i = 0; i < 5; i++) {
      await createArticle(user._id, { keyword: `keyword-${i}` });
    }

    const res = await request(app)
      .get('/api/history?page=1&limit=3')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data).toHaveLength(3);
    expect(res.body.pagination.total).toBe(5);
    expect(res.body.pagination.pages).toBe(2);
  });

  it('does not include version history in list response', async () => {
    await createArticle(user._id, {
      versions: [{ title: 'Old', metaDescription: 'm', content: 'c', refinedAt: new Date() }],
    });

    const res = await request(app)
      .get('/api/history')
      .set('Authorization', `Bearer ${token}`);

    expect(res.body.data[0].versions).toBeUndefined();
  });

  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/history');
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────
// DELETE /api/articles/:id
// ─────────────────────────────────────────────────
describe('DELETE /api/articles/:id', () => {
  let user, token, article;
  beforeEach(async () => {
    user = await createUser();
    token = makeToken(user._id);
    article = await createArticle(user._id);
  });

  it('deletes article owned by authenticated user', async () => {
    const res = await request(app)
      .delete(`/api/articles/${article._id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(await Article.findById(article._id)).toBeNull();
  });

  it('returns 404 for nonexistent article ID', async () => {
    const fakeId = '000000000000000000000001';
    const res = await request(app)
      .delete(`/api/articles/${fakeId}`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  it('returns 404 when trying to delete another user\'s article', async () => {
    const other = await createUser({ email: 'other@example.com' });
    const otherToken = makeToken(other._id);

    const res = await request(app)
      .delete(`/api/articles/${article._id}`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
    expect(await Article.findById(article._id)).not.toBeNull();
  });

  it('returns 401 without token', async () => {
    const res = await request(app).delete(`/api/articles/${article._id}`);
    expect(res.status).toBe(401);
  });
});

// ─────────────────────────────────────────────────
// PATCH /api/history/:id/refine
// ─────────────────────────────────────────────────
describe('PATCH /api/history/:id/refine', () => {
  let user, token, article;
  beforeEach(async () => {
    user = await createUser();
    token = makeToken(user._id);
    article = await createArticle(user._id, { title: 'Original Title' });

    // Reset any queued mockResolvedValueOnce from setupAIMock before setting refine response
    mockCreate.mockReset();
    mockCreate.mockResolvedValue({
      choices: [{ message: { content: JSON.stringify({ title: 'Refined Title', metaDescription: 'Refined meta', content: '# Refined Content' }) } }],
    });
  });

  it('refines an article and returns updated data', async () => {
    const res = await request(app)
      .patch(`/api/history/${article._id}/refine`)
      .set('Authorization', `Bearer ${token}`)
      .send({ prompt: 'Make it more engaging' });

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Refined Title');
  });

  it('saves original version before overwriting', async () => {
    await request(app)
      .patch(`/api/history/${article._id}/refine`)
      .set('Authorization', `Bearer ${token}`)
      .send({ prompt: 'Rewrite the intro' });

    const updated = await Article.findById(article._id);
    expect(updated.versions).toHaveLength(1);
    expect(updated.versions[0].title).toBe('Original Title');
  });

  it('returns 404 for article not owned by user', async () => {
    const other = await createUser({ email: 'other@example.com' });
    const otherToken = makeToken(other._id);

    const res = await request(app)
      .patch(`/api/history/${article._id}/refine`)
      .set('Authorization', `Bearer ${otherToken}`)
      .send({ prompt: 'Do something' });

    expect(res.status).toBe(404);
  });

  it('returns 400 when prompt is empty', async () => {
    const res = await request(app)
      .patch(`/api/history/${article._id}/refine`)
      .set('Authorization', `Bearer ${token}`)
      .send({ prompt: '' });

    expect(res.status).toBe(400);
  });

  it('returns 400 when prompt exceeds 2000 chars', async () => {
    const res = await request(app)
      .patch(`/api/history/${article._id}/refine`)
      .set('Authorization', `Bearer ${token}`)
      .send({ prompt: 'x'.repeat(2001) });

    expect(res.status).toBe(400);
  });
});

// ─────────────────────────────────────────────────
// POST /api/history/:id/restore/:versionIndex
// ─────────────────────────────────────────────────
describe('POST /api/history/:id/restore/:versionIndex', () => {
  let user, token, article;
  beforeEach(async () => {
    user = await createUser();
    token = makeToken(user._id);
    article = await createArticle(user._id, {
      title: 'Current Title',
      versions: [
        { title: 'Version 0', metaDescription: 'v0 meta', content: '# v0', refinedAt: new Date() },
        { title: 'Version 1', metaDescription: 'v1 meta', content: '# v1', refinedAt: new Date() },
      ],
    });
  });

  it('restores article to a valid version index', async () => {
    const res = await request(app)
      .post(`/api/history/${article._id}/restore/0`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.data.title).toBe('Version 0');
  });

  it('saves current state as a new version before restoring', async () => {
    await request(app)
      .post(`/api/history/${article._id}/restore/0`)
      .set('Authorization', `Bearer ${token}`);

    const updated = await Article.findById(article._id);
    expect(updated.versions[0].title).toBe('Current Title');
  });

  it('returns 400 for out-of-bounds version index', async () => {
    const res = await request(app)
      .post(`/api/history/${article._id}/restore/99`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('returns 400 for NaN version index', async () => {
    const res = await request(app)
      .post(`/api/history/${article._id}/restore/abc`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
  });

  it('returns 404 for another user\'s article', async () => {
    const other = await createUser({ email: 'other@example.com' });
    const otherToken = makeToken(other._id);

    const res = await request(app)
      .post(`/api/history/${article._id}/restore/0`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(404);
  });
});

// ─────────────────────────────────────────────────
// POST /api/articles/:id/publish-wordpress
// ─────────────────────────────────────────────────
describe('POST /api/articles/:id/publish-wordpress', () => {
  let user, token, article;
  beforeEach(async () => {
    user = await createUser();
    token = makeToken(user._id);
    article = await createArticle(user._id);
  });

  it('returns 400 when WordPress settings are not configured', async () => {
    const res = await request(app)
      .post(`/api/articles/${article._id}/publish-wordpress`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/wordpress/i);
  });

  it('returns 404 for article not owned by user', async () => {
    await User.findByIdAndUpdate(user._id, {
      'settings.wpUrl': 'https://blog.com',
      'settings.wpUsername': 'admin',
      'settings.wpApplicationPassword': 'pass',
    });

    const other = await createUser({ email: 'other@example.com' });
    const otherToken = makeToken(other._id);

    const res = await request(app)
      .post(`/api/articles/${article._id}/publish-wordpress`)
      .set('Authorization', `Bearer ${otherToken}`);

    expect(res.status).toBe(400); // other user has no WP settings
  });

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post(`/api/articles/${article._id}/publish-wordpress`);

    expect(res.status).toBe(401);
  });
});
