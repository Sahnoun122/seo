import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    openaiApiKey: {
      type: String,
      default: '',
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
  }
);

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
