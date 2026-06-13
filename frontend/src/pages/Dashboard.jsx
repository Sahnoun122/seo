import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import GeneratorForm from '../components/GeneratorForm';
import ResultDisplay from '../components/ResultDisplay';
import InternalLinkingPanel from '../components/InternalLinkingPanel';
import { generateArticle } from '../lib/api';
import { Sparkles, Zap, Search, Link as LinkIcon, FileText, Brain, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

const stats = [
  { label: 'AI Models',  value: '4+',   sub: 'Supported'    },
  { label: 'Languages',  value: '5',    sub: 'Available'     },
  { label: 'Export',     value: '3',    sub: 'Formats'       },
];

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('generate');
  const [isLoading, setIsLoading]   = useState(false);
  const [result, setResult]         = useState(null);
  const { user } = useAuth();

  const handleGenerate = async (keyword) => {
    setIsLoading(true);
    setResult(null);
    try {
      const data = await generateArticle(keyword);
      if (data.success) {
        setResult(data.data);
        toast.success('Article generated successfully!');
      } else {
        toast.error(data.error || 'Failed to generate article.');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'An error occurred during generation.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-10">

        {/* ── Hero Banner ── */}
        <div className="relative overflow-hidden rounded-3xl text-white"
             style={{ background: 'linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#2d1b69 100%)' }}>
          <div className="orb orb-purple w-80 h-80 top-[-30%] right-[-5%] animate-glow" />
          <div className="orb orb-pink   w-64 h-64 bottom-[-20%] left-[30%] opacity-20" />
          <div className="absolute inset-0 bg-dots opacity-[0.04]" />

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8 p-8 lg:p-10">
            <div className="max-w-xl space-y-5">
              <div className="inline-flex items-center gap-2 bg-white/8 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-primary-200">AI Engine Active</span>
              </div>

              <h1 className="text-4xl lg:text-5xl font-black leading-tight tracking-tight">
                Generate SEO content<br />
                <span className="gradient-text">in seconds.</span>
              </h1>

              <p className="text-gray-400 text-sm font-medium leading-relaxed max-w-md">
                Powered by GPT-4o, DeepSeek, Groq and OpenRouter. One keyword → full article, meta description, and keyword strategy.
              </p>

              {/* Mini stat row */}
              <div className="flex items-center gap-6 pt-2">
                {stats.map((s, i) => (
                  <div key={i} className="text-center">
                    <p className="text-xl font-black text-white">{s.value}</p>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden lg:flex flex-col gap-3 shrink-0">
              {[
                { icon: Brain,  label: 'AI Generation',     color: 'text-primary-300' },
                { icon: Globe,  label: 'WordPress Export',  color: 'text-emerald-400' },
                { icon: Zap,    label: 'Instant Results',   color: 'text-accent'       },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
                  className="flex items-center gap-3 bg-white/6 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-3"
                >
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                  <span className="text-sm font-semibold text-white/80">{item.label}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tab Switcher ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex p-1.5 bg-gray-100 rounded-2xl w-fit border border-gray-200/60 gap-1">
            {[
              { key: 'generate', icon: FileText, label: 'Article Generator' },
              { key: 'linking',  icon: LinkIcon, label: 'Linking Assistant' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl text-xs font-black transition-all duration-200 uppercase tracking-widest cursor-pointer ${
                  activeTab === tab.key
                    ? 'bg-white text-gray-900 shadow-md scale-[1.02]'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.key ? 'text-primary-600' : ''}`} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Active user credit info */}
          {user && (
            <div className="flex items-center gap-4 px-5 py-3 bg-white rounded-2xl border border-gray-100 shadow-soft">
              <div className="text-center">
                <p className="label-xs mb-0">Credits</p>
                <p className="text-sm font-black text-primary-600">
                  {user.settings?.userApiKey ? '∞' : (user.credits ?? '—')}
                </p>
              </div>
              <div className="divider" />
              <div className="text-center">
                <p className="label-xs mb-0">Mode</p>
                <p className="text-sm font-black text-gray-900">
                  {user.settings?.userApiKey ? 'Personal' : 'Shared'}
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
              className="space-y-10"
            >
              <div className="premium-card p-8 bg-white">
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="bg-primary-50 p-2 rounded-lg">
                    <Search className="w-4.5 h-4.5 text-primary-600" />
                  </div>
                  <h3 className="text-base font-bold text-gray-900">Start Generating</h3>
                </div>
                <GeneratorForm onSubmit={handleGenerate} isLoading={isLoading} />
              </div>

              <div className="animate-scale-in">
                {result && <ResultDisplay data={result} />}
              </div>
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
