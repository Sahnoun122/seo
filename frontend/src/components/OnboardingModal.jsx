import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Zap, ImageIcon, CreditCard, Globe, CheckCircle2 } from 'lucide-react';

const STORAGE_KEY = 'seo_gen_ai_onboarded';

const STEPS = [
  {
    icon: Zap,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    title: 'Generate articles in seconds',
    body: 'Enter any keyword and let the AI write a complete, SEO-optimized article for you — title, meta description, structured content, and keyword suggestions included.',
    tip: 'Try starting with a long-tail keyword like "best CRM for small business 2025".',
  },
  {
    icon: ImageIcon,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10',
    title: 'Beautiful cover images',
    body: 'Add a professional cover image to your articles with one click. You can upload your own, generate one with DALL-E 3 AI, or pick a free photo from Unsplash.',
    tip: 'DALL-E 3 cover generation uses 1 extra credit per image.',
  },
  {
    icon: Globe,
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10',
    title: 'Publish directly to WordPress',
    body: 'Connect your WordPress site in Settings → Content Preferences. Once connected, publish any article as a draft with one click — featured image included.',
    tip: 'Use an Application Password (not your login password) for security.',
  },
  {
    icon: CreditCard,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    title: 'Credits & unlimited mode',
    body: 'Each article generation uses 1 credit. Want unlimited generations? Add your own OpenAI API key in Settings → AI Model — your personal key bypasses the credit system entirely.',
    tip: 'You can top up credits anytime from the Buy Credits page.',
  },
  {
    icon: CheckCircle2,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    title: "You're all set!",
    body: "That's everything you need to start generating high-quality SEO content. Head to the Dashboard and write your first article — it only takes seconds.",
    tip: null,
  },
];

export function shouldShowOnboarding() {
  return !localStorage.getItem(STORAGE_KEY);
}

export function markOnboardingDone() {
  localStorage.setItem(STORAGE_KEY, '1');
}

export default function OnboardingModal({ onClose }) {
  const [step, setStep] = useState(0);

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

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
            aria-label="Skip tutorial"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="px-8 pb-6 pt-2 text-center">
          {/* Icon */}
          <div className={`inline-flex items-center justify-center w-16 h-16 rounded-2xl ${current.bg} mb-5`}>
            <Icon className={`w-8 h-8 ${current.color}`} />
          </div>

          {/* Step counter */}
          <p className="text-xs text-gray-500 font-semibold tracking-widest uppercase mb-2">
            Step {step + 1} of {STEPS.length}
          </p>

          <h2 className="text-xl font-bold text-white mb-3 leading-snug">
            {current.title}
          </h2>

          <p className="text-gray-400 text-sm leading-relaxed mb-4">
            {current.body}
          </p>

          {current.tip && (
            <div className="bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-xs text-gray-400 text-left">
              <span className="text-violet-400 font-semibold">Tip: </span>
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
            Back
          </button>

          {isLast ? (
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              <CheckCircle2 className="w-4 h-4" />
              Get started
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-2 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-xl transition-colors"
            >
              Next
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
