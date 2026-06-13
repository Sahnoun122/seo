import express from 'express';
import { generateArticle, getHistory, refineArticle, publishToWordPress, deleteArticle } from '../controllers/articleController.js';
import { getInternalLinks } from '../controllers/internalLinkingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate-article', protect, generateArticle);
router.get('/history', protect, getHistory);
router.patch('/history/:id/refine', protect, refineArticle);
router.delete('/articles/:id', protect, deleteArticle);
router.post('/internal-links', protect, getInternalLinks);
router.post('/articles/:id/publish-wordpress', protect, publishToWordPress);

export default router;
