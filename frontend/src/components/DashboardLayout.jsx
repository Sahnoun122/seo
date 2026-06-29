import React, { useState, useEffect } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, X, Sparkles, Moon, Sun, Settings, LogOut, LayoutDashboard, History, ShoppingCart } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import PlanBadge from './ui/PlanBadge';

const DESKTOP_BP = 1024;

export default function DashboardLayout({ children }) {
  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= DESKTOP_BP);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  useEffect(() => {
    const onResize = () => {
      const desktop = window.innerWidth >= DESKTOP_BP;
      setIsDesktop(desktop);
      if (desktop) setIsMobileSidebarOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const hasPersonalKey = user?.settings?.userApiKey && user.settings.userApiKey.trim() !== '';
  const effectivePlan = user?.role === 'admin'
    ? 'admin'
    : hasPersonalKey ? 'unlimited'
    : (user?.plan || 'free');

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Desktop : sidebar dans le flux flexbox ── */}
      {isDesktop && (
        <div className="flex-none w-72 sticky top-0 h-screen overflow-y-auto border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900">
          <Sidebar onClose={() => {}} isDesktop={true} />
        </div>
      )}

      {/* ── Mobile : drawer fixe + overlay ── */}
      {!isDesktop && (
        <>
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300"
            style={{ opacity: isMobileSidebarOpen ? 1 : 0, pointerEvents: isMobileSidebarOpen ? 'auto' : 'none' }}
            onClick={() => setIsMobileSidebarOpen(false)}
          />
          <Sidebar
            isOpen={isMobileSidebarOpen}
            onClose={() => setIsMobileSidebarOpen(false)}
            isDesktop={false}
          />
        </>
      )}

      {/* ── Zone principale ── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Header - Mobile Only */}
        {!isDesktop && (
          <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-4 sticky top-0 z-30">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setIsMobileSidebarOpen((v) => !v)}
                className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer"
                aria-label={isMobileSidebarOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              >
                {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-br from-primary-600 to-primary-500 p-1.5 rounded-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-gray-900 dark:text-white text-sm">SEO Gen AI</span>
              </div>
            </div>
            
            {/* User Avatar just for mobile top bar (optional, but keep it simple) */}
            <div
              onClick={() => navigate('/settings')}
              className="flex items-center gap-2 cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-sm border border-transparent">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
            </div>
          </header>
        )}

        {/* Contenu principal — 40px gauche/droite */}
        <main className="flex-1 min-h-screen overflow-x-hidden animate-fade-in px-4 sm:px-6 lg:px-10 py-6 sm:py-8 pb-10">
          {children}
        </main>

      </div>
    </div>
  );
}
