import mongoose from 'mongoose';
import { encrypt, decrypt } from '../utils/encryption.js';

const settingsSchema = new mongoose.Schema(
  {
    openaiApiKey: {
      type: String,
      default: '',
      get: (val) => decrypt(val),
      set: (val) => (val ? encrypt(val) : val),
    },
    defaultModel: {
      type: String,
      default: 'gpt-4o',
    },
    allowUserKeys: {
      type: Boolean,
      default: true,
    },
    defaultUserCredits: {
      type: Number,
      default: 10,
    },
  },
  {
    timestamps: true,
    toJSON:   { getters: true },
    toObject: { getters: true },
  }
);

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
