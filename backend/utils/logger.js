import { isProduction } from './env.js';

// Checked per-call, not cached at module load — dotenv hasn't necessarily
// finished loading .env yet when this module is first imported (see env.js).
const logger = {
  info:  (...args) => { if (!isProduction()) console.log('[INFO]',  ...args); },
  warn:  (...args) => console.warn('[WARN]',  ...args),
  error: (...args) => console.error('[ERROR]', ...args),
  debug: (...args) => { if (!isProduction()) console.log('[DEBUG]', ...args); },
};

export default logger;
