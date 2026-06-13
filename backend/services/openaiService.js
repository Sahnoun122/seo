import OpenAI from 'openai';
import { getSystemSettings } from './settingsService.js';

/**
 * Resolves the correct OpenAI client and model for a request.
 * Uses the user's personal API key if configured and globally allowed.
 * Falls back to system settings or environment variables otherwise.
 */
export const getOpenAIClientAndModel = async (user) => {
  const systemSettings = await getSystemSettings();

  const hasUserKey = user?.settings?.userApiKey && user.settings.userApiKey.trim() !== '';
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
      tone: user.settings.defaultTone || 'Professional',
    };
  }

  const globalKey = systemSettings.openaiApiKey || process.env.OPENAI_API_KEY;
  if (!globalKey || globalKey.trim() === '') {
    throw new Error('OpenAI API Key is not configured by the administrator. Please update settings or provide your own API Key.');
  }

  return {
    openai: new OpenAI({
      apiKey: globalKey,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    }),
    model: systemSettings.defaultModel || process.env.OPENAI_MODEL || 'gpt-4o',
    isUserKey: false,
    language: user?.settings?.defaultLanguage || 'French',
    tone: user?.settings?.defaultTone || 'Professional',
  };
};

/**
 * Attempts a direct JSON.parse first. On failure, extracts the JSON object
 * from the raw string and strips any stray markdown code fences.
 */
export const cleanAndParseJSON = (rawString) => {
  if (!rawString || typeof rawString !== 'string') {
    throw new Error("The text returned by the AI is empty or invalid.");
  }

  try {
    return JSON.parse(rawString.trim());
  } catch (directError) {
    console.warn("Direct JSON parse failed. Attempting extraction...", directError.message);

    const start = rawString.indexOf('{');
    const end = rawString.lastIndexOf('}');

    if (start === -1 || end === -1 || end < start) {
      throw new Error("No valid JSON object found in the AI response.");
    }

    let jsonString = rawString.substring(start, end + 1).trim();

    if (jsonString.startsWith('```json')) jsonString = jsonString.substring(7);
    if (jsonString.startsWith('```')) jsonString = jsonString.substring(3);
    if (jsonString.endsWith('```')) jsonString = jsonString.substring(0, jsonString.length - 3);

    jsonString = jsonString.trim();

    try {
      return JSON.parse(jsonString);
    } catch (extractionError) {
      console.error("JSON parse failed after extraction. Extracted string:", jsonString);
      throw new Error(`Invalid JSON structure returned by AI: ${extractionError.message}`);
    }
  }
};

/**
 * Intercepts OpenAI API errors (quota exceeded, invalid keys, server issues, etc.)
 * and throws a descriptive, user-facing error message.
 */
export const handleOpenAIError = (error) => {
  console.error("OpenAI API Exception:", error);

  const status = error.status || (error.response && error.response.status);
  const code = error.code || (error.response?.data?.error?.code);
  const message = error.message || '';

  if (status === 401 || message.includes('401') || message.includes('Incorrect API key') || code === 'invalid_api_key') {
    throw new Error("The configured OpenAI API key is invalid or expired. Please check your settings.");
  }

  if (status === 429 || message.includes('429') || message.includes('insufficient_quota') || message.includes('quota') || code === 'insufficient_quota') {
    throw new Error("Your OpenAI account quota or credit balance has been exceeded. Please top up your account or check your billing.");
  }

  if (status === 400 && message.includes('model_not_found')) {
    throw new Error("The specified AI model is not available with this API key. Please select a compatible model.");
  }

  if (status >= 500) {
    throw new Error("OpenAI servers are currently experiencing issues. Please try again in a few moments.");
  }

  throw new Error(`A technical error occurred with the OpenAI API: ${message || 'Unable to communicate with the service.'}`);
};
