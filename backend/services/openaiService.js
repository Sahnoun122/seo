import OpenAI from 'openai';
import { getSystemSettings } from './settingsService.js';
import logger from '../utils/logger.js';

const debug = (...args) => logger.debug(...args);

// Free/shared models on providers like OpenRouter get throttled with transient 429s.
// The SDK already retries 429/5xx with backoff (honoring Retry-After).
const MAX_RETRIES = 2;

// OpenRouter's ":free" models are shared across all their users and get rate-limited
// independently of each other. If the configured free model is throttled even after the
// SDK's own retries, spreading the request across a few other free models (different
// underlying providers) gives a real shot at completing the request instead of failing.
const FREE_MODEL_FALLBACKS = [
  'google/gemma-4-31b-it:free',
  'meta-llama/llama-3.3-70b-instruct:free',
  'qwen/qwen3-next-80b-a3b-instruct:free',
  'openai/gpt-oss-120b:free',
  'nvidia/nemotron-3-super-120b-a12b:free',
];

const isRetryableStatus = (error) => {
  const status = error?.status || error?.response?.status;
  // No status at all means the request never got a response — a stalled/hung
  // connection (APIConnectionTimeoutError) or network failure. That's exactly
  // the case where moving on to the next fallback model is the right call.
  if (status === undefined) return true;
  return status === 429 || status >= 500;
};

/**
 * Runs a chat completion (streaming or not — pass `stream: true` in params) and,
 * if the configured model is a free OpenRouter model that's currently rate-limited,
 * erroring, or silently stalled, retries the same request against other free models
 * before giving up. Returns { completion, modelUsed } — for streaming requests
 * `completion` is the stream.
 *
 * `timeoutMs` bounds each individual attempt. Without it, a provider that stalls
 * instead of erroring would hang on the SDK's ~10 minute default, and the whole
 * generation would just sit there forever with no error ever shown to the user.
 */
export const chatCompletionWithFallback = async (openai, model, params, { timeoutMs } = {}) => {
  const candidates = model.endsWith(':free')
    ? [model, ...FREE_MODEL_FALLBACKS.filter((m) => m !== model)]
    : [model];

  // When there's a chain of fallback models to try, keep each one's own retry
  // budget small (moving to the next model beats waiting out a bigger backoff
  // on one that's already rate-limited) — otherwise the whole chain can take
  // minutes. With a single candidate (paid model, no fallback) allow more.
  const perCallRetries = candidates.length > 1 ? 1 : MAX_RETRIES;

  let lastError;
  for (const candidate of candidates) {
    try {
      const completion = await openai.chat.completions.create(
        { ...params, model: candidate },
        { maxRetries: perCallRetries, ...(timeoutMs ? { timeout: timeoutMs } : {}) }
      );
      // OpenRouter proxies many underlying providers — an occasional flaky one
      // returns HTTP 200 with no actual choices. Treat that the same as an error
      // so we move on to the next fallback model instead of crashing later on
      // `.choices[0]`.
      if (!completion?.choices?.[0]) {
        throw Object.assign(new Error(`Model ${candidate} returned an empty/malformed response.`), { status: undefined });
      }
      return { completion, modelUsed: candidate };
    } catch (error) {
      lastError = error;
      if (!isRetryableStatus(error)) throw error;
      logger.warn(`[OpenAI] Model ${candidate} unavailable (status ${error.status || error?.response?.status || 'timeout/network'}), trying next fallback model...`);
    }
  }
  throw lastError;
};

/**
 * Streams a chat completion with the same free-model fallback chain as
 * chatCompletionWithFallback, plus an idle-timeout watchdog.
 *
 * The `timeout` option on the OpenAI client only bounds the wait for the initial
 * response headers — once a model starts streaming, the SDK's timer is cleared,
 * so a provider that stops sending chunks mid-generation (no error, just silence)
 * would otherwise hang until Node's socket-level timeout, potentially forever from
 * the user's perspective. This watchdog re-arms on every chunk and aborts the
 * candidate if none arrives within `timeoutMs`.
 *
 * If a candidate fails (or stalls) before yielding any content, it's safe to move
 * to the next fallback model. If it fails after some content was already streamed
 * to the caller via `onDelta`, we cannot safely retry from scratch (would duplicate
 * or contradict what the user already sees), so the error is thrown as-is.
 *
 * Returns { fullContent, modelUsed }.
 */
export const streamCompletionWithFallback = async (openai, model, params, { timeoutMs, onDelta }) => {
  const candidates = model.endsWith(':free')
    ? [model, ...FREE_MODEL_FALLBACKS.filter((m) => m !== model)]
    : [model];
  const perCallRetries = candidates.length > 1 ? 1 : MAX_RETRIES;

  let lastError;
  for (const candidate of candidates) {
    let fullContent = '';
    try {
      const stream = await openai.chat.completions.create(
        { ...params, model: candidate, stream: true },
        { maxRetries: perCallRetries, timeout: timeoutMs }
      );

      const iterator = stream[Symbol.asyncIterator]();
      while (true) {
        const stalled = Symbol('stalled');
        const nextChunk = await Promise.race([
          iterator.next(),
          new Promise((resolve) => setTimeout(() => resolve(stalled), timeoutMs)),
        ]);
        if (nextChunk === stalled) {
          throw new Error(`Model ${candidate} stopped responding (no data for ${timeoutMs / 1000}s).`);
        }
        if (nextChunk.done) break;
        const delta = nextChunk.value.choices?.[0]?.delta?.content || '';
        if (delta) {
          fullContent += delta;
          onDelta(delta);
        }
      }
      return { fullContent, modelUsed: candidate };
    } catch (error) {
      lastError = error;
      if (fullContent) throw error;
      if (!isRetryableStatus(error)) throw error;
      logger.warn(`[OpenAI] Model ${candidate} stalled/unavailable while streaming, trying next fallback model...`);
    }
  }
  throw lastError;
};

/**
 * Resolves the correct OpenAI client and model for a request.
 * Uses the user's personal API key if configured and globally allowed.
 * Falls back to system settings or environment variables otherwise.
 */
export const getOpenAIClientAndModel = async (user) => {
  const systemSettings = await getSystemSettings();

  const hasUserKey = user?.settings?.userApiKey && user.settings.userApiKey.trim() !== '';
  const canUseUserKey = systemSettings.allowUserKeys;

  debug('[OpenAI] User Has Key:', hasUserKey, '| Allows User Key:', canUseUserKey);

  if (hasUserKey && canUseUserKey) {
    debug('[OpenAI] Resolved Key Source: USER_SETTINGS_KEY');
    return {
      openai: new OpenAI({
        apiKey: user.settings.userApiKey,
        baseURL: user.settings.userBaseUrl || 'https://api.openai.com/v1',
        maxRetries: MAX_RETRIES,
      }),
      model: user.settings.preferredModel || systemSettings.defaultModel || 'gpt-4o',
      isUserKey: true,
      language: user.settings.defaultLanguage || 'French',
      tone: user.settings.defaultTone || 'Professional',
    };
  }

  const globalKey = systemSettings.openaiApiKey || process.env.OPENAI_API_KEY;
  debug('[OpenAI] Resolved Key Source:', systemSettings.openaiApiKey ? 'DB_SYSTEM_KEY' : 'ENV_PROCESS_KEY');

  if (!globalKey || globalKey.trim() === '') {
    throw new Error('OpenAI API Key is not configured by the administrator. Please update settings or provide your own API Key.');
  }

  const baseURL = systemSettings.openaiBaseUrl || process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model   = systemSettings.defaultModel   || process.env.OPENAI_MODEL   || 'gpt-4o';
  debug('[OpenAI] Resolved BaseURL:', baseURL, '| Model:', model);

  return {
    openai: new OpenAI({ apiKey: globalKey, baseURL, maxRetries: MAX_RETRIES }),
    model,
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
    logger.warn("Direct JSON parse failed. Attempting extraction...", directError.message);

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
      logger.error("JSON parse failed after extraction. Extracted string:", jsonString);
      throw new Error(`Invalid JSON structure returned by AI: ${extractionError.message}`);
    }
  }
};

/**
 * Intercepts OpenAI API errors (quota exceeded, invalid keys, server issues, etc.)
 * and throws a descriptive, user-facing error message.
 */
export const handleOpenAIError = (error) => {
  // Log only safe, non-sensitive fields — the raw error object can carry the
  // outbound request (including the Authorization header) in some SDK versions.
  logger.error("OpenAI API Exception:", {
    message: error?.message,
    status: error?.status || error?.response?.status,
    code: error?.code || error?.response?.data?.error?.code,
  });

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
