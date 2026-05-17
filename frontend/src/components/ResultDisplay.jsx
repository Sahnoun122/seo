import React, { useState } from 'react';
import { Copy, CheckCircle2, ListFilter, FileText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';

export default function ResultDisplay({ data }) {
  const [copied, setCopied] = useState(false);

  if (!data) return null;

  const handleCopy = () => {
    const textToCopy = `Title: ${data.title}\n\nMeta Description: ${data.metaDescription}\n\nContent:\n${data.content}\n\nKeywords: ${data.suggestedKeywords?.join(', ')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8"
    >
      {/* Main Article Section */}
      <div className="lg:col-span-2 space-y-6">
        <div className="premium-card overflow-hidden">
          <div className="p-6 sm:p-10 border-b border-gray-50 flex justify-between items-start">
            <div className="flex items-center space-x-3 text-primary-600">
              <FileText className="w-5 h-5" />
              <h2 className="text-sm font-bold uppercase tracking-widest">Generated Article</h2>
            </div>
            <button
              onClick={handleCopy}
              className="flex items-center space-x-2 text-sm font-bold text-gray-500 hover:text-primary-600 transition-colors bg-gray-50 hover:bg-primary-50 px-5 py-2.5 rounded-xl border border-gray-100"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 text-primary-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied' : 'Copy All'}</span>
            </button>
          </div>
          
          <div className="p-6 sm:p-10 space-y-8">
            <div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-[1.2]">
                {data.title}
              </h1>
            </div>
            
            <div className="bg-primary-50/50 border border-primary-100 rounded-2xl p-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <FileText className="w-16 h-16" />
              </div>
              <h3 className="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] mb-2">Meta Description</h3>
              <p className="text-gray-700 text-base leading-relaxed">{data.metaDescription}</p>
            </div>

            <div className="prose prose-primary max-w-none prose-headings:text-gray-900 prose-p:text-gray-600 prose-headings:font-bold prose-lg prose-p:leading-[1.8]">
              <ReactMarkdown>{data.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>

      {/* Sidebar Section */}
      <div className="space-y-6">
        <div className="premium-card p-8 bg-white">
          <div className="flex items-center space-x-3 text-primary-600 mb-6">
            <ListFilter className="w-5 h-5" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em]">Target Keyword</h2>
          </div>
          <div className="bg-gray-50/50 border border-gray-100 rounded-2xl p-5 text-center">
             <p className="font-bold text-gray-900 tracking-tight">{data.keyword}</p>
          </div>
        </div>

        <div className="premium-card p-8 bg-white">
          <div className="flex items-center space-x-3 text-primary-600 mb-8">
            <SparklesIcon className="w-5 h-5" />
            <h2 className="text-xs font-black uppercase tracking-[0.2em]">Strategy Keywords</h2>
          </div>
          <ul className="space-y-4">
            {data.suggestedKeywords?.map((kw, index) => (
              <li key={index} className="flex items-center space-x-4 p-4 rounded-2xl bg-gray-50/50 border border-gray-100 hover:border-primary-200 hover:bg-primary-50/30 transition-all cursor-default group">
                <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-xs font-bold text-primary-600 group-hover:scale-110 transition-transform">
                  {index + 1}
                </span>
                <span className="text-gray-700 text-sm font-bold tracking-tight">{kw}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </motion.div>
  );
}

function SparklesIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
    </svg>
  );
}
