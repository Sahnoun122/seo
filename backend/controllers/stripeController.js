import Stripe from 'stripe';
import User from '../models/User.js';

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
      success_url: `${clientUrl}/buy-credits?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${clientUrl}/buy-credits?cancelled=true`,
      metadata: {
        userId:  req.user.id.toString(),
        credits: pkg.credits.toString(),
        package: pkg.id,
      },
    });

    res.status(200).json({ success: true, url: session.url });
  } catch (error) {
    console.error('Stripe Checkout Error:', error);
    res.status(500).json({ error: error.message || 'Failed to create checkout session.' });
  }
};

// @desc    Stripe webhook — credit user after successful payment
// @route   POST /api/stripe/webhook
// @access  Public (Stripe signature verified)
export const handleWebhook = async (req, res) => {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('STRIPE_WEBHOOK_SECRET is not set.');
    return res.status(500).send('Webhook secret not configured.');
  }

  const sig = req.headers['stripe-signature'];
  let event;

  try {
    const stripe = getStripe();
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Stripe Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { userId, credits } = session.metadata || {};

    if (!userId || !credits) {
      console.error('Webhook: missing metadata', session.metadata);
      return res.status(400).send('Missing metadata.');
    }

    try {
      await User.findByIdAndUpdate(userId, { $inc: { credits: parseInt(credits, 10) } });
      console.log(`✅ Credited ${credits} credits to user ${userId}`);
    } catch (err) {
      console.error('Webhook: failed to update user credits:', err);
      return res.status(500).send('Database error.');
    }
  }

  res.status(200).json({ received: true });
};
