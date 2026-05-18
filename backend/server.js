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

const app = express();
app.set('trust proxy', 1);

// Vérification rigoureuse de la clé API OpenAI au démarrage
if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.trim() === '') {
  console.warn('\x1b[33m%s\x1b[0m', '⚠️  AVERTISSEMENT CRITIQUE : La variable d\'environnement OPENAI_API_KEY est manquante dans votre fichier .env.');
  console.warn('\x1b[33m%s\x1b[0m', '   Les fonctionnalités de génération d\'articles IA échoueront si les utilisateurs n\'utilisent pas leur propre clé API.');
}

const PORT = process.env.PORT || 5000;

// Security HTTP headers
app.use(helmet());

// Dynamic CORS configuration based on CLIENT_URL env
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
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

// Routes Registration
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/images', imageRoutes);
app.use('/api', articleRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'API is running' });
});

// Database connection & Server initialization
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server successfully started and listening on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to initialize application server:', error.message);
    process.exit(1);
  });
