import express from 'express';
import {
  getPackages, createCheckoutSession, getStripeConfig,
  createPaymentIntent, createSubscriptionSession, verifyPayment,
  getSubscription, cancelSubscription, reactivateSubscription, changeSubscriptionPlan,
} from '../controllers/stripeController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate, checkoutSchema } from '../validators/schemas.js';

const router = express.Router();

// NOTE: POST /webhook is intentionally NOT registered here — it is mounted
// directly in server.js, before the global express.json() parser, so it
// can receive the raw body Stripe's signature verification requires.

router.get('/config', protect, getStripeConfig);
router.get('/packages', protect, getPackages);
router.post('/checkout', protect, validate(checkoutSchema), createCheckoutSession);
router.post('/payment-intent', protect, validate(checkoutSchema), createPaymentIntent);
router.post('/verify/:paymentIntentId', protect, verifyPayment);
router.post('/subscribe', protect, createSubscriptionSession);

// Subscription management
router.get('/subscription', protect, getSubscription);
router.delete('/subscription', protect, cancelSubscription);
router.post('/subscription/reactivate', protect, reactivateSubscription);
router.put('/subscription/plan', protect, changeSubscriptionPlan);

export default router;
