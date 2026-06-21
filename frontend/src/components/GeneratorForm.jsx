import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, ArrowRight, CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const STEPS = [
  { label: 'Analyzing keyword',       duration: 4000  },
  { label: 'Writing article content', duration: 18000 },
  { label: 'Generating SEO keywords', duration: 10000 },
  { label: 'Saving article',          duration: 4000  },
];

const TIPS = [
  'Long-tail keywords convert 3× better than generic ones.',
  'Aim for 1,500–2,500 words for top Google rankings.',
  'A compelling meta description boosts your click-through rate.',
  'Use H2/H3 headings to structure content for featured snippets.',
  'Internal links keep readers on your site longer.',
  'Fresh content updated regularly ranks higher.',
];

function LoadingSteps() {
  const [step, setStep]     = useState(0);
  const [tipIdx, setTipIdx] = useState(0);
  const timers = useRef([]);

  useEffect(() => {
    let elapsed = 0;
    STEPS.forEach((s, i) => {
      const t = setTimeout(() => setStep(i + 1), elapsed + s.duration);
      timers.current.push(t);
      elapsed += s.duration;
    });
    const tipTimer = setInterval(() => setTipIdx(p => (p + 1) % TIPS.length), 5000);
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
          animate={{ width: `${Math.min(96, (step / STEPS.length) * 100 + 4)}%` }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
      </div>

      {/* Steps — 2 cols on mobile, 4 on sm+ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        {STEPS.map((s, i) => {
          const done   = step > i;
          const active = step === i;
          return (
            <div key={i} className={`flex items-center gap-2 p-2.5 sm:p-3 rounded-xl border text-[11px] sm:text-xs font-bold transition-all duration-300 ${
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
              <span className="leading-tight">{s.label}</span>
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
          💡 {TIPS[tipIdx]}
        </motion.p>
      </AnimatePresence>
    </motion.div>
  );
}

export default function GeneratorForm({ onSubmit, isLoading, streamStep, stepLabel }) {
  const [keyword, setKeyword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (keyword.trim()) onSubmit(keyword.trim());
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
            placeholder="What topic to write about? e.g. 'Sustainable Fashion Trends'"
            className="w-full pl-12 sm:pl-16 pr-4 sm:pr-48 py-4 sm:py-6 bg-gray-50 border border-gray-100 rounded-2xl sm:rounded-[2rem] text-sm sm:text-lg font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white transition-all shadow-inner"
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
                  <span>Generate</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

          {/* Character count — below input on mobile */}
          <div className="absolute bottom-[-20px] right-2 sm:right-4 text-[10px] font-bold text-gray-400">
            {keyword.length}/100
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
              <span>Generate Article</span>
            </>
          )}
        </button>
      </form>

      {/* Badges */}
      <div className="flex items-center justify-center gap-4 sm:gap-6 mt-8">
        {['High Accuracy', 'SEO Optimized', 'Plagiarism Free'].map((label) => (
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
                <span className="text-sm font-semibold text-gray-500">{stepLabel || 'Working…'}</span>
              </motion.div>
            )
            : <LoadingSteps key="steps" />
        )}
      </AnimatePresence>
    </div>
  );
}
