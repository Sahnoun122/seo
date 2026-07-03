import request from 'supertest';
import express from 'express';
import Stripe from 'stripe';
import User from '../models/User.js';
import ProcessedPayment from '../models/ProcessedPayment.js';
import { handleWebhook } from '../controllers/stripeController.js';
import errorHandler from '../middleware/errorHandler.js';
import { connect, closeDatabase, clearDatabase } from '../testSetup.js';

process.env.JWT_SECRET = 'test_secret_key_that_is_at_least_32_chars';
process.env.ENCRYPTION_KEY = '0123456789abcdef0123456789abcdef';
process.env.STRIPE_SECRET_KEY = 'sk_test_dummy_key_never_used_for_network_calls';
process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_signing_secret';

// Mirrors the real middleware order in server.js: the webhook route uses
// express.raw() and MUST be registered before the global express.json()
// parser, otherwise req.body arrives as an already-parsed object instead of
// a Buffer and Stripe's signature verification rejects every request.
const app = express();
app.post('/api/stripe/webhook', express.raw({ type: 'application/json' }), handleWebhook);
app.use(express.json());
app.use(errorHandler);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const sign = (payloadObject) => {
  const payloadString = JSON.stringify(payloadObject);
  const header = stripe.webhooks.generateTestHeaderString({
    payload: payloadString,
    secret: process.env.STRIPE_WEBHOOK_SECRET,
  });
  return { payloadString, header };
};

// IMPORTANT: send a JSON *string*, not a Buffer. superagent's .send() runs
// non-string payloads through its own JSON serializer when Content-Type is
// application/json, which would turn a Buffer into {"type":"Buffer","data":[...]}
// on the wire — defeating the point of this test. A string is sent verbatim.
const postWebhook = (payloadObject, header) =>
  request(app)
    .post('/api/stripe/webhook')
    .set('Content-Type', 'application/json')
    .set('Stripe-Signature', header)
    .send(JSON.stringify(payloadObject));

const createUser = (overrides = {}) =>
  User.create({ name: 'Buyer', email: `buyer-${Date.now()}-${Math.random()}@example.com`, password: 'Hashed12', credits: 0, ...overrides });

const paymentIntentSucceededEvent = (userId, { credits = 50, id = `pi_${Date.now()}` } = {}) => ({
  id: `evt_${Date.now()}_${Math.random()}`,
  object: 'event',
  type: 'payment_intent.succeeded',
  data: {
    object: {
      id,
      object: 'payment_intent',
      metadata: { userId: userId.toString(), credits: String(credits), package: 'starter' },
    },
  },
});

beforeAll(async () => { await connect(); });
afterEach(async () => { await clearDatabase(); });
afterAll(async () => { await closeDatabase(); });

describe('POST /api/stripe/webhook — raw body & signature verification', () => {
  it('accepts a validly signed event and receives the body as a raw Buffer (regression: middleware order)', async () => {
    const user = await createUser();
    const event = paymentIntentSucceededEvent(user._id, { credits: 50 });
    const { header } = sign(event);

    const res = await postWebhook(event, header);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ received: true });
  });

  it('rejects a request with an invalid signature', async () => {
    const user = await createUser();
    const event = paymentIntentSucceededEvent(user._id);

    const res = await postWebhook(event, 'v1=deadbeef,t=1234567890');

    expect(res.status).toBe(400);
    const updated = await User.findById(user._id);
    expect(updated.credits).toBe(0);
  });

  it('rejects a request with no Stripe-Signature header', async () => {
    const event = paymentIntentSucceededEvent((await createUser())._id);
    const res = await request(app)
      .post('/api/stripe/webhook')
      .set('Content-Type', 'application/json')
      .send(Buffer.from(JSON.stringify(event)));

    expect(res.status).toBe(400);
  });

  it('rejects a signature computed over a different payload (tamper detection)', async () => {
    const user = await createUser();
    const event = paymentIntentSucceededEvent(user._id, { credits: 50 });
    const { header } = sign(event);

    // Same signature, but a tampered payload (credits bumped from 50 to 999999)
    const tampered = { ...event, data: { object: { ...event.data.object, metadata: { ...event.data.object.metadata, credits: '999999' } } } };

    const res = await postWebhook(tampered, header);

    expect(res.status).toBe(400);
    const updated = await User.findById(user._id);
    expect(updated.credits).toBe(0);
  });
});

describe('POST /api/stripe/webhook — payment_intent.succeeded', () => {
  it('credits the user for the amount in the event metadata', async () => {
    const user = await createUser();
    const event = paymentIntentSucceededEvent(user._id, { credits: 200 });
    const { header } = sign(event);

    const res = await postWebhook(event, header);

    expect(res.status).toBe(200);
    const updated = await User.findById(user._id);
    expect(updated.credits).toBe(200);
  });

  it('records a ProcessedPayment for idempotency', async () => {
    const user = await createUser();
    const event = paymentIntentSucceededEvent(user._id, { credits: 50, id: 'pi_fixed_123' });
    const { header } = sign(event);

    await postWebhook(event, header);

    const record = await ProcessedPayment.findOne({ paymentIntentId: 'pi_fixed_123' });
    expect(record).not.toBeNull();
    expect(record.userId.toString()).toBe(user._id.toString());
    expect(record.credits).toBe(50);
  });

  it('does not double-credit when the same event is delivered twice', async () => {
    const user = await createUser();
    const event = paymentIntentSucceededEvent(user._id, { credits: 50, id: 'pi_duplicate_456' });

    const first = sign(event);
    const firstRes = await postWebhook(event, first.header);
    expect(firstRes.status).toBe(200);

    // Stripe retries webhooks verbatim on timeouts/non-2xx — same event, freshly signed
    const second = sign(event);
    const secondRes = await postWebhook(event, second.header);
    expect(secondRes.status).toBe(200);

    const updated = await User.findById(user._id);
    expect(updated.credits).toBe(50); // credited once, not 100
  });
});
