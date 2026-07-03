import React, { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import GeneratorForm from '../components/GeneratorForm';
import ResultDisplay from '../components/ResultDisplay';
import InternalLinkingPanel from '../components/InternalLinkingPanel';
import { Zap, Search, Link as LinkIcon, FileText, Brain, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { Card, CardContent } from '../components/ui/Card';

function ArticleSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="w-full mt-8 sm:mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8"
    >
      <div className="lg:col-span-2 space-y-6">
        <Card className="overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3">
            <div className="h-3 w-32 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
          </div>
          <CardContent className="p-5 sm:p-10 space-y-6">
            <div className="h-7 sm:h-8 w-3/4 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            <div className="h-5 w-1/2 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse" />
            <div className="bg-primary-50/40 dark:bg-primary-900/20 rounded-2xl p-4 sm:p-5 space-y-2">
              <div className="h-3 w-24 bg-primary-100 dark:bg-primary-900/40 rounded-full animate-pulse" />
              <div className="h-4 w-full bg-primary-100/60 dark:bg-primary-900/30 rounded-full animate-pulse" />
              <div className="h-4 w-4/5 bg-primary-100/60 dark:bg-primary-900/30 rounded-full animate-pulse" />
            </div>
            <div className="space-y-3">
              {[100, 95, 90, 80, 95, 70, 85].map((w, i) => (
                <div key={i} className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse"
                     style={{ width: `${w}%`, animationDelay: `${i * 80}ms` }} />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="space-y-6">
        <Card>
          <CardContent className="space-y-4">
            <div className="h-3 w-28 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
            <div className="h-12 bg-gray-50 dark:bg-gray-800/60 rounded-xl animate-pulse" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-4">
            <div className="h-3 w-32 bg-gray-100 dark:bg-gray-800 rounded-full animate-pulse" />
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-10 bg-gray-50 dark:bg-gray-800/60 rounded-xl animate-pulse"
                   style={{ animationDelay: `${i * 60}ms` }} />
            ))}
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

export default function Dashboard() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('generate');
  const [isLoading, setIsLoading] = useState(false);
  const [streamStep, setStreamStep] = useState('');
  const [result, setResult]       = useState(null);
  const { user, refreshUser } = useAuth();
  const abortRef = useRef(null);

  const stats = [
    { label: t('dashboard.stats.aiModels'), value: '4+', sub: t('dashboard.stats.supported') },
    { label: t('dashboard.stats.languages'), value: '6',  sub: t('dashboard.stats.available') },
    { label: t('dashboard.stats.export'),    value: '3',  sub: t('dashboard.stats.formats')   },
  ];

  const heroBadges = [
    { icon: Brain,  label: t('dashboard.badges.aiGeneration'),    color: 'text-primary-300' },
    { icon: Globe,  label: t('dashboard.badges.wordpressExport'), color: 'text-emerald-400' },
    { icon: Zap,    label: t('dashboard.badges.instantResults'),  color: 'text-accent'      },
  ];

  const handleGenerate = async (keyword) => {
    setIsLoading(true);
    setResult(null);
    setStreamStep('meta');

    const token = localStorage.getItem('token');
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    let accumulated = { title: '', metaDescription: '', content: '', suggestedKeywords: [], keyword };
    let streamingContent = '';

    try {
      const controller = new AbortController();
      abortRef.current = controller;

      const response = await fetch(`${apiBase}/articles/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ keyword }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop();

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          try {
            const event = JSON.parse(line.slice(6));

            if (event.type === 'status') {
              setStreamStep(event.step);
            } else if (event.type === 'meta') {
              accumulated.title           = event.title;
              accumulated.metaDescription = event.metaDescription;
              // Show partial result immediately so user sees the title
              setResult({ ...accumulated, content: '' });
            } else if (event.type === 'delta') {
              streamingContent += event.delta;
              setResult((prev) => ({ ...prev, content: streamingContent }));
            } else if (event.type === 'keywords') {
              accumulated.suggestedKeywords = event.keywords || [];
              setResult((prev) => ({ ...prev, suggestedKeywords: accumulated.suggestedKeywords }));
            } else if (event.type === 'done') {
              setResult(event.data);
              toast.success(t('common.success'));
              refreshUser();
            } else if (event.type === 'error') {
              throw new Error(event.message);
            }
          } catch {
            // Ignore malformed SSE chunks (partial lines during streaming)
          }
        }
      }
    } catch (error) {
      if (error.name === 'AbortError') return;
      toast.error(error.message || t('common.error'));
      setResult(null);
    } finally {
      setIsLoading(false);
      setStreamStep('');
      abortRef.current = null;
    }
  };

  const stepLabels = {
    meta:     t('generator.steps.meta') + '…',
    content:  t('generator.steps.content') + '…',
    keywords: t('generator.steps.keywords') + '…',
    saving:   t('generator.steps.saving') + '…',
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-10">

        {/* ── Hero Banner ── */}
        <div className="relative overflow-hidden rounded-2xl text-white"
             style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#2d1b69 100%)' }}>
          <div className="orb orb-purple w-40 h-40 top-[-30%] right-[-5%] animate-glow" />
          <div className="orb orb-pink w-32 h-32 bottom-[-20%] left-[30%] opacity-20" />
          <div className="absolute inset-0 bg-dots opacity-[0.04]" />

          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 p-5 lg:p-6">
            <div className="max-w-xl space-y-3">
              <div className="inline-flex items-center gap-1.5 bg-white/8 backdrop-blur-md px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-[0.2em] border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-primary-200">{t('dashboard.aiEngineActive')}</span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black leading-tight tracking-tight">
                {t('dashboard.title')} <span className="gradient-text">{t('dashboard.titleHighlight')}</span>
              </h1>

              <p className="text-gray-400 text-xs font-medium leading-relaxed max-w-lg hidden sm:block">
                {t('dashboard.subtitle')}
              </p>

              <div className="flex items-center gap-4 pt-1">
                {stats.map((s, i) => (
                  <div key={i} className="text-left">
                    <p className="text-base font-black text-white">{s.value}</p>
                    <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex flex-row gap-2 shrink-0">
              {heroBadges.map((item, i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                  className="flex items-center gap-2 bg-white/6 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2"
                >
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-xs font-semibold text-white/80">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tab Switcher + Credits ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
          <div className="flex p-1.5 bg-gray-100 dark:bg-gray-900/50 rounded-2xl border border-gray-200/60 dark:border-gray-800 gap-1 w-full sm:w-fit">
            {[
              { key: 'generate', icon: FileText, label: t('dashboard.tabs.generator') },
              { key: 'linking',  icon: LinkIcon, label: t('dashboard.tabs.linking')   },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-200 uppercase tracking-widest cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-md scale-[1.02]'
                    : 'text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.key ? 'text-primary-600' : ''}`} />
                <span className="hidden xs:inline sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          {user && (
            <div className="flex items-center gap-3 sm:gap-4 px-4 sm:px-5 py-2.5 sm:py-3 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-soft w-full sm:w-auto justify-center sm:justify-start">
              <div className="text-center">
                <p className="label-xs mb-0 text-[9px] sm:text-[10px] text-gray-400 dark:text-gray-500">{t('dashboard.credits.label')}</p>
                <p className="text-sm font-black text-primary-600 dark:text-primary-400">
                  {user.settings?.userApiKey ? '∞' : (user.credits ?? '—')}
                </p>
              </div>
              <div className="divider hidden sm:block" />
              <div className="hidden sm:block text-center">
                <p className="label-xs mb-0">{t('dashboard.credits.mode')}</p>
                <p className="text-sm font-black text-gray-900">
                  {user.settings?.userApiKey ? t('dashboard.credits.personal') : t('dashboard.credits.shared')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ── Tab Content ── */}
        <AnimatePresence mode="wait">
          {activeTab === 'generate' ? (
            <motion.div key="generate"
              initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 8 }}
              className="space-y-6 sm:space-y-10"
            >
              <Card>
                <CardContent className="p-5 sm:p-8">
                  <div className="flex items-center gap-2.5 mb-4 sm:mb-6">
                    <div className="bg-primary-50 p-2 rounded-lg">
                      <Search className="w-4 h-4 text-primary-600" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900">{t('dashboard.startGenerating')}</h3>
                  </div>
                  <GeneratorForm onSubmit={handleGenerate} isLoading={isLoading} streamStep={streamStep} stepLabel={stepLabels[streamStep] || ''} />
                </CardContent>
              </Card>

              <AnimatePresence mode="wait">
                {isLoading && !result && <ArticleSkeleton key="skeleton" />}
                {result && (
                  <motion.div
                    key="result"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="animate-scale-in"
                  >
                    <ResultDisplay data={result} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div key="linking"
              initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }}
            >
              <InternalLinkingPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
