import React, { useEffect, useState, useCallback, useRef } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import { getHistory, refineArticle, deleteArticle, restoreArticleVersion } from '../lib/api';
import { toast } from 'react-hot-toast';
import {
  History as HistoryIcon,
  Search,
  FileText,
  Loader2,
  ArrowLeft,
  Wand2,
  ChevronRight,
  ChevronLeft,
  Trash2,
  Clock,
  RotateCcw,
} from 'lucide-react';
import ResultDisplay from '../components/ResultDisplay';
import { motion, AnimatePresence } from 'framer-motion';

const PAGE_SIZE = 12;

export default function History() {
  const [articles, setArticles]               = useState([]);
  const [pagination, setPagination]           = useState({ total: 0, page: 1, pages: 1 });
  const [isLoading, setIsLoading]             = useState(true);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [refinementPrompt, setRefinementPrompt] = useState('');
  const [isRefining, setIsRefining]           = useState(false);
  const [searchQuery, setSearchQuery]         = useState('');
  const [page, setPage]                       = useState(1);
  const [deleteTarget, setDeleteTarget]       = useState(null);
  const [isDeleting, setIsDeleting]           = useState(false);
  const [showVersions, setShowVersions]       = useState(false);
  const [restoringIdx, setRestoringIdx]       = useState(null);
  const searchTimer = useRef(null);

  const fetchHistory = useCallback(async (p = page, q = searchQuery) => {
    setIsLoading(true);
    try {
      const data = await getHistory({ page: p, limit: PAGE_SIZE, search: q });
      if (data.success) {
        setArticles(data.data);
        setPagination(data.pagination);
      }
    } catch {
      toast.error('Failed to load history');
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => { fetchHistory(page, searchQuery); }, [page]);

  const handleSearch = (e) => {
    const q = e.target.value;
    setSearchQuery(q);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setPage(1);
      fetchHistory(1, q);
    }, 400);
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
        setShowVersions(false);
        toast.success('Article updated with AI!');
        fetchHistory(page, searchQuery);
      }
    } catch {
      toast.error('Failed to refine article');
    } finally {
      setIsRefining(false);
    }
  };

  const handleRestoreVersion = async (idx) => {
    setRestoringIdx(idx);
    try {
      const data = await restoreArticleVersion(selectedArticle._id, idx);
      if (data.success) {
        setSelectedArticle(data.data);
        setShowVersions(false);
        toast.success('Version restored!');
        fetchHistory(page, searchQuery);
      }
    } catch {
      toast.error('Failed to restore version');
    } finally {
      setRestoringIdx(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await deleteArticle(deleteTarget._id);
      toast.success('Article deleted');
      setDeleteTarget(null);
      if (selectedArticle?._id === deleteTarget._id) setSelectedArticle(null);
      fetchHistory(page, searchQuery);
    } catch {
      toast.error('Failed to delete article');
    } finally {
      setIsDeleting(false);
    }
  };

  if (selectedArticle) {
    const hasVersions = selectedArticle.versions?.length > 0;

    return (
      <DashboardLayout>
        <div className="w-full space-y-8 animate-fade-in">
          <div className="flex items-center justify-between">
            <button
              onClick={() => { setSelectedArticle(null); setShowVersions(false); }}
              className="flex items-center space-x-2 text-gray-500 hover:text-primary-600 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to History</span>
            </button>

            {hasVersions && (
              <button
                onClick={() => setShowVersions((v) => !v)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-gray-600 bg-gray-100 hover:bg-primary-50 hover:text-primary-700 rounded-xl transition-all"
              >
                <Clock className="w-4 h-4" />
                {showVersions ? 'Hide Versions' : `Version History (${selectedArticle.versions.length})`}
              </button>
            )}
          </div>

          {/* Version History Panel */}
          <AnimatePresence>
            {showVersions && hasVersions && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 space-y-3">
                  <p className="text-sm font-black text-amber-800 uppercase tracking-widest">Previous Versions</p>
                  <p className="text-xs text-amber-600">Restoring a version saves the current state first.</p>
                  <div className="space-y-2">
                    {selectedArticle.versions.map((v, i) => (
                      <div key={i} className="flex items-center justify-between bg-white border border-amber-100 rounded-xl px-4 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-semibold text-gray-900 truncate">{v.title}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(v.refinedAt).toLocaleString('en-US', {
                              day: 'numeric', month: 'short', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRestoreVersion(i)}
                          disabled={restoringIdx === i}
                          className="ml-4 flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {restoringIdx === i
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <RotateCcw className="w-3.5 h-3.5" />}
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Refine Panel */}
          <div className="flex flex-col gap-4 bg-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-soft">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Modify with AI</h1>
              <p className="text-gray-500 text-sm">Ask the AI to change, extend, or improve the article.</p>
            </div>
            <form onSubmit={handleRefine} className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={refinementPrompt}
                onChange={(e) => setRefinementPrompt(e.target.value)}
                placeholder="e.g. 'Make the introduction more aggressive'"
                className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                required
              />
              <button type="submit" disabled={isRefining} className="btn-primary px-6 py-3 flex items-center justify-center gap-2 whitespace-nowrap">
                {isRefining ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Wand2 className="w-4 h-4" /><span>Refine</span></>}
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
      <div className="w-full space-y-10 animate-fade-in">

        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-5 sm:gap-8 pb-6 sm:pb-8 border-b border-gray-100">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 bg-primary-50 px-3 py-1 rounded-full border border-primary-100">
              <div className="w-1.5 h-1.5 rounded-full bg-primary-600 animate-pulse" />
              <span className="text-[10px] font-black text-primary-700 uppercase tracking-wider">
                {pagination.total} Articles Generated
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-tight">
              Content <span className="text-primary-600">Library</span>
            </h1>
            <p className="text-gray-500 font-medium text-sm sm:text-base lg:text-lg max-w-lg">
              Access and manage your complete history of AI-optimized SEO articles.
            </p>
          </div>

          <div className="relative group w-full lg:max-w-md">
            <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
              <Search className="w-5 h-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search by keyword or title..."
              className="w-full pl-12 pr-6 py-3 sm:py-4 bg-white border border-gray-100 rounded-2xl shadow-soft focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-medium text-gray-900 text-sm sm:text-base"
            />
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-10 h-10 text-primary-600 animate-spin" />
            <p className="text-gray-500 font-medium">Loading your history...</p>
          </div>
        ) : articles.length === 0 ? (
          <div className="premium-card p-12 text-center bg-white">
            <div className="bg-gray-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <HistoryIcon className="w-8 h-8 text-gray-300" />
            </div>
            <h3 className="text-lg font-bold text-gray-900">
              {searchQuery ? 'No results found' : 'No articles yet'}
            </h3>
            <p className="text-gray-500 max-w-sm mx-auto mt-2">
              {searchQuery ? 'Try a different keyword or title.' : 'Head back to the dashboard to generate your first article!'}
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {articles.map((article, i) => (
                <motion.div
                  key={article._id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="premium-card p-0 overflow-hidden bg-white flex flex-col group border border-gray-100 hover:border-primary-200 relative"
                >
                  {/* Cover image */}
                  {article.coverImageId && (
                    <div className="h-36 overflow-hidden bg-gray-100">
                      <img
                        src={`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/images/${article.coverImageId}/view?size=medium`}
                        alt="cover"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}

                  {/* Version badge */}
                  {article.versions?.length > 0 && (
                    <div className="absolute top-3 left-3 bg-amber-100 text-amber-700 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full z-10">
                      {article.versions.length}v
                    </div>
                  )}

                  {/* Delete button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); setDeleteTarget(article); }}
                    className="absolute top-3 right-3 z-10 p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                    title="Delete article"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div
                    className="p-8 space-y-6 flex-1 cursor-pointer"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="bg-primary-50 p-3 rounded-2xl text-primary-600 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500 shadow-sm">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Created</span>
                        <span className="text-xs font-bold text-gray-900">
                          {new Date(article.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <h3 className="font-bold text-gray-900 text-xl leading-tight group-hover:text-primary-600 transition-colors line-clamp-2">
                        {article.title}
                      </h3>
                      <div className="flex items-center space-x-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary-500" />
                        <p className="text-[11px] font-black text-primary-500 uppercase tracking-widest">{article.keyword}</p>
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

                  <div
                    className="px-8 py-5 bg-gray-50/30 border-t border-gray-100 flex items-center justify-between group-hover:bg-primary-50/50 transition-all duration-300 cursor-pointer"
                    onClick={() => setSelectedArticle(article)}
                  >
                    <span className="text-xs font-black uppercase tracking-widest text-gray-400 group-hover:text-primary-600 transition-colors">Open Article</span>
                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:bg-primary-600 group-hover:text-white transition-all duration-500">
                      <ChevronRight className="w-4 h-4" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="text-sm font-bold text-gray-500">
                  Page {pagination.page} of {pagination.pages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.pages, p + 1))}
                  disabled={page === pagination.pages}
                  className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Delete confirmation modal */}
      <AnimatePresence>
        {deleteTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-red-900/20 backdrop-blur-sm z-[100]"
              onClick={() => setDeleteTarget(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-3xl shadow-2xl z-[101] overflow-hidden"
            >
              <div className="p-8 text-center space-y-5">
                <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
                  <Trash2 className="w-8 h-8 text-red-500" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">Delete this article?</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    "<span className="font-bold text-gray-800">{deleteTarget?.title}</span>" will be permanently removed. This action cannot be undone.
                  </p>
                </div>
                <div className="flex gap-3 pt-2">
                  <button onClick={() => setDeleteTarget(null)} className="flex-1 btn-ghost py-3">Cancel</button>
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="flex-1 py-3 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 cursor-pointer disabled:opacity-50"
                  >
                    {isDeleting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Yes, Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
