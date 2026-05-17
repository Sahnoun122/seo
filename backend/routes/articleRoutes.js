import express from 'express';
import { generateArticle, getHistory, refineArticle } from '../controllers/articleController.js';
import { getInternalLinks } from '../controllers/internalLinkingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/generate-article', protect, generateArticle);
router.get('/history', protect, getHistory);
router.patch('/history/:id/refine', protect, refineArticle);
router.post('/internal-links', protect, getInternalLinks);

export default router;
