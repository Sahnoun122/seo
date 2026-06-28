import 'dotenv/config';
import * as Sentry from '@sentry/node';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import mongoSanitize from 'express-mongo-sanitize';
import swaggerUi from 'swagger-ui-express';
import openApiSpec from './docs/openapi.js';

// Sentry must be initialized before any other code runs (optional — only when DSN is set)
if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  });
}
import connectDB from './config/db.js';
import logger from './utils/logger.js';
import { globalLimiter, authLimiter, generationLimiter } from './middleware/rateLimiter.js';
import errorHandler from './middleware/errorHandler.js';
import articleRoutes from './routes/articleRoutes.js';
import authRoutes from './routes/authRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import imageRoutes from './routes/imageRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import stripeRoutes from './routes/stripeRoutes.js';

const app = express();
app.set('trust proxy', 1);

if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
  logger.warn('OPENAI_API_KEY is missing. AI generation will fail unless users provide their own API key in Settings.');
}

const encKey = process.env.ENCRYPTION_KEY || '';
if (encKey.trim().length < 32) {
  const msg = 'SECURITY ERROR: ENCRYPTION_KEY must be at least 32 characters. API keys stored in the database will NOT be encrypted securely.';
  if (process.env.NODE_ENV === 'production') {
    logger.error(`FATAL: ${msg}`);
    process.exit(1);
  } else {
    logger.warn(msg);
  }
}

const PORT = process.env.PORT || 5000;

// Force HTTPS in production (handles reverse proxies like Vercel/Heroku)
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.get('host')}${req.url}`);
    }
    next();
  });
}

// Security HTTP headers
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Dynamic CORS — set CLIENT_URL in Vercel env (comma-separated for multiple origins)
const allowedOrigins = [
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map(u => u.trim()) : []),
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:5173'] : [])
].filter(Boolean);

if (allowedOrigins.length === 0) {
  if (process.env.NODE_ENV === 'production') {
    logger.error('FATAL: CLIENT_URL is not set. Browser requests will be blocked. Exiting.');
    process.exit(1);
  } else {
    logger.warn('CLIENT_URL is not set. All browser requests will be blocked by CORS.');
  }
}

const corsOptions = {
  origin: (origin, callback) => {
    // Allow server-to-server calls (no origin) and listed origins
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());

// Strip $ and . from user input to prevent MongoDB operator injection.
// express-mongo-sanitize@2.x does `req[key] = target` which throws on Express 5
// because req.query is a read-only getter. We call .sanitize() directly instead —
// it mutates the object in-place, making the reassignment unnecessary.
app.use((req, res, next) => {
  ['body', 'params', 'headers', 'query'].forEach((key) => {
    if (req[key]) mongoSanitize.sanitize(req[key]);
  });
  next();
});

// HTTP request logging — only in development
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Apply global rate limiting to all /api routes
app.use('/api', globalLimiter);

// Apply strict rate limiting to auth and generation routes specifically
app.post('/api/auth/login', authLimiter);
app.post('/api/auth/register', authLimiter);
app.post('/api/generate-article', generationLimiter);
app.post('/api/articles', generationLimiter);

// Database connection Middleware for Serverless
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    logger.error('Database connection error in middleware:', error.message);
    res.status(500).json({ error: 'Database connection failed.' });
  }
});

// API Documentation — Swagger UI
// Disable CSP for this route so the Swagger UI scripts can load
app.use('/api/docs', (req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:;");
  next();
}, swaggerUi.serve, swaggerUi.setup(openApiSpec, {
  customSiteTitle: 'SEO Gen AI — API Docs',
  customCss: '.topbar { display: none }',
  swaggerOptions: { persistAuthorization: true },
}));

app.get('/api/docs.json', (req, res) => res.json(openApiSpec));

// Routes Registration
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/stripe', stripeRoutes);
app.use('/api', articleRoutes);

// ── Health & Storage diagnostic endpoints ────────────────────────────────────
app.get('/health', (_req, res) => res.status(200).json({ status: 'ok' }));

app.get('/api/health', async (_req, res) => {
  const { default: ImageService } = await import('./services/ImageService.js');
  const storageHealth = await ImageService.healthCheck();

  const dbState = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const { connection } = await import('mongoose');

  res.status(storageHealth.ok ? 200 : 207).json({
    status: storageHealth.ok ? 'ok' : 'degraded',
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: {
      status: dbState[connection.readyState] || 'unknown',
    },
    storage: storageHealth,
    uptime: Math.floor(process.uptime()) + 's',
    timestamp: new Date().toISOString(),
  });
});

// 404 catch-all
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Sentry error capture — must come before custom error handler
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Global error handler — must be LAST middleware
app.use(errorHandler);

// Server initialization for local development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    logger.info(`Server listening on port ${PORT}`);
  });
}

export default app;
