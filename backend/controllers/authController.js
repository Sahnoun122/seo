import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import User from '../models/User.js';
import Article from '../models/Article.js';
import Image from '../models/Image.js';
import ImageService from '../services/ImageService.js';
import { getSystemSettings } from '../services/settingsService.js';
import { sendEmailVerificationEmail } from '../services/emailService.js';
import logger from '../utils/logger.js';

// Generate JWT token
const generateToken = (id) => {
  if (!process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is not set. Cannot sign tokens.');
  }
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '1d',
  });
};

// Browser clients authenticate via this httpOnly cookie — JS on the page can never read it,
// which closes off token theft via XSS. The documented deployment topology (SETUP.md) puts
// the frontend on Vercel and the backend on Railway/Render — different registrable domains —
// so the cookie must be cross-site. SameSite=None (+ Secure, mandatory for None) is required
// for that; SameSite=Lax would silently stop being sent on cross-site XHR/fetch, breaking auth
// on every request after login. In local dev both run on localhost (same-site), where Lax over
// plain HTTP is what allows the cookie to work without HTTPS.
const isProd = process.env.NODE_ENV === 'production';
const TOKEN_COOKIE = 'token';
const tokenCookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'none' : 'lax',
  maxAge: 24 * 60 * 60 * 1000, // 1d, matches JWT expiresIn
};

const setTokenCookie = (res, token) => {
  res.cookie(TOKEN_COOKIE, token, tokenCookieOptions);
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Please add all fields' });
    }

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ error: 'User already exists' });
    }

    // Determine role: first user is admin, others are users
    const isFirstUser = (await User.countDocuments({})) === 0;
    const role = isFirstUser ? 'admin' : 'user';

    // Get default credit amount
    const systemSettings = await getSystemSettings();
    const credits = systemSettings.defaultUserCredits !== undefined ? systemSettings.defaultUserCredits : 10;

    // Create user
    const user = await User.create({
      name,
      email,
      password,
      role,
      credits,
      isEmailVerified: process.env.DEMO_MODE === 'true',
    });

    if (user) {
      // Generate verification token and send email (non-blocking)
      let devVerifyUrl;
      if (!user.isEmailVerified) {
        try {
          const rawToken = user.createEmailVerificationToken();
          await user.save({ validateBeforeSave: false });
          const appUrl = process.env.CLIENT_URL || process.env.APP_URL || 'http://localhost:5173';
          const verifyUrl = `${appUrl}/verify-email/${rawToken}`;
          const emailResult = await sendEmailVerificationEmail({
            to: user.email,
            verifyUrl,
          });
          // Only ever hand the raw verify link back to the client outside production.
          // Otherwise a misconfigured RESEND_API_KEY (or any other email-send failure)
          // in production would leak this dev convenience into the register response,
          // and the frontend would follow it instead of landing on the dashboard —
          // stranding real users on a verification page instead of the app.
          if (emailResult?.fallback && process.env.NODE_ENV !== 'production') {
            devVerifyUrl = verifyUrl;
          }
        } catch (emailErr) {
          logger.error('Verification email error:', emailErr.message);
        }
      }

      const token = generateToken(user._id);
      setTokenCookie(res, token);

      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        credits: user.credits,
        plan: user.plan || 'free',
        isEmailVerified: user.isEmailVerified,
        token,
        ...(devVerifyUrl && { devVerifyUrl }),
      });
    } else {
      res.status(400).json({ error: 'Invalid user data' });
    }
  } catch (error) {
    logger.error('Register Error:', error.message);
    res.status(500).json({ error: 'Server error during registration' });
  }
};

// @desc    Authenticate a user
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please add all fields' });
    }

    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      const token = generateToken(user._id);
      setTokenCookie(res, token);

      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        credits: user.credits,
        plan: user.plan || 'free',
        isEmailVerified: user.isEmailVerified,
        token,
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    logger.error('Login Error:', error.message);
    res.status(500).json({ error: 'Server error during login' });
  }
};

// @desc    Log out the current user
// @route   POST /api/auth/logout
// @access  Private
export const logoutUser = (req, res) => {
  res.clearCookie(TOKEN_COOKIE, tokenCookieOptions);
  res.status(200).json({ success: true });
};

// @desc    Get user data
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = {
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      credits: req.user.credits,
      plan: req.user.plan || 'free',
      isEmailVerified: req.user.isEmailVerified,
      settings: req.user.settings || {
        userApiKey: '',
        userBaseUrl: '',
        preferredModel: '',
        defaultLanguage: 'French',
        defaultTone: 'Professional',
        wpUrl: '',
        wpUsername: '',
        wpApplicationPassword: '',
      }
    };
    res.status(200).json(user);
  } catch (error) {
    logger.error('GetMe Error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Get user settings
// @route   GET /api/auth/settings
// @access  Private
export const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const settings = user.settings || {
      userApiKey: '',
      userBaseUrl: '',
      preferredModel: '',
      defaultLanguage: 'French',
      defaultTone: 'Professional',
      wpUrl: '',
      wpUsername: '',
      wpApplicationPassword: '',
    };

    res.status(200).json({ success: true, settings });
  } catch (error) {
    logger.error('Get Settings Error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Update user settings
// @route   PUT /api/auth/settings
// @access  Private
export const updateSettings = async (req, res) => {
  try {
    const { userApiKey, userBaseUrl, preferredModel, defaultLanguage, defaultTone, wpUrl, wpUsername, wpApplicationPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    user.settings = {
      userApiKey: (userApiKey || '').trim(),
      userBaseUrl: (userBaseUrl || '').trim(),
      preferredModel: (preferredModel || '').trim(),
      defaultLanguage: defaultLanguage || 'French',
      defaultTone: defaultTone || 'Professional',
      wpUrl: (wpUrl || '').trim(),
      wpUsername: (wpUsername || '').trim(),
      wpApplicationPassword: (wpApplicationPassword || '').trim(),
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully.',
      settings: user.settings
    });
  } catch (error) {
    logger.error('Update Settings Error:', error.message);
    res.status(500).json({ error: 'Server error' });
  }
};

// @desc    Verify email address via token
// @route   GET /api/auth/verify-email/:token
// @access  Public
export const verifyEmail = async (req, res) => {
  try {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');

    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationExpires: { $gt: new Date() },
    }).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) {
      return res.status(400).json({ error: 'Verification link is invalid or has expired.' });
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, message: 'Email verified successfully.' });
  } catch (error) {
    logger.error('Verify Email Error:', error.message);
    res.status(500).json({ error: 'Server error during email verification.' });
  }
};

// @desc    Resend email verification link
// @route   POST /api/auth/resend-verification
// @access  Private
export const resendVerificationEmail = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('+emailVerificationToken +emailVerificationExpires');

    if (!user) return res.status(404).json({ error: 'User not found.' });
    if (user.isEmailVerified) return res.status(400).json({ error: 'Email is already verified.' });

    const rawToken = user.createEmailVerificationToken();
    await user.save({ validateBeforeSave: false });

    const appUrl = process.env.APP_URL || 'http://localhost:5173';
    await sendEmailVerificationEmail({
      to: user.email,
      verifyUrl: `${appUrl}/verify-email/${rawToken}`,
    });

    res.status(200).json({ success: true, message: 'Verification email sent.' });
  } catch (error) {
    logger.error('Resend Verification Error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to send verification email.' });
  }
};

// @desc    Permanently delete account and all associated data (GDPR right to erasure)
// @route   DELETE /api/auth/account
// @access  Private
export const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.id;

    // Delete all cover images from S3
    const articles = await Article.find({ user: userId });
    const imageIds = articles.map((a) => a.coverImageId).filter(Boolean);

    if (imageIds.length > 0) {
      const images = await Image.find({ _id: { $in: imageIds } });
      const s3Paths = images.flatMap((img) =>
        [img.path, img.thumbnails?.small, img.thumbnails?.medium, img.thumbnails?.large].filter(Boolean)
      );
      if (s3Paths.length > 0) {
        await ImageService.deleteImagePaths(s3Paths);
      }
      await Image.deleteMany({ _id: { $in: imageIds } });
    }

    // Delete all articles
    await Article.deleteMany({ user: userId });

    // Delete the user account
    await User.findByIdAndDelete(userId);

    res.status(200).json({
      success: true,
      message: 'Your account and all associated data have been permanently deleted.',
    });
  } catch (error) {
    logger.error('Delete Account Error:', error.message);
    res.status(500).json({ error: 'Failed to delete account. Please try again or contact support.' });
  }
};
