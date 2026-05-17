import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getSystemSettings } from '../services/settingsService.js';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret_key', {
    expiresIn: '30d',
  });
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
      credits
    });

    if (user) {
      res.status(201).json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        credits: user.credits,
        token: generateToken(user._id),
      });
    } else {
      res.status(400).json({ error: 'Invalid user data' });
    }
  } catch (error) {
    console.error("Register Error:", error);
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
      res.json({
        _id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        credits: user.credits,
        token: generateToken(user._id),
      });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: 'Server error during login' });
  }
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
    console.error("GetMe Error:", error);
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
    console.error("Get Settings Error:", error);
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
    console.error("Update Settings Error:", error);
    res.status(500).json({ error: 'Server error' });
  }
};
