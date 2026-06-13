import React from 'react';
import { Link } from 'react-router-dom';
import { FileSearch, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center space-y-8 max-w-md animate-fade-in">
        <div className="relative inline-flex">
          <div className="orb orb-purple w-64 h-64 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-glow" />
          <div className="relative w-32 h-32 bg-white rounded-3xl flex items-center justify-center shadow-premium mx-auto">
            <FileSearch className="w-14 h-14 text-primary-500" />
          </div>
        </div>

        <div className="space-y-3">
          <p className="text-[10px] font-black text-primary-400 uppercase tracking-[0.3em]">404 — Not Found</p>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight">
            Page not found
          </h1>
          <p className="text-gray-500 text-base leading-relaxed">
            The page you're looking for doesn't exist or has been moved.
          </p>
        </div>

        <Link
          to="/"
          className="btn-primary inline-flex gap-2 px-6 py-3"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
