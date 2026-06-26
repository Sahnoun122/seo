import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, ArrowRight, CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';

const STEP_DURATIONS = [4000, 18000, 10000, 4000];
const STEP_KEYS = ['meta', 'content', 'keywords', 'saving'];
const TIP_COUNT = 6;

function LoadingSteps() {
  const { t } = useTranslation();
  const [step, setStep]     = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const timers = useRef([]);

  useEffect(() => {
    let elapsed = 0;
    STEP_DURATIONS.forEach((duration, i) => {
      const timer = setTimeout(() => setStep(i + 1), elapsed + duration);
      timers.current.push(timer);
      elapsed += duration;
    });
    const tipTimer = setInterval(() => setTipIdx(p => (p + 1) % TIP_COUNT), 5000);
    timers.current.push(tipTimer);
    return () => timers.current.forEach(clearTimeout);
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mt-8 space-y-6"
    >
      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-primary-500 to-violet-500 rounded-full"
          initial={{ width: '4%' }}
          animate={{ width: `${Math.min(96, (step / STEP_KEYS.length) * 100 + 4)}%` }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
      </div>

      {/* Steps — 2 cols on mobile, 4 on sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {STEP_KEYS.map((key, i) => {
          const done   = step > i;
          const active = step === i;
          return (
            <div key={key} className={`flex items-center gap-2 p-2.5 sm:p-3 rounded-xl border text-[11px] sm:text-xs font-bold transition-all duration-300 ${
              done   ? 'border-emerald-200 bg-emerald-50 text-emerald-700' :
              active ? 'border-primary-200 bg-primary-50 text-primary-700' :
                       'border-gray-100 bg-gray-50 text-gray-400'
            }`}>
              {done ? (
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-emerald-500" />
              ) : active ? (
                <Loader2 className="w-3.5 h-3.5 shrink-0 animate-spin text-primary-500" />
              ) : (
                <Circle className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="leading-tight">{t(`generator.steps.${key}`)}</span>
            </div>
          );
        })}
      </div>

      {/* Rotating tip */}
      <AnimatePresence mode="wait">
        <motion.p
          key={tipIdx}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.4 }}
          className="text-center text-[11px] font-semibold text-gray-400 italic px-4"
        >
          💡 {t(`generator.tips.${tipIdx + 1}`)}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}

export default function GeneratorForm({ onSubmit, isLoading, streamStep, stepLabel }) {
  const { t } = useTranslation();
  const [keyword, setKeyword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (keyword.trim()) onSubmit(keyword.trim());
  };

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && keyword.trim() && !isLoading) {
      e.preventDefault();
      onSubmit(keyword.trim());
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 sm:py-10">
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Input */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-4 sm:left-6 flex items-center pointer-events-none">
            <Search className="w-5 h-5 sm:w-6 sm:h-6 text-gray-300 group-focus-within:text-primary-500 transition-colors" />
          </div>
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value.slice(0, 100))}
            onKeyDown={handleKeyDown}
            placeholder={t('generator.placeholder')}
            className="w-full pl-12 sm:pl-16 pr-4 sm:pr-48 py-4 sm:py-6 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl sm:rounded-[2rem] text-sm sm:text-lg font-medium text-gray-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white dark:focus:bg-gray-800 transition-all shadow-inner"
            disabled={isLoading}
            required
          />

          {/* Desktop inline button */}
          <div className="hidden sm:flex absolute inset-y-2 right-2 items-center">
            <button
              type="submit"
              disabled={isLoading || !keyword.trim()}
              className="h-full px-8 bg-gray-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-primary-600 transition-all active:scale-95 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <span>{t('generator.submit')}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Character count + keyboard hint */}
          <div className="absolute bottom-[-1.5rem] right-2 sm:right-4 flex items-center gap-3">
            {keyword.trim() && !isLoading && (
              <span className="hidden sm:inline text-[10px] font-bold text-gray-300">
                {t('generator.hint')}
              </span>
            )}
            <span className="text-[10px] font-bold text-gray-400">{keyword.length}/100</span>
          </div>
        </div>

        {/* Mobile full-width button */}
        <button
          type="submit"
          disabled={isLoading || !keyword.trim()}
          className="sm:hidden w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-primary-600 transition-all active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl mt-6"
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>{t('generator.generateArticle')}</span>
            </>
          )}
        </button>
      </form>

      {/* Badges */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 mt-8">
        {[t('generator.badges.accuracy'), t('generator.badges.seo'), t('generator.badges.plagiarism')].map((label) => (
          <p key={label} className="text-[9px] sm:text-[10px] font-black text-gray-300 uppercase tracking-[0.15em] sm:tracking-[0.2em] flex items-center gap-1.5">
            <span className="w-1 h-1 bg-gray-300 rounded-full" />
            {label}
          </p>
        ))}
      </div>

      <AnimatePresence>
        {isLoading && (
          streamStep
            ? (
              <motion.div
                key="stream-status"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-6 flex items-center justify-center gap-3"
              >
                <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                <span className="text-sm font-semibold text-gray-500">{stepLabel || t('generator.working')}</span>
              </motion.div>
            )
            : <LoadingSteps key="steps" />
        )}
      </AnimatePresence>
    </div>
  );
}
