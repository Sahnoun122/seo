import logger from '../utils/logger.js';
import { isProduction } from '../utils/env.js';

/**
 * Global Express Error Handler
 * Catches all unhandled errors from routes and middleware.
 * Must be registered AFTER all routes.
 */
const errorHandler = (err, req, res, _next) => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'An unexpected server error occurred.';

  // Log full error in development, minimal in production
  if (!isProduction()) {
    logger.error('[ErrorHandler]', { message: err.message, stack: err.stack });
  } else {
    logger.error('[ErrorHandler]', err.message);
  }

  res.status(statusCode).json({
    success: false,
    error: isProduction() && statusCode === 500
      ? 'An unexpected server error occurred.'
      : message,
  });
};

export default errorHandler;
