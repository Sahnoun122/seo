import express from 'express';
import { getPackages, createCheckoutSession, handleWebhook } from '../controllers/stripeController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Webhook must receive raw body — mounted BEFORE express.json() via rawBody middleware
router.post('/webhook', express.raw({ type: 'application/json' }), handleWebhook);

router.get('/packages', protect, getPackages);
router.post('/checkout', protect, createCheckoutSession);

export default router;
