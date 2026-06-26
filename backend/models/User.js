import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { encrypt, decrypt } from '../utils/encryption.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
    },
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    credits: {
      type: Number,
      default: 10,
    },
    plan: {
      type: String,
      enum: ['free', 'starter', 'growth', 'pro'],
      default: 'free',
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      select: false,
    },
    emailVerificationExpires: {
      type: Date,
      select: false,
    },
    settings: {
      userApiKey: {
        type: String,
        default: '',
        get: (val) => decrypt(val),
        set: (val) => (val ? encrypt(val) : val),
      },
      userBaseUrl: { type: String, default: '' },
      preferredModel: { type: String, default: '' },
      defaultLanguage: { type: String, default: 'French' },
      defaultTone: { type: String, default: 'Professional' },
      wpUrl: { type: String, default: '' },
      wpUsername: { type: String, default: '' },
      wpApplicationPassword: {
        type: String,
        default: '',
        get: (val) => decrypt(val),
        set: (val) => (val ? encrypt(val) : val),
      },
    },
  },
  {
    timestamps: true,
    // getters: true only on toObject so internal code can decrypt — NOT on toJSON (HTTP responses)
    toObject: { getters: true },
    toJSON: {
      getters: false,
      transform: (_doc, ret) => {
        delete ret.password;
        delete ret.emailVerificationToken;
        delete ret.emailVerificationExpires;
        // Strip encrypted sensitive fields from all generic responses.
        // The settings controller explicitly calls toObject({ getters: true }) when it needs them.
        if (ret.settings) {
          delete ret.settings.userApiKey;
          delete ret.settings.wpApplicationPassword;
        }
        return ret;
      },
    },
  }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.createEmailVerificationToken = function () {
  const rawToken = crypto.randomBytes(32).toString('hex');
  this.emailVerificationToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  this.emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
  return rawToken;
};

const User = mongoose.model('User', userSchema);

export default User;
