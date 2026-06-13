import React, { useState } from 'react';
import { Search, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GeneratorForm({ onSubmit, isLoading }) {
  const [keyword, setKeyword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (keyword.trim()) {
      onSubmit(keyword.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-4xl mx-auto py-10">
      <div className="relative group">
        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
          <Search className="w-6 h-6 text-gray-300 group-focus-within:text-primary-500 transition-colors" />
        </div>
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value.slice(0, 100))}
          placeholder="What topic should I write about today? (e.g. 'Sustainable Fashion Trends 2024')"
          className="w-full pl-16 pr-48 py-6 bg-gray-50 border border-gray-100 rounded-[2rem] text-lg font-medium text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white transition-all shadow-inner"
          required
        />
        <div className="absolute bottom-[-22px] right-4 text-[10px] font-bold text-gray-400">
          {keyword.length}/100
        </div>
        <div className="absolute inset-y-2 right-2 flex items-center">
          <button
            type="submit"
            disabled={isLoading || !keyword.trim()}
            className="h-full px-8 bg-gray-900 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-xs hover:bg-primary-600 transition-all active:scale-95 flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-gray-900/10 hover:shadow-primary-500/30"
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
      </div>
      <div className="flex items-center justify-center space-x-6 mt-6">
         <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] flex items-center">
            <span className="w-1 h-1 bg-gray-300 rounded-full mr-2" />
            High Accuracy
         </p>
         <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] flex items-center">
            <span className="w-1 h-1 bg-gray-300 rounded-full mr-2" />
            SEO Optimized
         </p>
         <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] flex items-center">
            <span className="w-1 h-1 bg-gray-300 rounded-full mr-2" />
            Plagiarism Free
         </p>
      </div>
    </form>
  );
}
