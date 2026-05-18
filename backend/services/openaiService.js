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

/**
 * Essaye d'abord un JSON.parse direct, et en cas d'échec, extrait la portion JSON
 * valide entre { et } tout en nettoyant les balises de code markdown parasites.
 * 
 * @param {string} rawString - Chaîne brute retournée par l'IA
 * @returns {Object} Objet JSON parsé
 */
export const cleanAndParseJSON = (rawString) => {
  if (!rawString || typeof rawString !== 'string') {
    throw new Error("Le texte retourné par l'IA est vide ou invalide.");
  }

  // 1. Essai de parsing direct
  try {
    return JSON.parse(rawString.trim());
  } catch (directError) {
    console.warn("Le parsing JSON direct a échoué. Tentative d'extraction de la structure JSON...", directError.message);

    // 2. Recherche des délimiteurs JSON
    const start = rawString.indexOf('{');
    const end = rawString.lastIndexOf('}');

    if (start === -1 || end === -1 || end < start) {
      throw new Error("Aucun objet JSON valide n'a été trouvé dans la réponse de l'IA.");
    }

    let jsonString = rawString.substring(start, end + 1).trim();

    // Élimination des éventuels reliquats de balises markdown parasites
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.substring(7);
    }
    if (jsonString.startsWith('```')) {
      jsonString = jsonString.substring(3);
    }
    if (jsonString.endsWith('```')) {
      jsonString = jsonString.substring(0, jsonString.length - 3);
    }

    jsonString = jsonString.trim();

    try {
      return JSON.parse(jsonString);
    } catch (extractionError) {
      console.error("Échec du parsing après extraction. Chaîne extraite :", jsonString);
      throw new Error(`Structure JSON invalide générée par l'IA : ${extractionError.message}`);
    }
  }
};

/**
 * Intercepte les erreurs de l'API OpenAI (quotas dépassés, clés invalides, serveurs en panne, etc.)
 * et lève une erreur descriptive, structurée et compréhensible en français.
 * 
 * @param {Error} error - L'erreur d'origine retournée par le SDK OpenAI
 */
export const handleOpenAIError = (error) => {
  console.error("OpenAI API Exception Details:", error);

  const status = error.status || (error.response && error.response.status);
  const code = error.code || (error.response && error.response.data && error.response.data.error && error.response.data.error.code);
  const message = error.message || '';

  if (status === 401 || message.includes('401') || message.includes('Incorrect API key') || code === 'invalid_api_key') {
    throw new Error("La clé API OpenAI configurée est invalide ou expirée. Veuillez vérifier votre configuration dans les Réglages.");
  }
  
  if (status === 429 || message.includes('429') || message.includes('insufficient_quota') || message.includes('quota') || code === 'insufficient_quota') {
    throw new Error("Le quota ou le solde de crédits de votre compte OpenAI est dépassé. Veuillez recharger votre compte ou vérifier vos facturations.");
  }

  if (status === 400 && message.includes('model_not_found')) {
    throw new Error("Le modèle d'IA spécifié n'est pas disponible avec cette clé API. Veuillez choisir un modèle compatible.");
  }

  if (status >= 500) {
    throw new Error("Les serveurs d'OpenAI rencontrent actuellement des difficultés techniques. Veuillez réessayer dans quelques instants.");
  }

  // Erreur par défaut
  throw new Error(`Une erreur technique est survenue avec l'IA OpenAI : ${message || 'Impossible de communiquer avec le service.'}`);
};
