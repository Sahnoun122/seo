import express from 'express';
import { registerUser, loginUser, getMe, getSettings, updateSettings, deleteAccount, verifyEmail, resendVerificationEmail } from '../controllers/authController.js';
import { forgotPassword, resetPassword } from '../controllers/passwordResetController.js';
import { protect } from '../middleware/authMiddleware.js';
import { validate, registerSchema, loginSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/schemas.js';

const router = express.Router();

router.post('/register', validate(registerSchema), registerUser);
router.post('/login', validate(loginSchema), loginUser);
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password/:token', validate(resetPasswordSchema), resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', protect, resendVerificationEmail);
router.get('/me', protect, getMe);
router.get('/settings', protect, getSettings);
router.put('/settings', protect, updateSettings);
router.delete('/account', protect, deleteAccount);

export default router;
