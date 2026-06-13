import React, { useState } from 'react';
import { 
  Link as LinkIcon, 
  Sparkles, 
  Copy, 
  CheckCircle2, 
  Loader2,
  ExternalLink,
  Info,
  AlertTriangle
} from 'lucide-react';
import { getInternalLinks } from '../lib/api';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function InternalLinkingPanel() {
  const [content, setContent] = useState('');
  const [knownUrlsInput, setKnownUrlsInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleGenerate = async () => {
    if (!content.trim()) {
      toast.error('Please enter article content');
      return;
    }

    // Split input URL string by commas or return lines, and clean empty values
    const urlsArray = knownUrlsInput
      .split(/[\n,]+/)
      .map(url => url.trim())
      .filter(url => url.length > 0);

    setIsLoading(true);
    setResults(null);
    setError(null);
    try {
      const data = await getInternalLinks(content, urlsArray);
      if (data.success) {
        setResults(data.data.suggestions || []);
        toast.success('Internal links generated!');
      } else {
        setError(data.error || 'Failed to suggest internal links.');
        toast.error('Linking analysis failed');
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || 'Failed to generate links due to a technical server error.');
      toast.error('Linking analysis failed');
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
        {/* Input Column (Left) */}
        <div className="space-y-6">
          {/* Article input */}
          <div className="premium-card p-6 bg-white space-y-4">
            <div className="flex items-center space-x-3 text-primary-600 mb-2">
              <LinkIcon className="w-5 h-5" />
              <h3 className="text-lg font-bold">Content Analysis</h3>
            </div>
            
            <div>
              <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Article Content</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Paste your article content here..."
                className="w-full h-64 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm transition-all resize-none font-semibold text-gray-800"
              />
            </div>
          </div>

          {/* URLs textarea input */}
          <div className="premium-card p-6 bg-white space-y-4">
            <div className="flex items-center space-x-3 text-primary-600">
              <LinkIcon className="w-5 h-5" />
              <h3 className="text-lg font-bold">Known Target URLs</h3>
            </div>
            <p className="text-xs text-gray-400 font-medium">
              Enter the target URLs of your website. Separate each URL using a comma or a new line.
            </p>
            
            <textarea
              value={knownUrlsInput}
              onChange={(e) => setKnownUrlsInput(e.target.value)}
              placeholder="https://mysite.com/about&#10;https://mysite.com/contact, https://mysite.com/pricing"
              className="w-full h-32 p-4 bg-gray-50 border border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm transition-all resize-none font-mono"
            />
          </div>

          {/* Analyze CTA button */}
          <button
            onClick={handleGenerate}
            disabled={isLoading}
            className="w-full btn-primary py-4 flex items-center justify-center space-x-3 shadow-lg shadow-primary-500/20"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-accent animate-pulse" />
                <span>Analyze & Suggest Links</span>
              </>
            )}
          </button>
        </div>

        {/* Results Column (Right) */}
        <div className="space-y-6">
          {/* Initial placeholder state */}
          {!results && !isLoading && !error && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
              <div className="bg-white p-4 rounded-2xl shadow-soft mb-4">
                <Info className="w-8 h-8 text-gray-300" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 tracking-tight">No Analysis Yet</h4>
              <p className="text-gray-500 text-sm max-w-xs mt-2 leading-relaxed">
                Paste your article and add target URLs to trigger AI-powered semantic anchor analysis.
              </p>
            </div>
          )}

          {/* Loading spinner state */}
          {isLoading && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-primary-600 animate-pulse" />
              </div>
              <p className="text-gray-500 font-bold animate-pulse uppercase tracking-widest text-xs">AI is analyzing context...</p>
            </div>
          )}

          {/* Error warning state */}
          {error && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-red-50/50 rounded-3xl border-2 border-dashed border-red-200 space-y-4">
              <div className="bg-red-50 p-4 rounded-2xl shadow-soft text-red-500 border border-red-100">
                <AlertTriangle className="w-8 h-8 animate-bounce" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 tracking-tight">Linking Analysis Failed</h4>
              <p className="text-red-600 text-xs max-w-sm leading-relaxed font-semibold">
                {error}
              </p>
            </div>
          )}

          {/* Suggestion cards state */}
          {results && results.length === 0 && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-gray-50/50 rounded-3xl border-2 border-dashed border-gray-200">
              <div className="bg-white p-4 rounded-2xl shadow-soft mb-4">
                <Info className="w-8 h-8 text-amber-400" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 tracking-tight">No Links Found</h4>
              <p className="text-gray-500 text-sm max-w-xs mt-2 leading-relaxed">
                We couldn't identify semantic anchor opportunities in the content for the provided URLs. Try adjusting the keywords or target URLs.
              </p>
            </div>
          )}

          {results && results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">Suggestions ({results.length})</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[600px] pr-2">
                {results.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="premium-card p-6 bg-white group hover:border-primary-500/20 transition-all border border-gray-100"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        Relevance: {item.relevanceScore}%
                      </div>
                      
                      {/* Interactive HTML anchor copy button */}
                      <button 
                        onClick={() => handleCopy(`<a href="${item.suggestedUrl}">${item.anchorText}</a>`, i)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 border border-gray-100 hover:bg-primary-50 hover:text-primary-600 hover:border-primary-100 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-gray-500"
                      >
                        {copiedIndex === i ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                            <span className="text-emerald-600">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copy HTML Anchor</span>
                          </>
                        )}
                      </button>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Anchor Text</p>
                        <p className="font-extrabold text-gray-900 group-hover:text-primary-600 transition-colors text-sm">{item.anchorText}</p>
                      </div>
                      
                      <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Target URL</p>
                        <div className="flex items-center text-xs text-gray-600 break-all bg-gray-50 p-2.5 rounded-xl font-semibold font-mono">
                          <ExternalLink className="w-3.5 h-3.5 mr-2 text-gray-400 flex-shrink-0" />
                          {item.suggestedUrl}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Context Snippet</p>
                        <p className="text-xs italic text-gray-500 leading-relaxed font-medium">
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
