import express from 'express';
import {
  generateArticle, getHistory, refineArticle,
  publishToWordPress, deleteArticle,
  restoreVersion, setCoverImage, streamArticle,
} from '../controllers/articleController.js';
import { generateAICover } from '../controllers/imageGenerationController.js';
import { setUnsplashCover } from '../controllers/unsplashController.js';
import { getInternalLinks } from '../controllers/internalLinkingController.js';
import { protect } from '../middleware/authMiddleware.js';

import { uploadSingle } from '../middleware/uploadMiddleware.js';
import { validate, generateArticleSchema, refineArticleSchema, internalLinkingSchema } from '../validators/schemas.js';

const router = express.Router();

router.post('/generate-article', protect, validate(generateArticleSchema), generateArticle);
router.post('/articles/stream', protect, validate(generateArticleSchema), streamArticle);
router.get('/history', protect, getHistory);
router.patch('/history/:id/refine', protect, validate(refineArticleSchema), refineArticle);
router.post('/history/:id/restore/:versionIndex', protect, restoreVersion);
router.delete('/articles/:id', protect, deleteArticle);
router.post('/articles/:id/cover', protect, uploadSingle, setCoverImage);
router.post('/internal-links', protect, validate(internalLinkingSchema), getInternalLinks);
router.post('/articles/:id/publish-wordpress', protect, publishToWordPress);
router.post('/articles/:id/generate-cover-ai', protect, generateAICover);
router.post('/articles/:id/cover-unsplash', protect, setUnsplashCover);

export default router;
