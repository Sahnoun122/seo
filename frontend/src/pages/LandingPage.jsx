import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Sparkles, Zap, Shield, Crown, CheckCircle2,
  FileText, Globe, ChevronDown, Star, Brain, Image, Link as LinkIcon,
  Languages, Download, Cpu, Users, BarChart3, Clock, Check, Minus,
} from 'lucide-react';
import LanguageSwitcher from '../components/LanguageSwitcher';
import ThemeToggle from '../components/ThemeToggle';
import { useTranslation } from 'react-i18next';

const fadeUp = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0 } };

const features = [
  {
    icon: Brain,
    title: 'Multi-Model AI Engine',
    desc: 'Switch between GPT-4o, DeepSeek, Groq, and OpenRouter. Always use the best model for each task.',
    color: 'text-primary-600 dark:text-primary-400',
    bg: 'bg-primary-50 dark:bg-primary-900/30',
  },
  {
    icon: FileText,
    title: 'SEO-Perfect Structure',
    desc: 'Every article ships with H1/H2/H3 hierarchy, optimal keyword density, and a semantic keyword cluster.',
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
  },
  {
    icon: Globe,
    title: '1-Click WordPress',
    desc: 'Push generated drafts with featured images directly to any WordPress site via the REST API.',
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-50 dark:bg-emerald-900/30',
  },
  {
    icon: Image,
    title: 'AI & Unsplash Images',
    desc: 'Generate cover art with DALL-E 3 or search millions of free Unsplash photos — all without leaving the app.',
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-50 dark:bg-rose-900/30',
  },
  {
    icon: LinkIcon,
    title: 'Internal Linking Assistant',
    desc: 'Upload your sitemap and get smart internal link suggestions injected directly into your article.',
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/30',
  },
  {
    icon: Languages,
    title: '6 Languages Built-In',
    desc: 'Full UI in English, French, Spanish, Arabic (RTL), Italian, and Chinese — no plugin required.',
    color: 'text-teal-600 dark:text-teal-400',
    bg: 'bg-teal-50 dark:bg-teal-900/30',
  },
];

const steps = [
  { num: '01', title: 'Enter your keyword', desc: 'Type any keyword or topic. Choose your AI model, language, and article length.' },
  { num: '02', title: 'Watch it generate live', desc: 'See your article appear in real time via SSE streaming — title, meta, full content, and keyword cluster.' },
  { num: '03', title: 'Publish or export', desc: 'Copy as Markdown or HTML, generate a PDF, or push directly to WordPress with one click.' },
];

const plans = [
  {
    name: 'Starter',
    icon: Shield,
    price: '$9',
    period: '/month',
    desc: 'Perfect for small blogs and solo creators.',
    features: ['20 articles per month', 'Standard AI model', 'Markdown & HTML export', 'No WordPress auto-publish'],
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-900/30',
  },
  {
    name: 'Growth',
    icon: Zap,
    price: '$29',
    period: '/month',
    desc: 'Best for growing content creators and agencies.',
    features: ['100 articles per month', 'GPT-4o & premium models', 'WordPress 1-click publish', 'Priority support'],
    color: 'text-primary-600 dark:text-primary-400',
    bg: 'bg-primary-50 dark:bg-primary-900/30',
    popular: true,
  },
  {
    name: 'Pro',
    icon: Crown,
    price: '$99',
    period: '/month',
    desc: 'For agencies and high-volume publishers.',
    features: ['500 articles per month', 'All premium AI models', 'Multi-site WordPress', 'Custom AI prompts', '24/7 dedicated support'],
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-900/30',
  },
];

const testimonials = [
  {
    name: 'Sarah Mitchell',
    role: 'Content Director @ ScaleUp Agency',
    avatar: 'SM',
    rating: 5,
    text: 'We replaced 3 freelance writers with SEO Gen AI. Output quality is on par and we produce 10× more content. The WordPress integration alone saves us 2 hours a day.',
  },
  {
    name: 'James Okafor',
    role: 'Niche Site Builder',
    avatar: 'JO',
    rating: 5,
    text: 'I have 14 niche sites. SEO Gen AI lets me publish 5 articles a day across all of them. Rankings improved within the first 60 days. The keyword cluster feature is a game-changer.',
  },
  {
    name: 'Léa Fontaine',
    role: 'SEO Consultant, Paris',
    avatar: 'LF',
    rating: 5,
    text: 'The French output is impeccable — better than tools costing 3× the price. The internal linking assistant saves me a ton of manual work on every project.',
  },
];

const faqs = [
  {
    q: 'Which AI models are supported?',
    a: 'SEO Gen AI supports GPT-4o (OpenAI), DeepSeek, Groq (Llama 3), and OpenRouter. You can provide your own API key for unlimited generation or use the shared credits pool.',
  },
  {
    q: 'Can I use my own OpenAI API key?',
    a: 'Yes. Add your personal API key in Settings → AI Configuration. This unlocks unlimited generations and bypasses the credit system entirely.',
  },
  {
    q: 'How does the WordPress integration work?',
    a: 'Add your WordPress site URL, username, and application password in Settings. Then hit "Publish to WordPress" from any generated article. The post is created as a draft with the featured image attached.',
  },
  {
    q: 'Is there a free trial?',
    a: 'Every new account receives 5 free credits to generate your first articles — no credit card required. Upgrade anytime to a paid plan for more capacity.',
  },
  {
    q: 'Can I cancel my subscription at any time?',
    a: 'Absolutely. Cancel from your account settings. You keep access until the end of your billing period and will never be charged again.',
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-5 text-left bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
      >
        <span className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">{q}</span>
        <ChevronDown className={`w-5 h-5 text-gray-400 shrink-0 ml-4 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <p className="px-6 pb-5 pt-1 text-gray-500 dark:text-gray-400 text-sm leading-relaxed bg-white dark:bg-gray-900">
              {a}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const LandingPage = () => {
  const { t } = useTranslation();
  const featuresRef = useRef(null);
  const pricingRef = useRef(null);

  const scrollTo = (ref) => {
    ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="min-h-screen bg-background font-sans selection:bg-primary-500/30">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-20 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 shrink-0 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-base sm:text-xl font-black text-gray-900 dark:text-white tracking-tight truncate">SEO Gen AI</span>
          </div>
          <div className="hidden md:flex items-center gap-6 lg:gap-8">
            <button onClick={() => scrollTo(featuresRef)} className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Features
            </button>
            <button onClick={() => scrollTo(pricingRef)} className="text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
              Pricing
            </button>
            <Link to="/login" className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
              {t('common.login')}
            </Link>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
            <ThemeToggle />
            <LanguageSwitcher />
            <Link to="/register" className="btn-primary text-xs sm:text-sm px-3 sm:px-5 py-2 sm:py-2.5 whitespace-nowrap">
              <span className="sm:hidden">{t('common.tryFree')}</span>
              <span className="hidden sm:inline">{t('common.startFreeTrial')}</span>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-32 sm:pt-40 pb-16 sm:pb-24 px-6 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[900px] h-[600px] sm:h-[900px] bg-primary-500/15 dark:bg-primary-500/8 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-20 right-[10%] w-40 h-40 bg-blue-500/10 rounded-full blur-[60px] pointer-events-none" />
        <div className="absolute bottom-10 left-[10%] w-32 h-32 bg-emerald-500/10 rounded-full blur-[60px] pointer-events-none" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.5 }}>
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold text-xs sm:text-sm mb-6 sm:mb-8 border border-primary-100 dark:border-primary-800/50">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Powered by GPT-4o, DeepSeek & Groq
            </span>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.1] mb-6 sm:mb-8">
              Generate articles that{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-500">
                actually rank.
              </span>
            </h1>
            <p className="text-base sm:text-xl text-gray-500 dark:text-gray-400 mb-8 sm:mb-10 max-w-2xl mx-auto leading-relaxed">
              Stop wasting hours on content creation. SEO Gen AI generates highly-optimized, structured, and engaging articles in seconds — then publishes them directly to WordPress.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
              <Link to="/register" className="w-full sm:w-auto btn-primary px-6 sm:px-8 py-3.5 sm:py-4 text-base sm:text-lg">
                Start for free <ArrowRight className="w-5 h-5 ml-2 inline" />
              </Link>
              <button
                onClick={() => scrollTo(featuresRef)}
                className="w-full sm:w-auto px-6 sm:px-8 py-3.5 sm:py-4 text-base sm:text-lg font-bold text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              >
                See features
              </button>
            </div>
          </motion.div>
        </div>

        {/* Dashboard mockup */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="max-w-5xl mx-auto mt-14 sm:mt-20 relative z-10"
        >
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl overflow-hidden bg-white dark:bg-gray-900">
            {/* Browser chrome */}
            <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
              <div className="flex-1 mx-4 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-1 text-xs text-gray-400 font-mono">
                app.seogenai.com
              </div>
            </div>
            {/* Simulated dashboard UI */}
            <div className="grid grid-cols-4 min-h-[280px] sm:min-h-[380px]">
              {/* Sidebar */}
              <div className="hidden sm:flex col-span-1 flex-col border-r border-gray-100 dark:border-gray-800 p-4 gap-2 bg-white dark:bg-gray-900">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                  <div className="h-2.5 w-16 bg-gray-200 dark:bg-gray-700 rounded-full" />
                </div>
                {['Dashboard', 'History', 'Settings'].map((item, i) => (
                  <div key={i} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${i === 0 ? 'bg-primary-50 dark:bg-primary-900/30' : ''}`}>
                    <div className={`w-3.5 h-3.5 rounded-sm ${i === 0 ? 'bg-primary-500' : 'bg-gray-200 dark:bg-gray-700'}`} />
                    <div className={`h-2 rounded-full ${i === 0 ? 'w-16 bg-primary-300 dark:bg-primary-700' : 'w-12 bg-gray-100 dark:bg-gray-800'}`} />
                  </div>
                ))}
              </div>
              {/* Main content */}
              <div className="col-span-4 sm:col-span-3 p-5 sm:p-7 space-y-4 bg-gray-50/50 dark:bg-gray-800/20">
                {/* Keyword input */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
                  <div className="h-2 w-24 bg-gray-200 dark:bg-gray-700 rounded-full" />
                  <div className="flex gap-2">
                    <div className="flex-1 h-10 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center px-4">
                      <span className="text-xs text-gray-400 font-mono">best ai tools for seo 2025</span>
                    </div>
                    <div className="h-10 w-28 bg-gradient-to-r from-primary-600 to-primary-500 rounded-xl flex items-center justify-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-white" />
                      <span className="text-xs font-bold text-white">Generate</span>
                    </div>
                  </div>
                </div>
                {/* Article preview */}
                <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <div className="h-2 w-16 bg-emerald-100 dark:bg-emerald-900/40 rounded-full" />
                  </div>
                  <div className="h-5 w-3/4 bg-gray-900 dark:bg-white rounded-lg opacity-90" />
                  <div className="space-y-1.5">
                    {[100, 85, 92, 78, 95].map((w, i) => (
                      <div key={i} className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full" style={{ width: `${w}%` }} />
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    {['H2 Heading', 'Keywords', 'Meta'].map((tag, i) => (
                      <span key={i} className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border border-primary-100 dark:border-primary-800/50">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute inset-x-8 -bottom-4 h-8 bg-gray-200/60 dark:bg-gray-700/60 blur-xl rounded-full" />
        </motion.div>
      </section>

      {/* ── Stats ── */}
      <section className="py-12 sm:py-16 bg-white dark:bg-gray-950 border-t border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: '5,000+', label: 'Articles Generated' },
              { value: '6',      label: 'Languages Supported' },
              { value: '4+',     label: 'AI Models' },
              { value: '99.9%',  label: 'Uptime' },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
              >
                <p className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-1">{stat.value}</p>
                <p className="text-xs sm:text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" ref={featuresRef} className="py-20 sm:py-28 bg-gray-50 dark:bg-gray-800/40 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }}
            className="text-center mb-14 sm:mb-20"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 font-bold text-xs mb-5 border border-primary-100 dark:border-primary-800/50">
              <Zap className="w-3.5 h-3.5" /> Everything you need
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Scale your content engine
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg max-w-2xl mx-auto">
              Built specifically for SEOs, agencies, and niche site builders who need results, not just words.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                variants={fadeUp}
                transition={{ delay: i * 0.08 }}
                viewport={{ once: true }}
                className="premium-card p-7 sm:p-8 bg-white dark:bg-gray-900 group hover:border-primary-200 dark:hover:border-primary-500/50 transition-all duration-300"
              >
                <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-5 sm:mb-6 ${f.bg} ${f.color} group-hover:scale-110 transition-transform duration-300`}>
                  <f.icon className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 sm:mb-3">{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed text-sm sm:text-base">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-20 sm:py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }}
            className="text-center mb-14 sm:mb-20"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-5 border border-emerald-100 dark:border-emerald-800/50">
              <Clock className="w-3.5 h-3.5" /> From keyword to article in 30 seconds
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
              How it works
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg max-w-xl mx-auto">
              Three steps. No learning curve. Full article ready to publish.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 relative">
            <div className="hidden md:block absolute top-12 left-[calc(16.67%+1.5rem)] right-[calc(16.67%+1.5rem)] h-px bg-gradient-to-r from-primary-200 via-primary-300 to-primary-200 dark:from-primary-800 dark:via-primary-700 dark:to-primary-800" />
            {steps.map((s, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                variants={fadeUp}
                transition={{ delay: i * 0.15 }}
                viewport={{ once: true }}
                className="text-center relative"
              >
                <div className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/40 dark:to-primary-800/30 border-2 border-primary-100 dark:border-primary-800/50 mb-6 mx-auto relative z-10">
                  <span className="text-3xl sm:text-4xl font-black text-primary-600 dark:text-primary-400">{s.num}</span>
                </div>
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-3">{s.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-sm sm:text-base leading-relaxed">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" ref={pricingRef} className="py-20 sm:py-28 bg-gray-50 dark:bg-gray-800/40 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }}
            className="text-center mb-14 sm:mb-20"
          >
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 font-bold text-xs mb-5 border border-amber-100 dark:border-amber-800/50">
              <Crown className="w-3.5 h-3.5" /> Simple pricing
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-4">
              Plans for every team
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg max-w-xl mx-auto">
              No hidden fees. No credit card required to start. Cancel anytime.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {plans.map((plan, i) => {
              const Icon = plan.icon;
              return (
                <motion.div
                  key={i}
                  initial="hidden"
                  whileInView="visible"
                  variants={fadeUp}
                  transition={{ delay: i * 0.1 }}
                  viewport={{ once: true }}
                  className={`relative premium-card p-7 sm:p-8 flex flex-col bg-white dark:bg-gray-900 ${plan.popular ? 'border-primary-500 shadow-glow md:scale-105' : ''}`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <span className="bg-primary-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full flex items-center gap-1 shadow-lg">
                        <Sparkles className="w-3 h-3" /> Most Popular
                      </span>
                    </div>
                  )}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-5 ${plan.bg} ${plan.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-1">{plan.name}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">{plan.desc}</p>
                  <div className="mb-6">
                    <span className="text-4xl font-black text-gray-900 dark:text-white">{plan.price}</span>
                    <span className="text-gray-400 dark:text-gray-500 font-medium">{plan.period}</span>
                  </div>
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map((feat, fi) => {
                      const excluded = feat.startsWith('No ');
                      return (
                        <li key={fi} className="flex items-start gap-3">
                          <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${excluded ? 'bg-gray-100 dark:bg-gray-800' : 'bg-emerald-50 dark:bg-emerald-900/30'}`}>
                            {excluded
                              ? <Minus className="w-3 h-3 text-gray-400" />
                              : <Check className="w-3 h-3 text-emerald-500" />}
                          </div>
                          <span className={`text-sm font-medium ${excluded ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'}`}>
                            {excluded ? feat.replace('No ', '') : feat}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                  <Link
                    to="/register"
                    className={`w-full py-3.5 rounded-xl font-bold text-center transition-all duration-200 text-sm ${
                      plan.popular
                        ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/25'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    Get started free
                  </Link>
                </motion.div>
              );
            })}
          </div>

          <p className="text-center text-sm text-gray-400 dark:text-gray-500 mt-8">
            All plans include a <strong className="text-gray-600 dark:text-gray-300">5-credit free trial</strong>. No credit card required.
          </p>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-20 sm:py-28 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }}
            className="text-center mb-14"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4">
              Loved by SEO professionals
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-base sm:text-lg max-w-xl mx-auto">
              Join thousands of creators building their organic traffic engine on autopilot.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                variants={fadeUp}
                transition={{ delay: i * 0.1 }}
                viewport={{ once: true }}
                className="premium-card p-7 bg-white dark:bg-gray-900 flex flex-col"
              >
                <div className="flex items-center gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, si) => (
                    <Star key={si} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed flex-1 mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-white">{t.name}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-20 sm:py-28 bg-gray-50 dark:bg-gray-800/40 px-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden" whileInView="visible" variants={fadeUp} viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white mb-4">
              Frequently asked questions
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Everything you need to know. Can't find your answer?{' '}
              <a href="mailto:support@seogenai.com" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline">
                Contact us.
              </a>
            </p>
          </motion.div>
          <div className="space-y-3">
            {faqs.map((item, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                variants={fadeUp}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
              >
                <FAQItem q={item.q} a={item.a} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 sm:py-32 px-6">
        <div className="max-w-5xl mx-auto rounded-[2rem] border border-gray-200 dark:border-gray-800 shadow-2xl bg-white dark:bg-gray-900 p-10 sm:p-16 md:p-20 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary-600/5 dark:from-primary-600/30 to-blue-600/5 dark:to-blue-600/10 pointer-events-none" />
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary-500/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="relative z-10">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary-50 dark:bg-white/10 text-primary-600 dark:text-white/80 font-bold text-xs mb-6 border border-primary-100 dark:border-white/10">
              <Cpu className="w-3.5 h-3.5" /> Start generating in 30 seconds
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-gray-900 dark:text-white mb-5">
              Ready to dominate the SERPs?
            </h2>
            <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-300 mb-8 sm:mb-10 max-w-2xl mx-auto">
              Join thousands of creators building their organic traffic engine on autopilot. No credit card required.
            </p>
            <Link to="/register" className="btn-primary px-8 sm:px-10 py-4 sm:py-5 text-base sm:text-lg shadow-glow inline-flex items-center gap-2">
              Get started free <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-gray-500 text-sm mt-5">5 free articles included with every new account</p>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-black text-gray-900 dark:text-white">SEO Gen AI</span>
              </div>
              <p className="text-sm text-gray-400 dark:text-gray-500 leading-relaxed max-w-[200px]">
                AI-powered SEO content generation platform.
              </p>
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Product</p>
              <ul className="space-y-2.5 text-sm text-gray-500 dark:text-gray-400">
                <li><button onClick={() => scrollTo(featuresRef)} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Features</button></li>
                <li><button onClick={() => scrollTo(pricingRef)} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Pricing</button></li>
                <li><Link to="/register" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Sign up free</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Account</p>
              <ul className="space-y-2.5 text-sm text-gray-500 dark:text-gray-400">
                <li><Link to="/login" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Login</Link></li>
                <li><Link to="/register" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Register</Link></li>
                <li><Link to="/forgot-password" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Forgot password</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-4">Legal</p>
              <ul className="space-y-2.5 text-sm text-gray-500 dark:text-gray-400">
                <li><Link to="/privacy" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          <div className="pt-6 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400 dark:text-gray-500">© 2026 SEO Gen AI. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
