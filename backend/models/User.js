import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
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
      minlength: 6,
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
    toJSON: { getters: true },
    toObject: { getters: true },
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

const User = mongoose.model('User', userSchema);

export default User;
