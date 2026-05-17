import React, { useEffect, useState } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { getHistory } from '../lib/api';
import { toast } from 'react-hot-toast';
import {
  History as HistoryIcon,
  Calendar,
  ChevronRight,
  Search,
  FileText,
  Loader2,
  ArrowLeft,
  Wand2,
  Send
} from 'lucide-react';
import { refineArticle } from '../lib/api';
import ResultDisplay from '../components/ResultDisplay';
import { motion } from 'framer-motion';

export default function History() {
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [isRefining, setIsRefining] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const data = await getHistory();
      if (data.success) {
        setHistory(data.data);
      }
    } catch (error) {
      toast.error('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefine = async (e) => {
    e.preventDefault();
    if (!refinementPrompt.trim()) return;

    setIsRefining(true);
    try {
      const data = await refineArticle(selectedArticle._id, refinementPrompt);
      if (data.success) {
        setSelectedArticle(data.data);
        setRefinementPrompt('');
        toast.success('Article updated with AI!');
        fetchHistory(); // Refresh history list in background
      }
    } catch (error) {
      toast.error('Failed to refine article');
    } finally {
      setIsRefining(false);
    }
  };

  if (selectedArticle) {
    return (
      <DashboardLayout>
        <div className="w-full space-y-8 animate-fade-in">
          <button
            onClick={() => setSelectedArticle(null)}
            className="flex items-center space-x-2 text-gray-500 hover:text-primary-600 transition-colors font-medium mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to History</span>
          </button>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-soft">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Modify with AI</h1>
              <p className="text-gray-500 text-sm">Ask the AI to change, extend, or improve the article.</p>
            </div>

            <form onSubmit={handleRefine} className="flex-1 max-w-xl flex gap-2">
              <input
                type="text"
                value={refinementPrompt}
                onChange={(e) => setRefinementPrompt(e.target.value)}
                placeholder="e.g. 'Make the introduction more aggressive' or 'Add a section about pricing'"
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                required
              />
              <button
                type="submit"
                disabled={isRefining}
                className="btn-primary px-6 py-3 flex items-center space-x-2 whitespace-nowrap"
              >
                {isRefining ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    <span>Refine</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <ResultDisplay data={selectedArticle} />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="w-full space-y-12 animate-fade-in">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 pb-8 border-b border-gray-100">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-pulse" />
              <span className="text-[10px] font-black text-primary-700 uppercase tracking-wider">{history.length} Articles Generated</span>
            </div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tight leading-tight">
              Content <span className="text-primary-600">Library</span>
            </h1>
            <p className="text-gray-500 font-medium text-lg max-w-lg">
              Access and manage your complete history of AI-optimized SEO articles.
            </p>
          </div>

          <div className="relative group w-full lg:max-w-md">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            </div>
            <input 
              type="text" 
              placeholder="Search by keyword or title..." 
              className="w-full pl-12 pr-16 py-4 bg-white border border-gray-100 rounded-2xl shadow-soft focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium text-gray-900"
            />
            <div className="absolute inset-y-0 right-4 flex items-center">
              <kbd className="hidden sm:inline-flex items-center px-2 py-1 bg-gray-50 border border-gray-200 rounded text-[10px] font-black text-gray-400 uppercase tracking-tighter">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
            <p className="text-gray-500 font-medium">Loading your history...</p>
          </div>
        ) : history.length === 0 ? (
          <div className="premium-card p-12 text-center bg-white">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <HistoryIcon className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">No articles found</h3>
            <p className="text-gray-500 max-w-sm mx-auto mt-2">
              You haven't generated any articles yet. Head back to the dashboard to get started!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {history.map((article, i) => (
              <motion.div
                key={article._id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => setSelectedArticle(article)}
                className="premium-card p-0 overflow-hidden bg-white flex flex-col group cursor-pointer border border-gray-100 hover:border-primary-200"
              >
                <div className="p-8 space-y-6 flex-1">
                  <div className="flex items-center justify-between">
                    <div className="bg-primary-50 p-3 rounded-2xl text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500 shadow-sm">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Created</span>
                      <span className="text-xs font-bold text-gray-900">
                        {new Date(article.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="font-bold text-gray-900 text-xl leading-tight group-hover:text-primary-600 transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                      <p className="text-[11px] font-black text-primary-500 uppercase tracking-widest">
                        {article.keyword}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {article.suggestedKeywords?.slice(0, 3).map((kw, idx) => (
                      <span key={idx} className="px-3 py-1 bg-gray-50 text-[10px] font-bold text-gray-400 rounded-lg border border-gray-100 uppercase tracking-wider group-hover:bg-white transition-colors">
                        {kw}
                      </span>
                    ))}
                  </div>
                </div>
                
                <div className="px-8 py-5 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between group-hover:bg-primary-50/50 transition-all duration-300">
                  <span className="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-primary-600 transition-colors">Open Article</span>
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:bg-primary-600 group-hover:text-white transition-all duration-500">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
