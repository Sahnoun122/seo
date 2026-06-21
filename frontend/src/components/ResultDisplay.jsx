import React, { useState, useRef } from 'react';
import {
  Copy, CheckCircle2, ListFilter, FileText,
  Download, FileCode, Loader2, Globe, Share2, Image as ImageIcon,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { marked } from 'marked';
import { motion } from 'framer-motion';
import api, { uploadCoverImage } from '../lib/api';
import { toast } from 'react-hot-toast';

marked.setOptions({ gfm: true, breaks: true });

export default function ResultDisplay({ data, onCoverUpdate }) {
  const [copied, setCopied]             = useState(false);
  const [publishing, setPublishing]     = useState(false);
  const [publishedUrl, setPublishedUrl] = useState(null);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverUrl, setCoverUrl]         = useState(data?.coverUrl || null);
  const fileInputRef = useRef(null);

  if (!data) return null;

  const handleCopy = () => {
    const text = `Title: ${data.title}\n\nMeta Description: ${data.metaDescription}\n\nContent:\n${data.content}\n\nKeywords: ${data.suggestedKeywords?.join(', ')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
    if (!data?._id) { toast.error('Article ID not found.'); return; }
    setPublishing(true);
    try {
      const res = await api.post(`/articles/${data._id}/publish-wordpress`);
      if (res.data.success) {
        setPublishedUrl(res.data.url);
        toast.success((t) => (
          <div className="space-y-1">
            <p className="font-bold text-gray-900 text-sm">Published to WordPress as draft!</p>
            <a href={res.data.url} target="_blank" rel="noopener noreferrer"
               className="text-xs text-primary-600 hover:underline font-bold flex items-center gap-1"
               onClick={() => toast.dismiss(t.id)}>
              <Globe className="w-3.5 h-3.5" /> View draft ↗
            </a>
          </div>
        ), { duration: 8000 });
      } else {
        toast.error(res.data.error || 'Failed to publish to WordPress.');
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'WordPress publishing failed.');
    } finally {
      setPublishing(false);
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
        setCoverUrl(res.coverUrl);
        toast.success('Cover image updated!');
        onCoverUpdate?.(data._id, res.coverImageId);
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to upload cover image.');
    } finally {
      setUploadingCover(false);
      e.target.value = '';
    }
  };

  return (
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
                <span className="text-xs font-black uppercase tracking-widest">Generated Article</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <button onClick={handleCopy} className="btn-ghost text-xs py-1.5 px-2.5 sm:py-2 sm:px-3">
                  {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                  <span className="hidden xs:inline">{copied ? 'Copied!' : 'Copy'}</span>
                </button>
                <button onClick={handleExportMD} className="btn-ghost text-xs py-1.5 px-2.5 sm:py-2 sm:px-3" title="Export as Markdown">
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Markdown</span>
                </button>
                <button onClick={handleExportHTML} className="btn-ghost text-xs py-1.5 px-2.5 sm:py-2 sm:px-3" title="Export as HTML">
                  <FileCode className="w-4 h-4" />
                  <span className="hidden sm:inline">HTML</span>
                </button>

                {/* Cover image upload */}
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
                      disabled={uploadingCover}
                      className="btn-ghost text-xs py-1.5 px-2.5 sm:py-2 sm:px-3"
                      title="Upload cover image"
                    >
                      {uploadingCover
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <ImageIcon className="w-4 h-4" />}
                      <span className="hidden sm:inline">{coverUrl ? 'Replace Cover' : 'Add Cover'}</span>
                    </button>
                  </>
                )}

                <button
                  onClick={handlePublishWordPress}
                  disabled={publishing}
                  className="btn-primary text-xs py-1.5 px-3 sm:py-2 sm:px-4"
                >
                  {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                  <span className="hidden xs:inline">{publishing ? 'Publishing...' : 'WordPress'}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-5 sm:p-8 lg:p-10 space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-gray-900 leading-tight flex-grow">
                {data.title}
              </h1>
              {publishedUrl && (
                <a href={publishedUrl} target="_blank" rel="noopener noreferrer"
                   className="badge-success shrink-0 py-1.5 px-3 text-xs font-black uppercase self-start">
                  <Globe className="w-3.5 h-3.5" /> Live on WP
                </a>
              )}
            </div>

            <div className="bg-primary-50/60 border border-primary-100 rounded-xl sm:rounded-2xl p-4 sm:p-5">
              <p className="label-xs text-primary-600">Meta Description</p>
              <p className="text-gray-700 text-sm leading-relaxed">{data.metaDescription}</p>
            </div>

            <div className="prose prose-slate prose-sm sm:prose-base max-w-full break-words overflow-x-auto">
              <ReactMarkdown>{data.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sidebar panels ── */}
      <div className="space-y-4 sm:space-y-6">
        <div className="premium-card p-4 sm:p-6 bg-white">
          <div className="flex items-center gap-2 text-primary-600 mb-3 sm:mb-4">
            <ListFilter className="w-4 h-4" />
            <span className="label-xs text-primary-600 mb-0">Target Keyword</span>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 sm:p-4 text-center">
            <p className="font-bold text-gray-900 text-sm sm:text-base">{data.keyword}</p>
          </div>
        </div>

        <div className="premium-card p-4 sm:p-6 bg-white">
          <div className="flex items-center gap-2 text-primary-600 mb-4 sm:mb-5">
            <SparklesIcon className="w-4 h-4" />
            <span className="label-xs text-primary-600 mb-0">Strategy Keywords</span>
          </div>
          <ul className="grid grid-cols-2 sm:grid-cols-1 gap-2 sm:gap-3">
            {data.suggestedKeywords?.map((kw, i) => (
              <li key={i}
                  className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-primary-200 hover:bg-primary-50/40 transition-all group">
                <span className="w-5 h-5 sm:w-7 sm:h-7 rounded-lg bg-white shadow-soft flex items-center justify-center text-[10px] sm:text-xs font-bold text-primary-600 shrink-0">
                  {i + 1}
                </span>
                <span className="text-gray-700 text-[10px] sm:text-xs font-semibold leading-tight line-clamp-2">{kw}</span>
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
    <svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/>
    </svg>
  );
}
