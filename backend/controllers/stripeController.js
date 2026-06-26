import Stripe from 'stripe';
import User from '../models/User.js';
import ProcessedPayment from '../models/ProcessedPayment.js';
import Subscription from '../models/Subscription.js';
import logger from '../utils/logger.js';

const getStripe = () => {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured. Please add it to your .env file.');
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
};

export const CREDIT_PACKAGES = [
  { id: 'starter', name: 'Starter',   credits: 50,  amount: 900,  currency: 'usd', description: '50 AI article generations' },
  { id: 'growth',  name: 'Growth',    credits: 200, amount: 2900, currency: 'usd', description: '200 AI article generations' },
  { id: 'pro',     name: 'Pro',       credits: 500, amount: 5900, currency: 'usd', description: '500 AI article generations + priority' },
];

// @desc    Get Stripe publishable key
// @route   GET /api/stripe/config
// @access  Private
export const getStripeConfig = (req, res) => {
  res.status(200).json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || ''
  });
};

// @desc    Get available credit packages
// @route   GET /api/stripe/packages
// @access  Private
export const getPackages = (req, res) => {
  res.status(200).json({ success: true, data: CREDIT_PACKAGES });
};

// @desc    Create a Stripe Checkout session
// @route   POST /api/stripe/checkout
// @access  Private
export const createCheckoutSession = async (req, res) => {
  try {
    const { packageId } = req.body;
    const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      return res.status(400).json({ error: 'Invalid package selected.' });
    }

    const stripe = getStripe();
    const clientUrl = process.env.CLIENT_URL?.split(',')[0]?.trim() || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: pkg.currency,
            product_data: {
              name: `${pkg.name} Plan — ${pkg.credits} Credits`,
              description: pkg.description,
            },
            unit_amount: pkg.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      ui_mode: 'embedded',
      return_url: `${clientUrl}/buy-credits?success=true&session_id={CHECKOUT_SESSION_ID}`,
      metadata: {
        userId:  req.user.id.toString(),
        credits: pkg.credits.toString(),
        package: pkg.id,
      },
    });

    res.status(200).json({ success: true, clientSecret: session.client_secret });
  } catch (error) {
    logger.error('Stripe Checkout Error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to create checkout session.' });
  }
};

// @desc    Create a Stripe PaymentIntent (for embedded checkout)
// @route   POST /api/stripe/payment-intent
// @access  Private
export const createPaymentIntent = async (req, res) => {
  try {
    const { packageId } = req.body;
    const pkg = CREDIT_PACKAGES.find((p) => p.id === packageId);
    if (!pkg) {
      return res.status(400).json({ error: 'Invalid package selected.' });
    }

    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.create({
      amount: pkg.amount,
      currency: pkg.currency,
      payment_method_types: ['card'],
      metadata: {
        userId: req.user.id.toString(),
        credits: pkg.credits.toString(),
        package: pkg.id,
      },
    });

    res.status(200).json({
      success: true,
      clientSecret: paymentIntent.client_secret,
    });
  } catch (error) {
    logger.error('Stripe PaymentIntent Error:', error);
    res.status(500).json({ error: error.message || 'Failed to create payment intent.' });
  }
};

// @desc    Stripe webhook — credit user after successful payment
// @route   POST /api/stripe/webhook
// @access  Public (Stripe signature verified)
export const handleWebhook = async (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    logger.error('STRIPE_WEBHOOK_SECRET is not set.');
    return res.status(500).send('Webhook secret not configured.');
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    logger.error('Stripe Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle checkout.session.completed (old flow)
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, credits } = session.metadata || {};

    if (!userId || !credits) {
      logger.error('Webhook: missing metadata in checkout session.');
      return res.status(400).send('Missing metadata.');
    }

    // Use payment_intent when available; prefix session.id so it never collides with a real PaymentIntent ID
    const idempotencyKey = session.payment_intent || `session_${session.id}`;
    try {
      const existing = await ProcessedPayment.findOne({ paymentIntentId: idempotencyKey });
      if (existing) {
        logger.info(`Duplicate webhook for session ${idempotencyKey} — skipping.`);
        return res.status(200).json({ received: true });
      }

      const pkgId = session.metadata.package || '';
      await User.findByIdAndUpdate(userId, { $inc: { credits: parseInt(credits, 10) }, ...(pkgId && { plan: pkgId }) });
      await ProcessedPayment.create({ paymentIntentId: idempotencyKey, sessionId: session.id, userId, credits: parseInt(credits, 10), packageId: pkgId });
      logger.info(`Credited ${credits} credits to user ${userId} via Checkout Session`);
    } catch (err) {
      logger.error('Webhook: failed to update user credits:', err.message);
      return res.status(500).send('Database error.');
    }
  }

  // Handle payment_intent.succeeded (new embedded flow)
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    // Skip if this payment intent belongs to a subscription (handled below)
    if (paymentIntent.invoice) {
        return res.status(200).json({ received: true });
    }

    const { userId, credits } = paymentIntent.metadata || {};

    if (!userId || !credits) {
      logger.error('Webhook: missing metadata in PaymentIntent.');
      return res.status(400).send('Missing metadata.');
    }

    try {
      const existing = await ProcessedPayment.findOne({ paymentIntentId: paymentIntent.id });
      if (existing) {
        logger.info(`Duplicate webhook for PaymentIntent ${paymentIntent.id} — skipping.`);
        return res.status(200).json({ received: true });
      }

      const pkgId = paymentIntent.metadata.package || '';
      await User.findByIdAndUpdate(userId, { $inc: { credits: parseInt(credits, 10) }, ...(pkgId && { plan: pkgId }) });
      await ProcessedPayment.create({ paymentIntentId: paymentIntent.id, userId, credits: parseInt(credits, 10), packageId: pkgId });
      logger.info(`Credited ${credits} credits to user ${userId} via Payment Intent`);
    } catch (err) {
      logger.error('Webhook: failed to update user credits:', err.message);
      return res.status(500).send('Database error.');
    }
  }

  // --- Handle Subscriptions ---
  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const subscription = event.data.object;
    
    // Attempt to extract userId from metadata if available. 
    // Usually, on a new subscription, we pass userId in the session metadata, which transfers to the subscription.
    let userId = subscription.metadata?.userId;
    
    if (!userId) {
       // fallback: find by stripeCustomerId if we started saving it
       const existingSub = await Subscription.findOne({ stripeSubscriptionId: subscription.id });
       if (existingSub) userId = existingSub.user;
    }

    if (userId) {
       try {
         await Subscription.findOneAndUpdate(
           { stripeSubscriptionId: subscription.id },
           {
             user: userId,
             stripeCustomerId: subscription.customer,
             stripeSubscriptionId: subscription.id,
             planId: subscription.items.data[0].price.id,
             status: subscription.status,
             currentPeriodEnd: new Date(subscription.current_period_end * 1000),
             cancelAtPeriodEnd: subscription.cancel_at_period_end,
           },
           { upsert: true, new: true }
         );
         
         // If it's a new billing cycle or initial creation and status is active, you would normally 
         // provision credits here, ensuring you don't double-credit using idempotency (e.g., checking invoice ID).
         // For brevity, tracking subscription state is implemented. Credit allocation for subscriptions 
         // would be handled specifically during the 'invoice.paid' event.
       } catch (err) {
         logger.error('Webhook: failed to update subscription:', err.message);
       }
    }
  }

  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object;
    try {
      await Subscription.findOneAndUpdate(
        { stripeSubscriptionId: subscription.id },
        { status: 'canceled' }
      );
    } catch (err) {
      logger.error('Webhook: failed to cancel subscription:', err.message);
    }
  }

  // Handle invoice.paid to allocate monthly credits
  if (event.type === 'invoice.paid') {
     const invoice = event.data.object;
     if (invoice.subscription) {
       const idempotencyKey = `invoice_${invoice.id}`;
       const subscription = await getStripe().subscriptions.retrieve(invoice.subscription);
       const userId = subscription.metadata?.userId;
       const packageId = subscription.items.data[0].price.id;
       
       // Simple mapping for demo. Real app should use DB or price IDs.
       let creditsToAdd = 0;
       if (packageId.includes('pro')) creditsToAdd = 500;
       else if (packageId.includes('growth')) creditsToAdd = 100;
       else if (packageId.includes('starter')) creditsToAdd = 20;

       if (userId && creditsToAdd > 0) {
         try {
           const existing = await ProcessedPayment.findOne({ paymentIntentId: idempotencyKey });
           if (!existing) {
             await User.findByIdAndUpdate(userId, { $inc: { credits: creditsToAdd } });
             await ProcessedPayment.create({ 
               paymentIntentId: idempotencyKey, 
               userId, 
               credits: creditsToAdd, 
               packageId: 'subscription_renewal' 
             });
             logger.info(`Subscription renewed: Credited ${creditsToAdd} credits to user ${userId}`);
           }
         } catch(err) {
           logger.error('Webhook error processing invoice:', err.message);
         }
       }
     }
  }

  res.status(200).json({ received: true });
};

// @desc    Verify a PaymentIntent and immediately credit the user
// @route   POST /api/stripe/verify/:paymentIntentId
// @access  Private
export const verifyPayment = async (req, res) => {
  try {
    const { paymentIntentId } = req.params;
    const stripe = getStripe();

    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ error: 'Payment not completed.' });
    }

    const { userId, credits } = paymentIntent.metadata || {};

    if (!userId || !credits) {
      return res.status(400).json({ error: 'Missing payment metadata.' });
    }

    if (userId !== req.user.id.toString()) {
      return res.status(403).json({ error: 'Unauthorized.' });
    }

    const pkgId = paymentIntent.metadata.package || '';
    const existing = await ProcessedPayment.findOne({ paymentIntentId: paymentIntent.id });
    if (!existing) {
      await User.findByIdAndUpdate(userId, {
        $inc: { credits: parseInt(credits, 10) },
        ...(pkgId && { plan: pkgId }),
      });
      await ProcessedPayment.create({
        paymentIntentId: paymentIntent.id,
        userId,
        credits: parseInt(credits, 10),
        packageId: pkgId,
      });
    }

    const user = await User.findById(userId).select('credits plan');
    res.status(200).json({ success: true, credits: user.credits, plan: user.plan });
  } catch (error) {
    logger.error('Verify Payment Error:', error);
    res.status(500).json({ error: 'Failed to verify payment.' });
  }
};

// @desc    Get current subscription for the authenticated user
// @route   GET /api/stripe/subscription
// @access  Private
export const getSubscription = async (req, res) => {
  try {
    const sub = await Subscription.findOne({
      user: req.user.id,
      status: { $in: ['active', 'past_due', 'trialing'] },
    }).sort({ createdAt: -1 });

    if (!sub) return res.json({ subscription: null });

    // Refresh from Stripe so we always show live data
    const stripe = getStripe();
    const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);

    await Subscription.findByIdAndUpdate(sub._id, {
      status: stripeSub.status,
      cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
    });

    res.json({
      subscription: {
        id: sub.stripeSubscriptionId,
        status: stripeSub.status,
        planId: sub.planId,
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSub.cancel_at_period_end,
      },
    });
  } catch (err) {
    logger.error('Get Subscription Error:', err);
    res.status(500).json({ error: err.message || 'Failed to retrieve subscription.' });
  }
};

// @desc    Cancel subscription at end of current period
// @route   DELETE /api/stripe/subscription
// @access  Private
export const cancelSubscription = async (req, res) => {
  try {
    const sub = await Subscription.findOne({
      user: req.user.id,
      status: { $in: ['active', 'trialing'] },
    });

    if (!sub) return res.status(404).json({ error: 'No active subscription found.' });

    const stripe = getStripe();
    const updated = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    await Subscription.findByIdAndUpdate(sub._id, { cancelAtPeriodEnd: true });

    res.json({
      success: true,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: new Date(updated.current_period_end * 1000),
    });
  } catch (err) {
    logger.error('Cancel Subscription Error:', err);
    res.status(500).json({ error: err.message || 'Failed to cancel subscription.' });
  }
};

// @desc    Reactivate a subscription that was set to cancel at period end
// @route   POST /api/stripe/subscription/reactivate
// @access  Private
export const reactivateSubscription = async (req, res) => {
  try {
    const sub = await Subscription.findOne({
      user: req.user.id,
      cancelAtPeriodEnd: true,
    });

    if (!sub) return res.status(404).json({ error: 'No subscription pending cancellation.' });

    const stripe = getStripe();
    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: false,
    });

    await Subscription.findByIdAndUpdate(sub._id, { cancelAtPeriodEnd: false });

    res.json({ success: true, cancelAtPeriodEnd: false });
  } catch (err) {
    logger.error('Reactivate Subscription Error:', err);
    res.status(500).json({ error: err.message || 'Failed to reactivate subscription.' });
  }
};

// @desc    Change subscription plan (upgrade / downgrade)
// @route   PUT /api/stripe/subscription/plan
// @access  Private
export const changeSubscriptionPlan = async (req, res) => {
  try {
    const { newPriceId } = req.body;
    if (!newPriceId) return res.status(400).json({ error: 'newPriceId is required.' });

    const sub = await Subscription.findOne({
      user: req.user.id,
      status: { $in: ['active', 'trialing'] },
    });

    if (!sub) return res.status(404).json({ error: 'No active subscription found.' });

    const stripe = getStripe();
    const stripeSub = await stripe.subscriptions.retrieve(sub.stripeSubscriptionId);
    const itemId = stripeSub.items.data[0].id;

    await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      items: [{ id: itemId, price: newPriceId }],
      proration_behavior: 'always_invoice',
    });

    await Subscription.findByIdAndUpdate(sub._id, { planId: newPriceId });

    res.json({ success: true, newPriceId });
  } catch (err) {
    logger.error('Change Plan Error:', err);
    res.status(500).json({ error: err.message || 'Failed to change subscription plan.' });
  }
};

// @desc    Create Stripe Checkout Session for Subscriptions
// @route   POST /api/stripe/subscribe
// @access  Private
export const createSubscriptionSession = async (req, res) => {
  try {
    const { priceId } = req.body;
    const userId = req.user.id;
    
    // In a real app, priceId comes from the client selecting a plan
    if (!priceId) {
       return res.status(400).json({ error: 'Price ID is required' });
    }

    const stripe = getStripe();
    const clientUrl = process.env.CLIENT_URL?.split(',')[0] || 'http://localhost:5173';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      ui_mode: 'embedded',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      return_url: `${clientUrl}?success=true&session_id={CHECKOUT_SESSION_ID}`,
      subscription_data: {
        metadata: {
          userId: userId.toString(),
        }
      },
      metadata: {
        userId: userId.toString(),
      }
    });

    res.status(200).json({
      success: true,
      clientSecret: session.client_secret
    });
  } catch (error) {
    logger.error('Subscription Session Error:', error);
    res.status(500).json({ error: 'Failed to create subscription session.' });
  }
};
