import { useState, useEffect, useCallback, useRef } from 'react';
import { X, Search, Loader2, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { searchUnsplashPhotos, setUnsplashCover } from '../lib/api';

export default function UnsplashPickerModal({ articleId, onClose, onCoverSet }) {
  const [query, setQuery] = useState('');
  const [photos, setPhotos] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(false);
  const [applying, setApplying] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSearch = useCallback(async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setPage(1);
    try {
      const data = await searchUnsplashPhotos(query.trim(), 1);
      setPhotos(data.photos);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err.message || 'Failed to search Unsplash.');
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleLoadMore = async () => {
    if (loading || page >= totalPages) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const data = await searchUnsplashPhotos(query.trim(), nextPage);
      setPhotos((prev) => [...prev, ...data.photos]);
      setPage(nextPage);
    } catch (err) {
      setError(err.message || 'Failed to load more photos.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = async (photo) => {
    setApplying(photo.id);
    setError('');
    try {
      const result = await setUnsplashCover(articleId, {
        photoUrl: photo.urls.regular,
        downloadLocation: photo.downloadLocation,
        photographerName: photo.photographer.name,
        photographerUrl: photo.photographer.url,
      });
      onCoverSet(result.coverUrl, result.credit);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to set cover image.');
    } finally {
      setApplying(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 shrink-0">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-violet-400" />
            <h2 className="text-white font-semibold text-lg">Unsplash Photo Picker</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors rounded-lg p-1.5 hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="px-6 py-4 border-b border-gray-700 shrink-0">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a photo (e.g. SEO, marketing, technology)…"
                className="w-full pl-10 pr-4 py-2.5 bg-gray-800 border border-gray-600 rounded-xl text-white placeholder-gray-500 text-sm focus:outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !query.trim()}
              className="px-5 py-2.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium text-sm rounded-xl transition-colors"
            >
              {loading && page === 1 ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
            </button>
          </div>
        </form>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-xl">
              {error}
            </div>
          )}

          {photos.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center py-16 text-gray-500">
              <ImageIcon className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-sm">Search for a photo to get started</p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative rounded-xl overflow-hidden bg-gray-800 aspect-video cursor-pointer"
                onClick={() => handleSelect(photo)}
              >
                <img
                  src={photo.urls.small}
                  alt={photo.description || 'Unsplash photo'}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  loading="lazy"
                />
                {/* Overlay */}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors flex flex-col items-center justify-center gap-2">
                  {applying === photo.id ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin opacity-0 group-hover:opacity-100" />
                  ) : (
                    <span className="text-white text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity px-3 py-1.5 bg-violet-600 rounded-lg">
                      Use this photo
                    </span>
                  )}
                </div>
                {/* Photographer credit */}
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <a
                    href={`${photo.photographer.url}?utm_source=seo_gen_ai&utm_medium=referral`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-white/80 text-xs hover:text-white flex items-center gap-1"
                  >
                    {photo.photographer.name}
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {/* Load more */}
          {photos.length > 0 && page < totalPages && (
            <div className="flex justify-center mt-4">
              <button
                onClick={handleLoadMore}
                disabled={loading}
                className="px-6 py-2.5 bg-gray-800 hover:bg-gray-700 border border-gray-600 text-gray-300 text-sm rounded-xl transition-colors disabled:opacity-40"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load more'}
              </button>
            </div>
          )}
        </div>

        {/* Footer attribution — required by Unsplash guidelines */}
        <div className="px-6 py-3 border-t border-gray-700 shrink-0">
          <a
            href="https://unsplash.com/?utm_source=seo_gen_ai&utm_medium=referral"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-300 text-xs transition-colors flex items-center gap-1"
          >
            Photos provided by{' '}
            <span className="text-gray-400 font-medium">Unsplash</span>
            <ExternalLink className="w-2.5 h-2.5" />
          </a>
        </div>
      </div>
    </div>
  );
}
