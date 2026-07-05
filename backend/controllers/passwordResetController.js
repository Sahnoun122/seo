import logger from '../utils/logger.js';
import User from '../models/User.js';
import PasswordReset from '../models/PasswordReset.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { isProduction } from '../utils/env.js';

// @desc    Request a password reset link
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // Always return success — prevents email enumeration
    const genericSuccess = {
      success: true,
      message: 'If an account with that email exists, a reset link has been sent.',
    };

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(200).json(genericSuccess);

    const rawToken = await PasswordReset.createToken(user._id);
    const clientUrl = process.env.CLIENT_URL?.split(',')[0]?.trim() || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password/${rawToken}`;

    try {
      await sendPasswordResetEmail({ to: user.email, resetUrl });
    } catch (emailErr) {
      logger.error('Email send failed:', emailErr.message);
      // In dev, still expose the URL so the flow can be tested
      if (!isProduction()) {
        return res.status(200).json({ ...genericSuccess, resetUrl });
      }
      return res.status(500).json({ error: 'Failed to send reset email. Please try again later.' });
    }

    res.status(200).json(genericSuccess);
  } catch (error) {
    logger.error('Forgot Password Error:', error);
    res.status(500).json({ error: 'Failed to process request.' });
  }
};

// @desc    Reset password using a valid token
// @route   POST /api/auth/reset-password/:token
// @access  Public
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const resetRecord = await PasswordReset.findValidToken(token);
    if (!resetRecord) {
      return res.status(400).json({ error: 'This reset link is invalid or has expired. Please request a new one.' });
    }

    const user = await User.findById(resetRecord.user);
    if (!user) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    user.password = password;
    await user.save();

    resetRecord.used = true;
    await resetRecord.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully. You can now sign in.',
    });
  } catch (error) {
    logger.error('Reset Password Error:', error);
    res.status(500).json({ error: 'Failed to reset password.' });
  }
};
