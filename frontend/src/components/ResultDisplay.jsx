import React, { useState } from 'react';
import { 
  Copy, 
  CheckCircle2, 
  ListFilter, 
  FileText, 
  Download, 
  FileCode, 
  Send, 
  Loader2, 
  Globe 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { toast } from 'react-hot-toast';

export default function ResultDisplay({ data }) {
  const [copied, setCopied] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState(null);

  if (!data) return null;

  const handleCopy = () => {
    const textToCopy = `Title: ${data.title}\n\nMeta Description: ${data.metaDescription}\n\nContent:\n${data.content}\n\nKeywords: ${data.suggestedKeywords?.join(', ')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExportMD = () => {
    const markdownText = `# ${data.title}\n\n**Meta Description:** ${data.metaDescription}\n\n---\n\n${data.content}`;
    const blob = new Blob([markdownText], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const safeTitle = (data.title || 'article')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    
    link.setAttribute('download', `${safeTitle || 'article'}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const convertMarkdownToHTML = (markdown) => {
    let html = markdown;
    html = html.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
    
    const lines = html.split('\n');
    let inList = false;
    const processedLines = lines.map(line => {
      const listMatch = line.match(/^[-*+]\s+(.*?)$/);
      if (listMatch) {
        let result = '';
        if (!inList) {
          result += '<ul>\n';
          inList = true;
        }
        result += `  <li>${listMatch[1]}</li>`;
        return result;
      } else {
        let result = '';
        if (inList) {
          result += '</ul>\n';
          inList = false;
        }
        result += line;
        return result;
      }
    });
    if (inList) {
      processedLines.push('</ul>');
    }
    html = processedLines.join('\n');
    
    const blocks = html.split('\n\n');
    const formattedBlocks = blocks.map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      if (trimmed.startsWith('<h') || trimmed.startsWith('<ul') || trimmed.startsWith('<li') || trimmed.startsWith('</ul')) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br />')}</p>`;
    });
    
    return formattedBlocks.filter(b => b.length > 0).join('\n\n');
  };

  const handleExportHTML = () => {
    const articleBody = convertMarkdownToHTML(data.content);
    
    const htmlTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="${data.metaDescription || ''}">
    <title>${data.title || 'SEO Article'}</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            line-height: 1.8;
            max-width: 800px;
            margin: 40px auto;
            padding: 0 20px;
            color: #334155;
            background-color: #f8fafc;
        }
        h1 {
            font-size: 2.5rem;
            color: #0f172a;
            line-height: 1.2;
            margin-bottom: 20px;
        }
        h2 {
            font-size: 1.8rem;
            color: #1e293b;
            margin-top: 40px;
            margin-bottom: 15px;
        }
        h3 {
            font-size: 1.4rem;
            color: #334155;
            margin-top: 30px;
            margin-bottom: 10px;
        }
        p {
            margin-bottom: 20px;
        }
        strong {
            color: #0f172a;
        }
        ul {
            margin-bottom: 25px;
            padding-left: 20px;
        }
        li {
            margin-bottom: 8px;
        }
        .meta-box {
            background-color: #f1f5f9;
            border-left: 4px solid #6366f1;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 40px;
        }
        .meta-title {
            font-size: 0.75rem;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: #4f46e5;
            margin: 0 0 5px 0;
        }
    </style>
</head>
<body>
    <h1>${data.title}</h1>
    
    <div class="meta-box">
        <h3 class="meta-title">Meta Description</h3>
        <p style="margin:0;">${data.metaDescription}</p>
    </div>
    
    <div class="article-content">
        ${articleBody}
    </div>
</body>
</html>`;

    const blob = new Blob([htmlTemplate], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    const safeTitle = (data.title || 'article')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    
    link.setAttribute('download', `${safeTitle || 'article'}.html`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePublishWordPress = async () => {
    if (!data || !data._id) {
      toast.error('Article ID not found.');
      return;
    }
    setPublishing(true);
    try {
      const res = await api.post(`/articles/${data._id}/publish-wordpress`);
      if (res.data.success) {
        setPublishedUrl(res.data.url);
        toast.success((t) => (
          <div className="flex flex-col space-y-1">
            <span className="font-bold text-gray-900">Article publié sur WordPress !</span>
            <a 
              href={res.data.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-xs text-primary-600 hover:text-primary-800 underline font-extrabold flex items-center gap-1 mt-1"
              onClick={() => toast.dismiss(t.id)}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Voir l'article publié ↗</span>
            </a>
          </div>
        ), { duration: 6000 });
      } else {
        toast.error(res.data.error || 'Failed to publish to WordPress.');
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || err.message || 'WordPress publication failed.');
    } finally {
      setPublishing(false);
    }
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
          <div className="p-6 sm:p-10 border-b border-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-3 text-primary-600">
              <FileText className="w-5 h-5" />
              <h2 className="text-sm font-bold uppercase tracking-widest">Generated Article</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center space-x-2 text-xs sm:text-sm font-bold text-gray-500 hover:text-primary-600 transition-colors bg-gray-50 hover:bg-primary-50 px-4 py-2.5 rounded-xl border border-gray-100"
              >
                {copied ? <CheckCircle2 className="w-4 h-4 text-primary-500" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy All'}</span>
              </button>

              <button
                onClick={handleExportMD}
                className="flex items-center space-x-2 text-xs sm:text-sm font-bold text-gray-500 hover:text-primary-600 transition-colors bg-gray-50 hover:bg-primary-50 px-4 py-2.5 rounded-xl border border-gray-100"
                title="Export as Markdown (.md)"
              >
                <Download className="w-4 h-4" />
                <span>Markdown</span>
              </button>

              <button
                onClick={handleExportHTML}
                className="flex items-center space-x-2 text-xs sm:text-sm font-bold text-gray-500 hover:text-primary-600 transition-colors bg-gray-50 hover:bg-primary-50 px-4 py-2.5 rounded-xl border border-gray-100"
                title="Export as HTML (.html)"
              >
                <FileCode className="w-4 h-4" />
                <span>HTML</span>
              </button>

              <button
                onClick={handlePublishWordPress}
                disabled={publishing}
                className="flex items-center space-x-2 text-xs sm:text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 transition-colors px-4 py-2.5 rounded-xl shadow-sm shadow-primary-500/10"
                title="Publier sur WordPress"
              >
                {publishing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                <span>{publishing ? 'Publishing...' : 'WordPress'}</span>
              </button>
            </div>
          </div>
          
          <div className="p-6 sm:p-10 space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 leading-[1.2] flex-grow">
                {data.title}
              </h1>
              
              {publishedUrl && (
                <a 
                  href={publishedUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 shrink-0 px-3.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 rounded-full text-xs font-black uppercase tracking-wider transition-all"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>En ligne sur WP</span>
                </a>
              )}
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
