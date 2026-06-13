import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import connectDB from './config/db.js';
import { globalLimiter, authLimiter, generationLimiter } from './middleware/rateLimiter.js';
import articleRoutes from './routes/articleRoutes.js';
import authRoutes from './routes/authRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import imageRoutes from './routes/imageRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

const app = express();
app.set('trust proxy', 1);

if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
  console.warn('\x1b[33m%s\x1b[0m', '⚠️  WARNING: OPENAI_API_KEY is missing from your .env file.');
  console.warn('\x1b[33m%s\x1b[0m', '   AI article generation will fail unless users provide their own API key in Settings.');
}

const PORT = process.env.PORT || 5000;

// Security HTTP headers
app.use(helmet());

// Dynamic CORS configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
  ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:5173'] : [])
].filter(Boolean);

const corsOptions = {
  origin: allowedOrigins,
  credentials: true,
  optionsSuccessStatus: 200
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(morgan('dev'));

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
    console.error('Database connection error in middleware:', error.message);
    res.status(500).json({ error: 'Database connection failed: ' + error.message });
  }
});

// Routes Registration
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/images', imageRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api', articleRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

// 404 catch-all
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Server initialization for local development
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server successfully started and listening on port ${PORT}`);
  });
}

export default app;
