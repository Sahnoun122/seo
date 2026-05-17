import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import GeneratorForm from '../components/GeneratorForm';
import ResultDisplay from '../components/ResultDisplay';
import InternalLinkingPanel from '../components/InternalLinkingPanel';
import { generateArticle } from '../lib/api';
import { Sparkles, Zap, Shield, Search, Link as LinkIcon, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' or 'linking'
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleGenerate = async (keyword) => {
    setIsLoading(true);
    setResult(null); // Clear previous result
    
    try {
      const data = await generateArticle(keyword);
      if (data.success) {
        setResult(data.data);
        toast.success('Article generated successfully!');
      } else {
        toast.error(data.error || 'Failed to generate article.');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'An error occurred while generating the article.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-12">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-[2rem] bg-[#0f172a] p-8 lg:p-10 text-white shadow-2xl">
          {/* Animated Background Elements */}
          <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-primary-600/20 rounded-full blur-[100px] animate-pulse" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="max-w-xl space-y-4">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center space-x-2 bg-white/5 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-primary-400 animate-ping" />
                <span className="text-primary-100">AI Engine Active</span>
              </motion.div>

              <h1 className="text-4xl lg:text-5xl font-black leading-tight tracking-tight">
                Master the <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-400 to-accent">SEO Game</span>
              </h1>
              
              <p className="text-gray-400 text-base font-medium leading-relaxed max-w-md">
                Generate high-converting, SEO-optimized articles in seconds.
              </p>

              <div className="flex items-center gap-4 pt-2">
                 <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0f172a] bg-gray-800 flex items-center justify-center text-[8px] font-bold">
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                 </div>
                 <p className="text-[10px] text-gray-500 font-bold">Trusted by 2k+ creators</p>
              </div>
            </div>

            <div className="hidden lg:block relative scale-75">
               <div className="bg-white/5 backdrop-blur-sm p-6 rounded-3xl border border-white/10 shadow-inner">
                  <Sparkles className="w-32 h-32 text-primary-500/20" />
               </div>
               <motion.div 
                 animate={{ y: [0, -10, 0] }}
                 transition={{ duration: 4, repeat: Infinity }}
                 className="absolute -top-4 -right-4 bg-white p-3 rounded-xl shadow-xl border border-gray-100"
               >
                 <Zap className="w-6 h-6 text-primary-600" />
               </motion.div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="flex p-1.5 bg-gray-100/80 backdrop-blur-sm rounded-2xl w-fit border border-gray-200/50">
            <button
              onClick={() => setActiveTab('generate')}
              className={`flex items-center space-x-3 px-8 py-3 rounded-xl text-sm font-black transition-all duration-300 ${
                activeTab === 'generate' 
                  ? 'bg-white text-gray-900 shadow-xl shadow-gray-200/50 scale-[1.02]' 
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              <FileText className={`w-5 h-5 ${activeTab === 'generate' ? 'text-primary-600' : ''}`} />
              <span className="uppercase tracking-widest">Article Generator</span>
            </button>
            <button
              onClick={() => setActiveTab('linking')}
              className={`flex items-center space-x-3 px-8 py-3 rounded-xl text-sm font-black transition-all duration-300 ${
                activeTab === 'linking' 
                  ? 'bg-white text-gray-900 shadow-xl shadow-gray-200/50 scale-[1.02]' 
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              <LinkIcon className={`w-5 h-5 ${activeTab === 'linking' ? 'text-primary-600' : ''}`} />
              <span className="uppercase tracking-widest">Linking Assistant</span>
            </button>
          </div>

          <div className="flex items-center space-x-8 px-8 py-4 bg-white rounded-2xl border border-gray-100 shadow-soft">
             <div className="text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Efficiency</p>
                <p className="text-lg font-black text-primary-600">98%</p>
             </div>
             <div className="w-px h-8 bg-gray-100" />
             <div className="text-center">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Quality</p>
                <p className="text-lg font-black text-accent">High</p>
             </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'generate' ? (
            <motion.div
              key="generate"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-12"
            >
              {/* Input Card */}
              <div className="premium-card p-8 bg-white">
                <div className="flex items-center space-x-3 mb-6">
                  <div className="bg-primary-50 p-2 rounded-lg">
                    <Search className="w-5 h-5 text-primary-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">Start Generating</h3>
                </div>
                <GeneratorForm onSubmit={handleGenerate} isLoading={isLoading} />
              </div>
              
              {/* Result Area */}
              <div className="animate-scale-in">
                {result && <ResultDisplay data={result} />}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="linking"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
            >
              <InternalLinkingPanel />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
