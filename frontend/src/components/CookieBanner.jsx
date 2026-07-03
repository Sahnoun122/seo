import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Cookie, X, CheckCircle2 } from 'lucide-react';

const CONSENT_KEY = 'seo_gen_ai_cookie_consent';

export default function CookieBanner() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem(CONSENT_KEY);
    if (!consent) {
      // Small delay so the banner doesn't flash on first paint
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    setVisible(false);
  };

  const decline = () => {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label={t('cookieBanner.ariaLabel')}
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:bottom-6 sm:max-w-sm z-50 animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-start gap-3 mb-4">
          <div className="bg-amber-100 dark:bg-amber-900/40 p-1.5 rounded-lg shrink-0 mt-0.5">
            <Cookie className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900 dark:text-white mb-1">{t('cookieBanner.title')}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
              {t('cookieBanner.bodyBefore')}{' '}
              <Link to="/privacy" className="text-primary-600 hover:underline font-medium" onClick={decline}>
                {t('landing.footer.privacy')}
              </Link>{' '}
              {t('cookieBanner.bodyAfter')}
            </p>
          </div>
          <button
            onClick={decline}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors shrink-0"
            aria-label={t('common.dismiss')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex gap-2">
          <button
            onClick={decline}
            className="flex-1 py-2 px-3 text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {t('cookieBanner.essentialOnly')}
          </button>
          <button
            onClick={accept}
            className="flex-1 py-2 px-3 text-xs font-bold text-white bg-primary-600 rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {t('cookieBanner.acceptAll')}
          </button>
        </div>
      </div>
    </div>
  );
}
