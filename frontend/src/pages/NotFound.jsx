import { Link } from 'react-router-dom';
import { FileSearch, ArrowLeft, Home, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute top-[20%] left-[10%] w-72 h-72 orb orb-purple animate-glow opacity-30" />
      <div className="absolute bottom-[15%] right-[15%] w-56 h-56 orb orb-pink opacity-20" />
      <div className="absolute inset-0 bg-dots opacity-[0.03]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-8 max-w-lg relative z-10"
      >
        {/* Icon */}
        <div className="relative inline-flex">
          <div className="relative">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-32 h-32 bg-white dark:bg-gray-900 rounded-3xl flex items-center justify-center shadow-premium mx-auto border border-gray-100 dark:border-gray-800"
            >
              <FileSearch className="w-14 h-14 text-primary-500" />
            </motion.div>
            <div className="absolute -bottom-2 inset-x-4 h-4 bg-primary-500/10 blur-xl rounded-full" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-4">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold text-xs border border-primary-100 dark:border-primary-800/50">
            <Sparkles className="w-3.5 h-3.5" />
            404 — {t('errors.notFound')}
          </span>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            {t('errors.notFound')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg leading-relaxed max-w-md mx-auto">
            {t('errors.notFoundSubtitle')}
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="btn-primary inline-flex gap-2 px-6 py-3.5 text-sm"
          >
            <Home className="w-4 h-4" />
            {t('errors.goHome')}
          </Link>
          <Link
            to="/welcome"
            className="btn-secondary inline-flex gap-2 px-6 py-3 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {t('landing.nav.getStarted')}
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
