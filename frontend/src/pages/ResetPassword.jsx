import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Lock, ArrowLeft, Sparkles, Loader2, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';

function getStrength(password) {
  let score = 0;
  if (password.length >= 8)  score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;
  return score; // 0–5
}

const STRENGTH_CONFIG = [
  { label: 'Too short',  color: 'bg-red-400',    text: 'text-red-500'    },
  { label: 'Weak',       color: 'bg-red-400',    text: 'text-red-500'    },
  { label: 'Fair',       color: 'bg-amber-400',  text: 'text-amber-500'  },
  { label: 'Good',       color: 'bg-blue-400',   text: 'text-blue-500'   },
  { label: 'Strong',     color: 'bg-emerald-400',text: 'text-emerald-500'},
  { label: 'Very strong',color: 'bg-emerald-500',text: 'text-emerald-600'},
];

function PasswordStrengthBar({ password }) {
  const score = useMemo(() => getStrength(password), [password]);
  if (!password) return null;
  const config = STRENGTH_CONFIG[score];

  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i < score ? config.color : 'bg-gray-100 dark:bg-gray-800'
            }`}
          />
        ))}
      </div>
      <p className={`text-[11px] font-semibold ${config.text}`}>{config.label}</p>
    </div>
  );
}

export default function ResetPassword() {
  const { token }    = useParams();
  const navigate     = useNavigate();
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]     = useState(false);
  const [showConfirm, setShowConfirm]       = useState(false);
  const [isLoading, setIsLoading]           = useState(false);
  const [success, setSuccess]               = useState(false);

  const passwordsMatch = confirmPassword === '' || password === confirmPassword;
  const canSubmit = password.length >= 8 && password === confirmPassword && !isLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setSuccess(true);
      toast.success('Password updated!');
      setTimeout(() => navigate('/login'), 2800);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Link expired. Please request a new one.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <Link to="/login" className="inline-flex items-center gap-2.5 mb-8 group">
          <div className="bg-primary-600 p-2 rounded-xl group-hover:bg-primary-700 transition-colors">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">SEO Gen AI</span>
        </Link>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="premium-card p-8 text-center space-y-5"
            >
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto ring-4 ring-emerald-100 dark:ring-emerald-900/30">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
                  Password updated!
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Redirecting you to sign in…
                </p>
              </div>
              <div className="flex justify-center">
                <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-7">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
                  Set new password
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  Choose a strong password — at least 8 characters.
                </p>
              </div>

              <form className="space-y-5" onSubmit={handleSubmit}>
                {/* New password */}
                <div>
                  <label className="label-xs" htmlFor="new-password">New password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      id="new-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      autoFocus
                      className="input-field pl-10 pr-10"
                      placeholder="Min 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <PasswordStrengthBar password={password} />
                </div>

                {/* Confirm password */}
                <div>
                  <label className="label-xs" htmlFor="confirm-password">Confirm password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      id="confirm-password"
                      type={showConfirm ? 'text' : 'password'}
                      required
                      className={`input-field pl-10 pr-10 transition-colors ${
                        !passwordsMatch ? 'border-red-300 dark:border-red-700 focus:border-red-400' : ''
                      }`}
                      placeholder="Repeat password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowConfirm((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <AnimatePresence>
                    {!passwordsMatch && (
                      <motion.p
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-[11px] text-red-500 font-semibold mt-1.5"
                      >
                        Passwords do not match
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="btn-primary w-full py-3.5 text-sm"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>Update Password</span>
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
                <Link
                  to="/login"
                  className="text-primary-600 hover:text-primary-700 font-bold underline underline-offset-4 decoration-2 inline-flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to Sign In
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
