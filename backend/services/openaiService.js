import OpenAI from 'openai';
import { getSystemSettings } from './settingsService.js';

/**
 * Dynamically resolves the correct OpenAI API client and model to use for a request.
 * If user keys are enabled globally and the user has configured their own key, it is used.
 * Otherwise, it falls back to the system settings or environment variable.
 * 
 * @param {Object} user - The authenticated user document
 * @returns {Promise<Object>} Object containing { openai, model, isUserKey }
 */
export const getOpenAIClientAndModel = async (user) => {
  const systemSettings = await getSystemSettings();
  
  // 1. Check if user provided their own key and it is globally allowed
  const hasUserKey = user && user.settings && user.settings.userApiKey && user.settings.userApiKey.trim() !== '';
  const canUseUserKey = systemSettings.allowUserKeys;

  if (hasUserKey && canUseUserKey) {
    return {
      openai: new OpenAI({
        apiKey: user.settings.userApiKey,
        baseURL: user.settings.userBaseUrl || 'https://api.openai.com/v1',
      }),
      model: user.settings.preferredModel || systemSettings.defaultModel || 'gpt-4o',
      isUserKey: true,
      language: user.settings.defaultLanguage || 'French',
      tone: user.settings.defaultTone || 'Professional'
    };
  }

  // 2. Otherwise, fall back to global settings or environment variables
  const globalKey = systemSettings.openaiApiKey || process.env.OPENAI_API_KEY;
  if (!globalKey || globalKey.trim() === '') {
    throw new Error('OpenAI API Key is not configured by the administrator. Please update settings or provide your own API Key.');
  }

  return {
    openai: new OpenAI({
      apiKey: globalKey,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    }),
    model: systemSettings.defaultModel || 'gpt-4o',
    isUserKey: false,
    language: 'French',
    tone: 'Professional'
  };
};
