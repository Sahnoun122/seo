import User from '../models/User.js';
import Settings from '../models/Settings.js';
import { getSystemSettings } from '../services/settingsService.js';
import bcrypt from 'bcryptjs';
import { getAllUsers, updateUserCredits, deleteUser } from './adminController.js';
import logger from '../utils/logger.js';

// @desc    Get all settings (global system settings, user profile, and user list if admin)
// @route   GET /api/settings
// @access  Private
export const getSettings = async (req, res) => {
  try {
    const systemSettings = await getSystemSettings();
    const currentUser = await User.findById(req.user.id).select('-password');

    if (!currentUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Use toObject({ getters: true }) so encrypted fields are decrypted for the settings form.
    // toJSON strips them globally to avoid leaking them in other responses.
    const userObj = currentUser.toObject({ getters: true });
    const personalSettingsResponse = {
      name: userObj.name,
      email: userObj.email,
      role: userObj.role,
      credits: userObj.credits,
      settings: userObj.settings || {
        userApiKey: '',
        userBaseUrl: '',
        preferredModel: '',
        defaultLanguage: 'French',
        defaultTone: 'Professional',
      },
    };

    if (currentUser.role === 'admin') {
      const users = await User.find({})
        .select('-password')
        .sort({ role: 1, createdAt: -1 });

      return res.status(200).json({
        success: true,
        systemSettings: {
          openaiApiKey: systemSettings.openaiApiKey || '',
          defaultModel: systemSettings.defaultModel || 'gpt-4o',
          allowUserKeys: systemSettings.allowUserKeys !== false,
          defaultUserCredits: systemSettings.defaultUserCredits !== undefined ? systemSettings.defaultUserCredits : 10,
        },
        personalSettings: personalSettingsResponse,
        users,
      });
    } else {
      return res.status(200).json({
        success: true,
        systemSettings: {
          allowUserKeys: systemSettings.allowUserKeys !== false,
          defaultModel: systemSettings.defaultModel || 'gpt-4o',
        },
        personalSettings: personalSettingsResponse,
      });
    }
  } catch (error) {
    logger.error('Get Settings Error:', error.message);
    res.status(500).json({ error: 'Failed to retrieve settings' });
  }
};

// @desc    Update profile or global settings
// @route   PUT /api/settings
// @access  Private
export const updateSettings = async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      userApiKey, 
      userBaseUrl, 
      preferredModel, 
      defaultLanguage, 
      defaultTone, 
      wpUrl,
      wpUsername,
      wpApplicationPassword,
      systemSettings: systemInput 
    } = req.body;
    
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const systemSettings = await getSystemSettings();

    // 1. Profile Update (General)
    if (name) user.name = name;
    if (email) {
      if (email !== user.email) {
        const emailTaken = await User.findOne({ email });
        if (emailTaken) {
          return res.status(400).json({ error: 'Email is already taken by another user.' });
        }
        user.email = email;
      }
    }
    
    if (password && password.trim() !== '') {
      const strongPwd = /^(?=.*[A-Z])(?=.*[0-9]).{8,}$/;
      if (!strongPwd.test(password)) {
        return res.status(400).json({ error: 'Password must be at least 8 characters and include an uppercase letter and a number.' });
      }
      user.password = password;
    }

    // 2. Personal OpenAI / Custom Provider Keys & Settings
    if (!user.settings) {
      user.settings = {
        userApiKey: '',
        userBaseUrl: '',
        preferredModel: '',
        defaultLanguage: 'French',
        defaultTone: 'Professional'
      };
    }

    // Only allow changing API configuration if system allows user keys, or if the user is an admin
    if (systemSettings.allowUserKeys || user.role === 'admin') {
      if (userApiKey !== undefined) user.settings.userApiKey = userApiKey;
      if (userBaseUrl !== undefined) user.settings.userBaseUrl = userBaseUrl;
      if (preferredModel !== undefined) user.settings.preferredModel = preferredModel;
      if (defaultLanguage !== undefined) user.settings.defaultLanguage = defaultLanguage;
      if (defaultTone !== undefined) user.settings.defaultTone = defaultTone;
      if (wpUrl !== undefined) user.settings.wpUrl = wpUrl;
      if (wpUsername !== undefined) user.settings.wpUsername = wpUsername;
      if (wpApplicationPassword !== undefined && wpApplicationPassword.trim() !== '') {
        user.settings.wpApplicationPassword = wpApplicationPassword;
      }
    } else {
      // Still allow non-API breaking changes
      if (preferredModel !== undefined) user.settings.preferredModel = preferredModel;
      if (defaultLanguage !== undefined) user.settings.defaultLanguage = defaultLanguage;
      if (defaultTone !== undefined) user.settings.defaultTone = defaultTone;
      if (wpUrl !== undefined) user.settings.wpUrl = wpUrl;
      if (wpUsername !== undefined) user.settings.wpUsername = wpUsername;
      if (wpApplicationPassword !== undefined && wpApplicationPassword.trim() !== '') {
        user.settings.wpApplicationPassword = wpApplicationPassword;
      }
    }

    // Make sure Mongoose recognizes the nested changes
    user.markModified('settings');
    await user.save();

    // 3. Global Settings Update (Admins Only)
    if (user.role === 'admin' && systemInput) {
      const globalConfig = await Settings.findOne({});
      if (globalConfig) {
        if (systemInput.openaiApiKey !== undefined) globalConfig.openaiApiKey = systemInput.openaiApiKey;
        if (systemInput.defaultModel !== undefined) globalConfig.defaultModel = systemInput.defaultModel;
        if (systemInput.allowUserKeys !== undefined) globalConfig.allowUserKeys = systemInput.allowUserKeys;
        if (systemInput.defaultUserCredits !== undefined) globalConfig.defaultUserCredits = Number(systemInput.defaultUserCredits);
        await globalConfig.save();
      }
    }

    // Refetch clean system settings and user
    const updatedSystemSettings = await getSystemSettings();
    const cleanUser = await User.findById(user._id).select('-password');
    const cleanUserObj = cleanUser.toObject({ getters: true });

    const personalSettingsResponse = {
      name: cleanUserObj.name,
      email: cleanUserObj.email,
      role: cleanUserObj.role,
      credits: cleanUserObj.credits,
      settings: cleanUserObj.settings || {
        userApiKey: '',
        userBaseUrl: '',
        preferredModel: '',
        defaultLanguage: 'French',
        defaultTone: 'Professional',
      },
    };

    res.status(200).json({
      success: true,
      message: 'Settings updated successfully.',
      personalSettings: personalSettingsResponse,
      systemSettings: user.role === 'admin' ? {
        openaiApiKey: updatedSystemSettings.openaiApiKey || '',
        defaultModel: updatedSystemSettings.defaultModel || 'gpt-4o',
        allowUserKeys: updatedSystemSettings.allowUserKeys !== false,
        defaultUserCredits: updatedSystemSettings.defaultUserCredits !== undefined ? updatedSystemSettings.defaultUserCredits : 10,
      } : {
        allowUserKeys: updatedSystemSettings.allowUserKeys !== false,
        defaultModel: updatedSystemSettings.defaultModel || 'gpt-4o',
      }
    });
  } catch (error) {
    logger.error('Update Settings Error:', error.message);
    res.status(500).json({ error: 'Failed to update settings.' });
  }
};

// Re-exported from adminController to avoid duplication
export { getAllUsers, updateUserCredits, deleteUser };
