import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, XCircle, Loader2, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function VerifyEmail() {
  const { token } = useParams();
  const { refreshUser } = useAuth();
  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verify = async () => {
      try {
        await api.get(`/auth/verify-email/${token}`);
        await refreshUser();
        setStatus('success');
      } catch (err) {
        setMessage(err.response?.data?.error || 'Verification failed. The link may have expired.');
        setStatus('error');
      }
    };
    verify();
  }, [token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-900 rounded-3xl shadow-xl border border-gray-100 dark:border-gray-800 p-10 max-w-md w-full text-center space-y-6"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5">
          <div className="bg-primary-600 p-2 rounded-xl">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-gray-900 dark:text-white">SEO Gen AI</span>
        </div>

        {/* State */}
        {status === 'loading' && (
          <div className="flex flex-col items-center gap-4 py-4">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
            <p className="text-gray-500 font-medium">Verifying your email address…</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">Email verified!</h2>
              <p className="text-gray-500 text-sm">Your account is now fully activated. You can start generating SEO articles.</p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white font-bold px-6 py-3 rounded-xl text-sm transition-colors shadow-lg shadow-primary-500/20"
            >
              Go to Dashboard
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4 py-2">
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/30 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">Verification failed</h2>
              <p className="text-gray-500 text-sm">{message}</p>
            </div>
            <Link
              to="/"
              className="inline-flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold px-6 py-3 rounded-xl text-sm transition-colors"
            >
              Back to App
            </Link>
          </div>
        )}
      </motion.div>
    </div>
  );
}
