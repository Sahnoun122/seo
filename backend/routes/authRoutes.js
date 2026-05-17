import express from 'express';
import { registerUser, loginUser, getMe, getSettings, updateSettings } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMe);
router.get('/settings', protect, getSettings);
router.put('/settings', protect, updateSettings);

export default router;
