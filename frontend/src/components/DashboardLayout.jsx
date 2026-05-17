import React, { useState } from 'react';
import Sidebar from './Sidebar';
import { Menu, X } from 'lucide-react';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-30">
          <div className="flex items-center space-x-3">
             <div className="bg-primary-600 p-1.5 rounded-lg">
                <Menu className="w-5 h-5 text-white" />
             </div>
             <span className="font-bold text-gray-900">SEO Gen AI</span>
          </div>
          <button onClick={toggleSidebar} className="p-2 text-gray-500">
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        <main className="flex-1 p-6 lg:p-12 lg:pl-20 lg:ml-64 animate-fade-in overflow-x-hidden min-h-screen">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
