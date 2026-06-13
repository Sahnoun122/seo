import rateLimit from 'express-rate-limit';

// Standard 429 error responder helper
const customLimiterHandler = (req, res, next, options) => {
  res.status(429).json({ error: "Too many requests. Please wait before trying again." });
};

/**
 * Limit each IP to 100 API requests per 15 minutes globally.
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 100,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: customLimiterHandler
});

/**
 * Limit each IP to 5 auth (register/login) requests per 15 minutes strictly.
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: customLimiterHandler
});

/**
 * Limit each IP to 5 article generation attempts per 15 minutes strictly.
 */
export const generationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: customLimiterHandler
});
