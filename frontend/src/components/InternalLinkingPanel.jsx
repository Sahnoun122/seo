import React, { useState } from 'react';
import { 
  Link as LinkIcon, 
  Plus, 
  X, 
  Sparkles, 
  Copy, 
  CheckCircle2, 
  Loader2,
  ExternalLink,
  Info
} from 'lucide-react';
import { generateInternalLinks } from '../lib/api';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function InternalLinkingPanel() {
  const [content, setContent] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [urls, setUrls] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const addUrl = () => {
    if (urlInput && !urls.includes(urlInput)) {
      setUrls([...urls, urlInput]);
      setUrlInput('');
    }
  };

  const removeUrl = (urlToRemove) => {
    setUrls(urls.filter(url => url !== urlToRemove));
  };

  const handleGenerate = async () => {
    if (!content.trim()) {
      toast.error('Please enter article content');
      return;
    }

    setIsLoading(true);
    setResults(null);
    try {
      const data = await generateInternalLinks(content, urls);
      if (data.success) {
        setResults(data.data.suggestions);
        toast.success('Internal links generated!');
      }
    } catch (error) {
      toast.error('Failed to generate links');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopy = (text, index) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="space-y-6">
          <div className="premium-card p-6 bg-white space-y-4">
            <div className="flex items-center space-x-3 text-primary-600 mb-2">
              <LinkIcon className="w-5 h-5" />
              <h3 className="text-lg font-bold">Content Analysis</h3>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Article Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your article content here..."
                className="w-full h-64 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm transition-all resize-none"
              />
            </div>
          </div>

          <div className="premium-card p-6 bg-white space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 text-primary-600">
                <Plus className="w-5 h-5" />
                <h3 className="text-lg font-bold">Existing URLs</h3>
              </div>
              <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{urls.length} added</span>
            </div>
            
            <div className="flex gap-2">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addUrl()}
                placeholder="https://example.com/blog-post"
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
              />
              <button 
                onClick={addUrl}
                className="p-3 bg-gray-900 text-white rounded-xl hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              <AnimatePresence>
                {urls.map((url) => (
                  <motion.span
                    key={url}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className="inline-flex items-center px-3 py-1.5 bg-primary-50 text-primary-700 rounded-lg text-xs font-semibold group"
                  >
                    <span className="truncate max-w-[200px]">{url}</span>
                    <button onClick={() => removeUrl(url)} className="ml-2 hover:text-red-500 transition-colors">
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
              {urls.length === 0 && (
                <p className="text-sm text-gray-400 italic">No URLs added yet. AI will suggest logical targets.</p>
              )}
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full btn-primary py-4 flex items-center justify-center space-x-3"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Analyze & Suggest Links</span>
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        <div className="space-y-6">
          {!results && !isLoading && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
              <div className="bg-white p-4 rounded-2xl shadow-soft mb-4">
                <Info className="w-8 h-8 text-gray-300" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 tracking-tight">No Analysis Yet</h4>
              <p className="text-gray-500 text-sm max-w-xs mt-2">
                Paste your article and add some target URLs to see smart internal linking suggestions.
              </p>
            </div>
          )}

          {isLoading && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-primary-600 animate-pulse" />
              </div>
              <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">AI is analyzing context...</p>
            </div>
          )}

          {results && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Suggestions ({results.length})</h3>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {results.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="premium-card p-6 bg-white group"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        Relevance: {item.relevanceScore}%
                      </div>
                      <button 
                        onClick={() => handleCopy(`<a href="${item.suggestedUrl}">${item.anchorText}</a>`, i)}
                        className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                      >
                        {copiedIndex === i ? <CheckCircle2 className="w-4 h-4 text-primary-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Anchor Text</p>
                        <p className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{item.anchorText}</p>
                      </div>
                      
                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-1">Target URL</p>
                        <div className="flex items-center text-sm text-gray-600 break-all bg-gray-50 p-2 rounded-lg">
                          <ExternalLink className="w-3 h-3 mr-2 flex-shrink-0" />
                          {item.suggestedUrl}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-50">
                        <p className="text-xs italic text-gray-500 leading-relaxed">
                          "...{item.context}..."
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
