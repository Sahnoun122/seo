import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { toast } from 'react-hot-toast';
import { Mail, ArrowLeft, Sparkles, Loader2, CheckCircle2, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';
import ThemeToggle from '../components/ThemeToggle';

const RESEND_COOLDOWN = 60; // seconds

export default function ForgotPassword() {
  const { t } = useTranslation();
  const [email, setEmail]       = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent]         = useState(false);
  const [cooldown, setCooldown] = useState(0);

  // countdown timer after sending
  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [cooldown]);

  const submit = async (e) => {
    e?.preventDefault();
    if (!email.trim()) return;
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setSent(true);
      setCooldown(RESEND_COOLDOWN);
    } catch (err) {
      toast.error(err.response?.data?.error || t('auth.forgotPassword.sendError'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    setIsLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: email.trim() });
      setCooldown(RESEND_COOLDOWN);
      toast.success(t('auth.forgotPassword.resendSuccess'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('auth.forgotPassword.resendError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background relative">
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
        <ThemeToggle />
      </div>
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
          {sent ? (
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25 }}
              className="premium-card p-8 text-center space-y-6"
            >
              <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-900/20 rounded-full flex items-center justify-center mx-auto ring-4 ring-emerald-100 dark:ring-emerald-900/30">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {t('auth.forgotPassword.sent')}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                  {t('auth.forgotPassword.sentSubtitle', { email })}
                  <br />
                  {t('auth.forgotPassword.expiresIn')}
                </p>
              </div>

              {/* Resend section */}
              <div className="pt-2">
                <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">
                  {t('auth.forgotPassword.notReceived')}
                </p>
                <button
                  onClick={handleResend}
                  disabled={cooldown > 0 || isLoading}
                  className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {cooldown > 0 ? t('auth.forgotPassword.resendCooldown', { seconds: cooldown }) : t('auth.forgotPassword.resend')}
                </button>
              </div>

              <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  {t('auth.forgotPassword.backToLogin')}
                </Link>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="form"
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ duration: 0.25 }}
            >
              <div className="mb-7">
                <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
                  {t('auth.forgotPassword.title')}
                </h2>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {t('auth.forgotPassword.subtitle')}
                </p>
              </div>

              <form className="space-y-5" onSubmit={submit}>
                <div>
                  <label className="label-xs" htmlFor="reset-email">{t('auth.forgotPassword.email')}</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                    <input
                      id="reset-email"
                      type="email"
                      required
                      autoFocus
                      className="input-field pl-10"
                      placeholder="name@company.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="btn-primary w-full py-3.5 text-sm"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Mail className="w-4 h-4" />
                      <span>{t('auth.forgotPassword.submit')}</span>
                    </>
                  )}
                </button>
              </form>

              <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-8">
                {t('auth.forgotPassword.rememberPassword')}{' '}
                <Link
                  to="/login"
                  className="text-primary-600 hover:text-primary-700 font-bold underline underline-offset-4 decoration-2"
                >
                  {t('auth.login.submit')}
                </Link>
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
