export const requireEmailVerified = (req, res, next) => {
  if (req.user && !req.user.isEmailVerified) {
    return res.status(403).json({
      error: 'Please verify your email address before generating content.',
      code: 'EMAIL_NOT_VERIFIED',
    });
  }
  next();
};
