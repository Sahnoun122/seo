import Settings from '../models/Settings.js';

/**
 * Get system settings. If they do not exist, initialize them with default values.
 * @returns {Promise<Document>} The Mongoose settings document
 */
export const getSystemSettings = async () => {
  try {
    let settings = await Settings.findOne({});
    if (!settings) {
      settings = await Settings.create({
        openaiApiKey: process.env.OPENAI_API_KEY || '',
        defaultModel: process.env.OPENAI_MODEL || 'gpt-4o',
        allowUserKeys: true,
        defaultUserCredits: 10,
      });
      console.log('System settings initialized with defaults.');
    }
    return settings;
  } catch (error) {
    console.error('Error fetching system settings:', error);
    // Return a default in-memory object if database fails during startup
    return {
      openaiApiKey: process.env.OPENAI_API_KEY || '',
      defaultModel: process.env.OPENAI_MODEL || 'gpt-4o',
      allowUserKeys: true,
      defaultUserCredits: 10,
    };
  }
};
