import { useState, useRef, useEffect } from 'react';
import {
  Copy, CheckCircle2, ListFilter, FileText,
  Download, FileCode, Loader2, Globe, Share2, Image as ImageIcon, Sparkles, Camera, WandSparkles, RefreshCw,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { marked } from 'marked';
import { motion } from 'framer-motion';
import { jsPDF } from 'jspdf';
import api, { uploadCoverImage, generateAICoverImage, regenerateKeywords } from '../lib/api';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import UnsplashPickerModal from './UnsplashPickerModal';

marked.setOptions({ gfm: true, breaks: true });

export default function ResultDisplay({ data, onCoverUpdate }) {
  const { t } = useTranslation();
  const [copied, setCopied]             = useState(false);
  const [publishing, setPublishing]     = useState(false);
  const [publishedUrl, setPublishedUrl] = useState(null);
  const [uploadingCover, setUploadingCover]         = useState(false);
  const [generatingAICover, setGeneratingAICover]   = useState(false);
  const getFullImageUrl = (url) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    return `${baseUrl}${url.replace(/^\/api/, '')}`;
  };

  const initialCoverUrl = getFullImageUrl(data?.coverUrl) || (data?.coverImageId ? `${import.meta.env.VITE_API_URL || '/api'}/images/${data.coverImageId}/view?size=medium` : null);
  const [coverUrl, setCoverUrl]                     = useState(initialCoverUrl);
  const [showUnsplash, setShowUnsplash]             = useState(false);
  const [suggestedKeywords, setSuggestedKeywords]   = useState(data?.suggestedKeywords || []);
  const [regeneratingKeywords, setRegeneratingKeywords] = useState(false);
  const fileInputRef = useRef(null);

  // Keeps local state in sync as `data` evolves during streaming (keywords arrive in
  // their own SSE step) or when a different saved article is opened from history.
  useEffect(() => {
    setSuggestedKeywords(data?.suggestedKeywords || []);
  }, [data?._id, data?.suggestedKeywords]);

  if (!data) return null;

  const handleCopy = () => {
    const text = `Title: ${data.title}\n\nMeta Description: ${data.metaDescription}\n\nContent:\n${data.content}\n\nKeywords: ${suggestedKeywords.join(', ')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRegenerateKeywords = async () => {
    setRegeneratingKeywords(true);
    try {
      const res = await regenerateKeywords(data._id);
      setSuggestedKeywords(res.data.suggestedKeywords || []);
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    } finally {
      setRegeneratingKeywords(false);
    }
  };

  const handleExportMD = () => {
    const md = `# ${data.title}\n\n**Meta Description:** ${data.metaDescription}\n\n---\n\n${data.content}`;
    downloadFile(md, 'article-seo.md', 'text/markdown');
  };

  const handleExportHTML = () => {
    const body = marked.parse(data.content);
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${(data.metaDescription || '').replace(/"/g, '&quot;')}">
  <title>${(data.title || 'SEO Article').replace(/</g, '&lt;')}</title>
  <style>
    body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;line-height:1.8;max-width:800px;margin:40px auto;padding:0 20px;color:#334155}
    h1{font-size:2.5rem;color:#0f172a;line-height:1.2;margin-bottom:20px}
    h2{font-size:1.8rem;color:#1e293b;margin-top:40px}
    h3{font-size:1.4rem;color:#334155;margin-top:30px}
    p{margin-bottom:20px}
    ul,ol{margin-bottom:20px;padding-left:1.5rem}
    li{margin-bottom:6px}
    blockquote{border-left:4px solid #7c3aed;padding:12px 20px;background:#f5f3ff;margin:20px 0;border-radius:0 8px 8px 0}
    code{background:#f1f5f9;padding:2px 6px;border-radius:4px;font-size:0.9em}
    pre code{display:block;padding:16px;overflow-x:auto}
    table{border-collapse:collapse;width:100%;margin-bottom:20px}
    th,td{border:1px solid #e2e8f0;padding:10px 14px;text-align:left}
    th{background:#f8fafc;font-weight:600}
    .meta-box{background:#f1f5f9;border-left:4px solid #7c3aed;padding:20px;border-radius:8px;margin-bottom:40px}
  </style>
</head>
<body>
  <h1>${(data.title || '').replace(/</g, '&lt;')}</h1>
  <div class="meta-box"><strong>Meta Description</strong><p>${(data.metaDescription || '').replace(/</g, '&lt;')}</p></div>
  ${body}
</body>
</html>`;
    downloadFile(html, 'article-seo.html', 'text/html');
  };

  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      
      // Clean up markdown for PDF text
      // We will do a basic text layout for the PDF
      let plainText = data.content
        .replace(/#/g, '')
        .replace(/\*\*/g, '')
        .replace(/\*/g, '')
        .replace(/`/g, '');
        
      const margin = 15;
      const pageWidth = doc.internal.pageSize.getWidth();
      const textWidth = pageWidth - margin * 2;

      // Title
      doc.setFontSize(18);
      doc.setTextColor(15, 23, 42); // slate-900
      const titleLines = doc.splitTextToSize(data.title || 'SEO Article', textWidth);
      doc.text(titleLines, margin, 20);
      let cursorY = 20 + (titleLines.length * 8) + 10;

      // Meta Description
      if (data.metaDescription) {
        doc.setFontSize(10);
        doc.setTextColor(100, 116, 139); // slate-500
        const metaLines = doc.splitTextToSize(`Meta Description: ${data.metaDescription}`, textWidth);
        doc.text(metaLines, margin, cursorY);
        cursorY += (metaLines.length * 5) + 10;
      }

      // Content
      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85); // slate-700
      const contentLines = doc.splitTextToSize(plainText, textWidth);
      
      // Handle pagination
      for (let i = 0; i < contentLines.length; i++) {
        if (cursorY > doc.internal.pageSize.getHeight() - margin) {
          doc.addPage();
          cursorY = margin + 10;
        }
        doc.text(contentLines[i], margin, cursorY);
        cursorY += 6;
      }

      doc.save('article-seo.pdf');
    } catch (err) {
      toast.error(t('result.pdfError'));
      console.error(err);
    }
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url;
    a.setAttribute('download', filename);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };


  const handlePublishWordPress = async () => {
    if (!data?._id) { toast.error(t('result.wordpress.notConfigured')); return; }
    setPublishing(true);
    try {
      const res = await api.post(`/articles/${data._id}/publish-wordpress`);
      if (res.data.success) {
        setPublishedUrl(res.data.url);
        toast.success((tid) => (
          <div className="space-y-1">
            <p className="font-bold text-gray-900 text-sm">{t('result.wordpress.success')}</p>
            <a href={res.data.url} target="_blank" rel="noopener noreferrer"
               className="text-xs text-primary-600 hover:underline font-bold flex items-center gap-1"
               onClick={() => toast.dismiss(tid.id)}>
              <Globe className="w-3.5 h-3.5" /> View draft ↗
            </a>
          </div>
        ), { duration: 8000 });
      } else {
        toast.error(res.data.error || t('result.wordpress.notConfigured'));
      }
    } catch (err) {
      toast.error(err.response?.data?.error || t('result.wordpress.notConfigured'));
    } finally {
      setPublishing(false);
    }
  };

  const handleGenerateAICover = async () => {
    if (!data?._id) return;
    setGeneratingAICover(true);
    try {
      const res = await generateAICoverImage(data._id);
      if (res.coverUrl) {
        setCoverUrl(getFullImageUrl(res.coverUrl));
        toast.success(t('result.actions.aiCoverGenerated'));
        onCoverUpdate?.(data._id, res.coverImageId);
      }
    } catch (err) {
      const msg = err.response?.data?.error || t('common.error');
      toast.error(msg);
    } finally {
      setGeneratingAICover(false);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !data?._id) return;

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPEG, PNG, WebP, and GIF images are allowed.');
      return;
    }

    setUploadingCover(true);
    try {
      const res = await uploadCoverImage(data._id, file);
      if (res.success) {
        setCoverUrl(getFullImageUrl(res.coverUrl));
        toast.success(t('result.actions.addImage', { defaultValue: 'Cover image updated!' }));
        onCoverUpdate?.(data._id, res.coverImageId);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || t('common.error'));
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mt-6 sm:mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8"
    >
      {/* ── Main Article ── */}
      <div className="lg:col-span-2 space-y-6">
        <div className="premium-card overflow-hidden">

          {/* Cover image */}
          {coverUrl && (
            <div className="h-52 sm:h-64 overflow-hidden bg-gray-100">
              <img src={coverUrl} alt="Article cover" className="w-full h-full object-cover" />
            </div>
          )}

          {/* Toolbar */}
          <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-primary-600">
                <FileText className="w-4 h-4" />
                <span className="text-xs font-black uppercase tracking-widest">{t('result.title')}</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button onClick={handleCopy} className="btn-ghost text-xs py-1.5 px-2.5 sm:py-2 sm:px-3" aria-label={copied ? t('result.actions.copied') : t('result.actions.copy')}>
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span className="hidden xs:inline">{copied ? t('result.actions.copied') : t('result.actions.copy')}</span>
                </button>
                <button onClick={handleExportMD} className="btn-ghost text-xs py-1.5 px-2.5 sm:py-2 sm:px-3" title="Export as Markdown" aria-label={t('result.actions.markdown')}>
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('result.actions.markdown')}</span>
                </button>
                <button onClick={handleExportHTML} className="btn-ghost text-xs py-1.5 px-2.5 sm:py-2 sm:px-3" title="Export as HTML" aria-label={t('result.actions.html')}>
                  <FileCode className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('result.actions.html')}</span>
                </button>
                <button onClick={handleExportPDF} className="btn-ghost text-xs py-1.5 px-2.5 sm:py-2 sm:px-3" title="Export as PDF" aria-label={t('result.actions.pdf')}>
                  <FileText className="w-4 h-4" />
                  <span className="hidden sm:inline">{t('result.actions.pdf')}</span>
                </button>
                <button
                  onClick={handlePublishWordPress}
                  disabled={publishing}
                  className="btn-ghost text-xs py-1.5 px-2.5 sm:py-2 sm:px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                  title="Publish to WordPress"
                  aria-label="Publish to WordPress"
                >
                  {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                  <span className="hidden sm:inline">WordPress</span>
                </button>

                {/* Cover image — upload or AI generate */}
                {data?._id && (
                  <>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      className="hidden"
                      onChange={handleCoverUpload}
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadingCover || generatingAICover}
                      className="btn-ghost text-xs py-1.5 px-2.5 sm:py-2 sm:px-3"
                      title="Upload cover image"
                      aria-label={coverUrl ? t('result.actions.replaceCover') : t('result.actions.addCover')}
                    >
                      {uploadingCover
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <ImageIcon className="w-4 h-4" />}
                      <span className="hidden sm:inline">{coverUrl ? t('result.actions.replaceCover') : t('result.actions.addCover')}</span>
                    </button>

                    <button
                      onClick={() => setShowUnsplash(true)}
                      disabled={generatingAICover || uploadingCover}
                      className="btn-ghost text-xs py-1.5 px-2.5 sm:py-2 sm:px-3"
                      title="Pick a photo from Unsplash"
                      aria-label="Pick a photo from Unsplash"
                    >
                      <Camera className="w-4 h-4" />
                      <span className="hidden sm:inline">Unsplash</span>
                    </button>

                    <button
                      onClick={handleGenerateAICover}
                      disabled={generatingAICover || uploadingCover}
                      className="btn-ghost text-xs py-1.5 px-2.5 sm:py-2 sm:px-3"
                      title={t('result.actions.aiCover')}
                      aria-label={t('result.actions.aiCover')}
                    >
                      {generatingAICover
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <WandSparkles className="w-4 h-4" />}
                      <span className="hidden sm:inline">{t('result.actions.aiCover')}</span>
                    </button>
                  </>
                )}


              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 sm:p-8 lg:p-10 space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 dark:text-white leading-tight flex-grow">
                {data.title}
              </h1>
              {publishedUrl && (
                <a href={publishedUrl} target="_blank" rel="noopener noreferrer"
                   className="badge-success shrink-0 py-1.5 px-3 text-xs font-black uppercase self-start">
                  <Globe className="w-3.5 h-3.5" /> Live on WP
                </a>
              )}
            </div>

            <div className="bg-primary-50/60 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/50 rounded-xl sm:rounded-2xl p-4 sm:p-5">
              <p className="label-xs text-primary-600 dark:text-primary-400">{t('result.metaDescription')}</p>
              <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{data.metaDescription}</p>
            </div>

            <div className="prose prose-slate dark:prose-invert prose-sm sm:prose-base max-w-full break-words overflow-x-auto">
              <ReactMarkdown rehypePlugins={[[rehypeSanitize, defaultSchema]]}>
                {data.content}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sidebar panels ── */}
      <div className="space-y-4 sm:space-y-6">
        <div className="premium-card p-4 sm:p-6 bg-white dark:bg-gray-900">
          <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-3 sm:mb-4">
            <ListFilter className="w-4 h-4" />
            <span className="label-xs text-primary-600 dark:text-primary-400 mb-0">{t('result.targetKeyword')}</span>
          </div>
          <div className="bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl p-3 sm:p-4 text-center">
            <p className="font-bold text-gray-900 dark:text-white text-sm sm:text-base">{data.keyword}</p>
          </div>
        </div>

        <div className="premium-card p-4 sm:p-6 bg-white dark:bg-gray-900">
          <div className="flex items-center justify-between gap-2 mb-4 sm:mb-5">
            <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400">
              <Sparkles className="w-4 h-4" />
              <span className="label-xs text-primary-600 dark:text-primary-400 mb-0">{t('result.strategyKeywords')}</span>
            </div>
            {data._id && suggestedKeywords.length > 0 && (
              <button type="button" onClick={handleRegenerateKeywords} disabled={regeneratingKeywords}
                      title={t('result.regenerateKeywords')}
                      className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${regeneratingKeywords ? 'animate-spin' : ''}`} />
              </button>
            )}
          </div>
          {suggestedKeywords.length > 0 ? (
            <ul className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-3">
              {suggestedKeywords.map((kw, i) => (
                <li key={i}
                    className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-500/50 hover:bg-primary-50/40 dark:hover:bg-primary-900/20 transition-all group">
                  <span className="w-5 h-5 sm:w-7 sm:h-7 rounded-lg bg-white dark:bg-gray-900 shadow-soft flex items-center justify-center text-[10px] sm:text-xs font-bold text-primary-600 dark:text-primary-400 shrink-0">
                    {i + 1}
                  </span>
                  <span className="text-gray-700 dark:text-gray-300 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2">{kw}</span>
                </li>
              ))}
            </ul>
          ) : data._id ? (
            <div className="text-center py-4 space-y-2.5">
              <p className="text-gray-500 dark:text-gray-400 text-xs">{t('result.keywordsEmpty')}</p>
              <button type="button" onClick={handleRegenerateKeywords} disabled={regeneratingKeywords}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-600 dark:text-primary-400 hover:underline disabled:opacity-50">
                <RefreshCw className={`w-3.5 h-3.5 ${regeneratingKeywords ? 'animate-spin' : ''}`} />
                {t('result.regenerateKeywords')}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </motion.div>

    {showUnsplash && (
      <UnsplashPickerModal
        articleId={data._id}
        onClose={() => setShowUnsplash(false)}
        onCoverSet={(url, credit) => {
          setCoverUrl(url);
          onCoverUpdate?.(data._id);
          toast.success(`Cover set — photo by ${credit?.photographerName || 'Unsplash'}`);
        }}
      />
    )}
    </>
  );
}

