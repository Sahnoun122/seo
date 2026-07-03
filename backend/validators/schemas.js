import { z } from 'zod';

const strongPassword = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128)
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// ── Auth Schemas ──
export const registerSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name must be 100 characters or less').trim(),
  email: z.string().email('Invalid email address').max(255).trim().toLowerCase(),
  password: strongPassword,
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').trim().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  password: strongPassword,
});

// ── Article Schemas ──
export const generateArticleSchema = z.object({
  keyword: z.string().min(1, 'Keyword is required').max(100, 'Keyword must be 100 characters or less').trim(),
});

export const refineArticleSchema = z.object({
  prompt: z.string().min(1, 'Refinement prompt is required').max(2000, 'Prompt must be 2000 characters or less').trim(),
});

// ── Settings Schemas ──
export const updateSettingsSchema = z.object({
  name: z.string().min(1).max(100).trim().optional(),
  email: z.string().email().max(255).trim().toLowerCase().optional(),
  password: strongPassword.optional().or(z.literal('')),
  userApiKey: z.string().max(500).optional(),
  userBaseUrl: z.string().max(500).optional(),
  preferredModel: z.string().max(100).optional(),
  defaultLanguage: z.enum(['English', 'French', 'Spanish', 'Arabic', 'Italian', 'Chinese']).optional(),
  defaultTone: z.enum(['Professional', 'Informative', 'Conversational', 'Persuasive', 'Creative']).optional(),
  wpUrl: z.string().max(500).trim()
    .regex(/^(https?:\/\/)?[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+(?::\d{1,5})?(?:\/.*)?$/, 'Must be a valid domain or URL')
    .optional().or(z.literal('')),
  wpUsername: z.string().max(255).optional(),
  wpApplicationPassword: z.string().max(500).optional(),
  systemSettings: z.object({
    openaiApiKey: z.string().max(500).optional(),
    openaiBaseUrl: z.string().max(500).optional(),
    defaultModel: z.string().max(100).optional(),
    allowUserKeys: z.boolean().optional(),
    defaultUserCredits: z.number().int().min(0).max(100000).optional(),
  }).optional(),
}).strict().optional().default({});

// ── Admin Schemas ──
export const updateCreditsSchema = z.object({
  credits: z.number().int().min(0, 'Credits must be 0 or more').max(1000000),
});

// ── Stripe Schemas ──
export const checkoutSchema = z.object({
  packageId: z.enum(['starter', 'growth', 'pro'], { message: 'Invalid package selected.' }),
});

// ── Internal Linking Schema ──
export const internalLinkingSchema = z.object({
  content: z.string().min(1, 'Article content is required').max(50000),
  knownUrls: z.array(z.string().url()).max(100).optional().default([]),
  articleId: z.string().optional(),
});

/**
 * Express middleware factory for Zod validation.
 * Validates req.body against the given schema.
 */
export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);
  if (!result.success) {
    const errors = result.error.issues.map(i => i.message);
    return res.status(400).json({ error: errors[0], errors });
  }
  req.body = result.data;
  next();
};
