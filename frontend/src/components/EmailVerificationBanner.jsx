import React, { useState } from 'react';
import { MailWarning, X, RefreshCw, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { resendVerificationEmail } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function EmailVerificationBanner() {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  if (!user || user.isEmailVerified || dismissed) return null;

  const handleResend = async () => {
    if (sending || sent) return;
    setSending(true);
    try {
      await resendVerificationEmail();
      setSent(true);
      toast.success('Verification email sent! Check your inbox.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send email.');
    } finally {
      setSending(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        className="relative z-50 bg-amber-50 border-b border-amber-200"
      >
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3">
          <MailWarning className="w-4 h-4 text-amber-600 shrink-0" />
          <p className="text-xs font-semibold text-amber-800 flex-1 leading-snug">
            Please verify your email address to unlock all features.
          </p>
          <button
            onClick={handleResend}
            disabled={sending || sent}
            className="flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 shrink-0"
          >
            {sent ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Sent!</span>
              </>
            ) : (
              <>
                <RefreshCw className={`w-3.5 h-3.5 ${sending ? 'animate-spin' : ''}`} />
                {sending ? 'Sending…' : 'Resend link'}
              </>
            )}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1 rounded-lg text-amber-400 hover:text-amber-700 hover:bg-amber-100 transition-colors shrink-0"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
