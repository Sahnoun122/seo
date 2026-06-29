import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Zap, ImageIcon, CreditCard, Globe, CheckCircle2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const STORAGE_KEY = 'seo_gen_ai_onboarded';

const STEP_ICONS = [Zap, ImageIcon, Globe, CreditCard, CheckCircle2];
const STEP_COLORS = [
  { color: 'text-violet-400', bg: 'bg-violet-500/10' },
  { color: 'text-blue-400', bg: 'bg-blue-500/10' },
  { color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  { color: 'text-amber-400', bg: 'bg-amber-500/10' },
  { color: 'text-violet-400', bg: 'bg-violet-500/10' },
];

export function shouldShowOnboarding() {
  return !localStorage.getItem(STORAGE_KEY);
}

export function markOnboardingDone() {
  localStorage.setItem(STORAGE_KEY, '1');
}

export default function OnboardingModal({ onClose }) {
  const { t } = useTranslation();
  const [step, setStep] = useState(0);

  const STEPS = [
    {
      title: t('onboarding.step1.title'),
      body: t('onboarding.step1.body'),
      tip: t('onboarding.step1.tip'),
    },
    {
      title: t('onboarding.step2.title'),
      body: t('onboarding.step2.body'),
      tip: t('onboarding.step2.tip'),
    },
    {
      title: t('onboarding.step3.title'),
      body: t('onboarding.step3.body'),
      tip: t('onboarding.step3.tip'),
    },
    {
      title: t('onboarding.step4.title'),
      body: t('onboarding.step4.body'),
      tip: t('onboarding.step4.tip'),
    },
    {
      title: t('onboarding.step5.title'),
      body: t('onboarding.step5.body'),
      tip: null,
    },
  ];

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = STEP_ICONS[step];
  const colors = STEP_COLORS[step];

  const handleFinish = () => {
    markOnboardingDone();
    onClose();
  };

  const handleSkip = () => {
    markOnboardingDone();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-gray-800">
          <div
            className="h-full bg-violet-500 transition-all duration-300"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Close */}
        <div className="flex justify-end px-4 pt-4">
          <button
            onClick={handleSkip}
            className="text-gray-500 hover:text-gray-300 transition-colors rounded-lg p-1.5 hover:bg-gray-800"
            aria-label={t('onboarding.skip')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 pb-6 pt-2 text-center">
          {/* Icon */}
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${colors.bg} mb-5`}>
            <Icon className={`w-8 h-8 ${colors.color}`} />
          </div>

          {/* Step counter */}
          <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-2">
            {t('onboarding.stepCounter', { current: step + 1, total: STEPS.length })}
          </p>

          <h2 className="text-xl font-bold text-white mb-3 leading-snug">
            {current.title}
          </h2>

          <p className="text-gray-400 text-sm leading-relaxed mb-4">
            {current.body}
          </p>

          {current.tip && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-xs text-gray-400 text-left">
              <span className="text-violet-400 font-semibold">{t('onboarding.tipLabel')} </span>
              {current.tip}
            </div>
          )}
        </div>

        {/* Dots */}
        <div className="flex justify-center gap-1.5 pb-4">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? 'w-6 bg-violet-500' : 'w-1.5 bg-gray-700 hover:bg-gray-600'
              }`}
            />
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between px-6 pb-6 gap-3">
          <button
            onClick={() => setStep((s) => Math.max(0, s - 1))}
            disabled={step === 0}
            className="flex items-center gap-1.5 px-4 py-2 text-sm text-gray-400 hover:text-white disabled:opacity-0 disabled:cursor-default transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            {t('common.back')}
          </button>

          {isLast ? (
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              {t('onboarding.getStarted')}
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              {t('common.next')}
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
