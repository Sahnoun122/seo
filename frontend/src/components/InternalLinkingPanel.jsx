import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [knownUrlsInput, setKnownUrlsInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState(null);
  const [error, setError] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);

  const handleGenerate = async () => {
    if (!content.trim()) {
      toast.error(t('internalLinking.emptyContentError'));
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
        toast.success(t('internalLinking.generateSuccess'));
      } else {
        setError(data.error || t('internalLinking.genericError'));
        toast.error(t('internalLinking.generateError'));
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || err.message || t('internalLinking.genericError'));
      toast.error(t('internalLinking.generateError'));
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
          <div className="premium-card p-6 bg-white dark:bg-gray-900 space-y-4">
            <div className="flex items-center space-x-3 text-primary-600 dark:text-primary-400 mb-2">
              <LinkIcon className="w-5 h-5" />
              <h3 className="text-lg font-bold">{t('internalLinking.contentAnalysis')}</h3>
            </div>

            <div>
              <label className="block text-xs font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">{t('internalLinking.articleContent')}</label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('internalLinking.articleContentPlaceholder')}
                className="w-full h-64 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm transition-all resize-none font-semibold text-gray-800 dark:text-gray-100"
              />
            </div>
          </div>

          {/* URLs textarea input */}
          <div className="premium-card p-6 bg-white dark:bg-gray-900 space-y-4">
            <div className="flex items-center space-x-3 text-primary-600 dark:text-primary-400">
              <LinkIcon className="w-5 h-5" />
              <h3 className="text-lg font-bold">{t('internalLinking.knownUrls')}</h3>
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              {t('internalLinking.knownUrlsHint')}
            </p>

            <textarea
              value={knownUrlsInput}
              onChange={(e) => setKnownUrlsInput(e.target.value)}
              placeholder={t('internalLinking.knownUrlsPlaceholder')}
              className="w-full h-32 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm transition-all resize-none font-mono dark:text-gray-100"
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
                <span>{t('internalLinking.analyze')}</span>
              </>
            )}
          </button>
        </div>

        {/* Results Column (Right) */}
        <div className="space-y-6">
          {/* Initial placeholder state */}
          {!results && !isLoading && !error && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-gray-50/50 dark:bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-soft mb-4">
                <Info className="w-8 h-8 text-gray-300 dark:text-gray-500" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{t('internalLinking.emptyTitle')}</h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mt-2 leading-relaxed">
                {t('internalLinking.emptyBody')}
              </p>
            </div>
          )}

          {/* Loading spinner state */}
          {isLoading && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center space-y-4">
              <div className="relative">
                <div className="w-16 h-16 border-4 border-primary-100 dark:border-primary-900/40 border-t-primary-600 rounded-full animate-spin" />
                <Sparkles className="absolute inset-0 m-auto w-6 h-6 text-primary-600 animate-pulse" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-bold animate-pulse uppercase tracking-widest text-xs">{t('internalLinking.loadingText')}</p>
            </div>
          )}

          {/* Error warning state */}
          {error && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-red-50/50 dark:bg-red-900/10 rounded-3xl border-2 border-dashed border-red-200 dark:border-red-900/40 space-y-4">
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl shadow-soft text-red-500 border border-red-100 dark:border-red-900/40">
                <AlertTriangle className="w-8 h-8 animate-bounce" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{t('internalLinking.errorTitle')}</h4>
              <p className="text-red-600 dark:text-red-400 text-xs max-w-sm leading-relaxed font-semibold">
                {error}
              </p>
            </div>
          )}

          {/* Suggestion cards state */}
          {results && results.length === 0 && (
            <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-12 bg-gray-50/50 dark:bg-gray-800/30 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-700">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-soft mb-4">
                <Info className="w-8 h-8 text-amber-400" />
              </div>
              <h4 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{t('internalLinking.noResultsTitle')}</h4>
              <p className="text-gray-500 dark:text-gray-400 text-sm max-w-xs mt-2 leading-relaxed">
                {t('internalLinking.noResultsBody')}
              </p>
            </div>
          )}

          {results && results.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black uppercase tracking-[0.2em] text-gray-400">{t('internalLinking.suggestions', { count: results.length })}</h3>
              </div>
              <div className="grid grid-cols-1 gap-4 overflow-y-auto max-h-[600px] pr-2">
                {results.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="premium-card p-6 bg-white dark:bg-gray-900 group hover:border-primary-500/20 transition-all border border-gray-100 dark:border-gray-800"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-lg text-[10px] font-black uppercase tracking-wider">
                        {t('internalLinking.relevance', { score: item.relevanceScore })}
                      </div>

                      {/* Interactive HTML anchor copy button */}
                      <button
                        onClick={() => handleCopy(`<a href="${item.suggestedUrl}">${item.anchorText}</a>`, i)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 hover:border-primary-100 dark:hover:border-primary-900/40 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all text-gray-500 dark:text-gray-400"
                      >
                        {copiedIndex === i ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                            <span className="text-emerald-600 dark:text-emerald-400">{t('internalLinking.copied')}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>{t('internalLinking.copyAnchor')}</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{t('internalLinking.anchorText')}</p>
                        <p className="font-extrabold text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors text-sm">{item.anchorText}</p>
                      </div>

                      <div>
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{t('internalLinking.targetUrl')}</p>
                        <div className="flex items-center text-xs text-gray-600 dark:text-gray-300 break-all bg-gray-50 dark:bg-gray-800 p-2.5 rounded-xl font-semibold font-mono">
                          <ExternalLink className="w-3.5 h-3.5 mr-2 text-gray-400 flex-shrink-0" />
                          {item.suggestedUrl}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1">{t('internalLinking.contextSnippet')}</p>
                        <p className="text-xs italic text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
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
