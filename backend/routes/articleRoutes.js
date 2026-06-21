import express from 'express';
import {
  generateArticle, getHistory, refineArticle,
  publishToWordPress, deleteArticle,
  restoreVersion, setCoverImage, streamArticle,
} from '../controllers/articleController.js';
import { getInternalLinks } from '../controllers/internalLinkingController.js';
import { protect } from '../middleware/authMiddleware.js';
import { uploadSingle } from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/generate-article', protect, generateArticle);
router.post('/articles/stream', protect, streamArticle);
router.get('/history', protect, getHistory);
router.patch('/history/:id/refine', protect, refineArticle);
router.post('/history/:id/restore/:versionIndex', protect, restoreVersion);
router.delete('/articles/:id', protect, deleteArticle);
router.post('/articles/:id/cover', protect, uploadSingle, setCoverImage);
router.post('/internal-links', protect, getInternalLinks);
router.post('/articles/:id/publish-wordpress', protect, publishToWordPress);

export default router;
