import React, { useState } from 'react';
import {
  Copy, CheckCircle2, ListFilter, FileText,
  Download, FileCode, Loader2, Globe, Share2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { toast } from 'react-hot-toast';

export default function ResultDisplay({ data }) {
  const [copied, setCopied]           = useState(false);
  const [publishing, setPublishing]   = useState(false);
  const [publishedUrl, setPublishedUrl] = useState(null);

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

  const convertMarkdownToHTML = (markdown) => {
    let html = markdown
      .replace(/\r\n/g, '\n').replace(/\r/g, '\n')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/^### (.*?)$/gm, '<h3>$1</h3>')
      .replace(/^## (.*?)$/gm, '<h2>$1</h2>')
      .replace(/^# (.*?)$/gm, '<h1>$1</h1>');

    const lines = html.split('\n');
    let inList = false;
    const processed = lines.map(line => {
      const m = line.match(/^[-*+]\s+(.*?)$/);
      if (m) { const r = (!inList ? ((inList = true), '<ul>\n') : '') + `  <li>${m[1]}</li>`; return r; }
      const r = (inList ? ((inList = false), '</ul>\n') : '') + line;
      return r;
    });
    if (inList) processed.push('</ul>');
    html = processed.join('\n');

    return html.split('\n\n').map(block => {
      const t = block.trim();
      if (!t) return '';
      if (/^<(h[1-3]|ul|li|\/ul)/.test(t)) return t;
      return `<p>${t.replace(/\n/g, '<br />')}</p>`;
    }).filter(Boolean).join('\n\n');
  };

  const handleExportHTML = () => {
    const body = convertMarkdownToHTML(data.content);
    const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><meta name="description" content="${data.metaDescription || ''}"><title>${data.title || 'SEO Article'}</title><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;line-height:1.8;max-width:800px;margin:40px auto;padding:0 20px;color:#334155}h1{font-size:2.5rem;color:#0f172a;line-height:1.2;margin-bottom:20px}h2{font-size:1.8rem;color:#1e293b;margin-top:40px}h3{font-size:1.4rem;color:#334155;margin-top:30px}p{margin-bottom:20px}.meta-box{background:#f1f5f9;border-left:4px solid #7c3aed;padding:20px;border-radius:8px;margin-bottom:40px}</style></head><body><h1>${data.title}</h1><div class="meta-box"><strong>Meta Description</strong><p>${data.metaDescription}</p></div>${body}</body></html>`;
    downloadFile(html, 'article-seo.html', 'text/html');
  };

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
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
            <p className="font-bold text-gray-900 text-sm">Article published to WordPress as a draft!</p>
            <a href={res.data.url} target="_blank" rel="noopener noreferrer"
               className="text-xs text-primary-600 hover:underline font-bold flex items-center gap-1"
               onClick={() => toast.dismiss(t.id)}>
              <Globe className="w-3.5 h-3.5" /> View WordPress draft ↗
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full mt-10 grid grid-cols-1 lg:grid-cols-3 gap-8"
    >
      {/* ── Main Article ── */}
      <div className="lg:col-span-2 space-y-6">
        <div className="premium-card overflow-hidden">

          {/* Toolbar */}
          <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-primary-600">
              <FileText className="w-4 h-4" />
              <span className="text-xs font-black uppercase tracking-widest">Generated Article</span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={handleCopy} className="btn-ghost text-xs py-2 px-3">
                {copied ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied!' : 'Copy All'}</span>
              </button>
              <button onClick={handleExportMD} className="btn-ghost text-xs py-2 px-3" title="Export as Markdown">
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Markdown</span>
              </button>
              <button onClick={handleExportHTML} className="btn-ghost text-xs py-2 px-3" title="Export as HTML">
                <FileCode className="w-4 h-4" />
                <span className="hidden sm:inline">HTML</span>
              </button>
              <button
                onClick={handlePublishWordPress}
                disabled={publishing}
                className="btn-primary text-xs py-2 px-4"
                title="Publish to WordPress"
              >
                {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Share2 className="w-4 h-4" />}
                <span>{publishing ? 'Publishing...' : 'WordPress'}</span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-10 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-tight flex-grow">
                {data.title}
              </h1>
              {publishedUrl && (
                <a href={publishedUrl} target="_blank" rel="noopener noreferrer"
                   className="badge-success shrink-0 py-1.5 px-3 text-xs font-black uppercase">
                  <Globe className="w-3.5 h-3.5" /> Live on WordPress
                </a>
              )}
            </div>

            <div className="bg-primary-50/60 border border-primary-100 rounded-2xl p-5 relative overflow-hidden">
              <p className="label-xs text-primary-600">Meta Description</p>
              <p className="text-gray-700 text-sm leading-relaxed">{data.metaDescription}</p>
            </div>

            <div className="prose prose-slate max-w-full break-words overflow-x-auto">
              <ReactMarkdown>{data.content}</ReactMarkdown>
            </div>
          </div>
        </div>
      </div>

      {/* ── Sidebar panels ── */}
      <div className="space-y-6">
        <div className="premium-card p-6 bg-white">
          <div className="flex items-center gap-2 text-primary-600 mb-4">
            <ListFilter className="w-4 h-4" />
            <span className="label-xs text-primary-600 mb-0">Target Keyword</span>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-xl p-4 text-center">
            <p className="font-bold text-gray-900">{data.keyword}</p>
          </div>
        </div>

        <div className="premium-card p-6 bg-white">
          <div className="flex items-center gap-2 text-primary-600 mb-5">
            <SparklesIcon className="w-4 h-4" />
            <span className="label-xs text-primary-600 mb-0">Strategy Keywords</span>
          </div>
          <ul className="space-y-3">
            {data.suggestedKeywords?.map((kw, i) => (
              <li key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100 hover:border-primary-200 hover:bg-primary-50/40 transition-all group">
                <span className="w-7 h-7 rounded-lg bg-white shadow-soft flex items-center justify-center text-xs font-bold text-primary-600 shrink-0 group-hover:scale-110 transition-transform">
                  {i + 1}
                </span>
                <span className="text-gray-700 text-xs font-semibold">{kw}</span>
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
