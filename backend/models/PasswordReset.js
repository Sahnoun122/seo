import mongoose from 'mongoose';
import crypto from 'crypto';

const passwordResetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  token: {
    type: String,
    required: true,
    index: true,
  },
  expiresAt: {
    type: Date,
    required: true,
    default: () => new Date(Date.now() + 60 * 60 * 1000), // 1 hour
  },
  used: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

// Auto-expire old tokens (MongoDB TTL index)
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

/**
 * Generate a secure reset token and return the raw (unhashed) version.
 * The hashed version is stored in the database for safe comparison.
 */
passwordResetSchema.statics.createToken = async function (userId) {
  // Invalidate any existing tokens for this user
  await this.deleteMany({ user: userId });

  const rawToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');

  await this.create({
    user: userId,
    token: hashedToken,
  });

  return rawToken;
};

/**
 * Find a valid (not expired, not used) reset token.
 */
passwordResetSchema.statics.findValidToken = async function (rawToken) {
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  return this.findOne({
    token: hashedToken,
    used: false,
    expiresAt: { $gt: new Date() },
  });
};

const PasswordReset = mongoose.model('PasswordReset', passwordResetSchema);
export default PasswordReset;
