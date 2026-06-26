import React, { useState } from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import Sidebar from './Sidebar';
import { Menu, X, Sparkles, Moon, Sun, Settings, LogOut, LayoutDashboard, History, ShoppingCart } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './LanguageSwitcher';
import PlanBadge from './ui/PlanBadge';

export default function DashboardLayout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const hasPersonalKey = user?.settings?.userApiKey && user.settings.userApiKey.trim() !== '';
  const effectivePlan = user?.role === 'admin'
    ? 'admin'
    : hasPersonalKey
      ? 'unlimited'
      : (user?.plan || 'free');

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile Sidebar Overlay */}
      <div 
        className={`
          fixed inset-0 bg-black/40 backdrop-blur-sm z-40 md:hidden
          transition-opacity duration-300 ease-in-out
          ${isSidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
        `}
        onClick={() => setIsSidebarOpen(false)}
      />

      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <header className="h-16 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 flex items-center justify-between px-6 sticky top-0 z-30 md:ms-72 transition-all">
          {/* Left side: Logo (only visible on mobile) */}
          <div className="flex items-center space-x-3 md:hidden">
             <div className="bg-gradient-to-br from-primary-600 to-primary-500 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
             </div>
             <span className="font-bold text-gray-900 dark:text-white">SEO Gen AI</span>
          </div>
          
          {/* Spacer for desktop */}
          <div className="hidden md:block flex-1"></div>

          {/* Right side: Actions */}
          <div className="flex items-center gap-1.5 ms-auto">
            <button
              onClick={toggleTheme}
              className="p-2.5 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer"
              title="Toggle Theme"
            >
              {isDark ? <Sun className="w-4.5 h-4.5" /> : <Moon className="w-4.5 h-4.5" />}
            </button>
            <LanguageSwitcher />

            <div className="w-px h-6 bg-gray-200 dark:bg-gray-800 mx-1"></div>

            {/* Profile Dropdown */}
            <div className="relative group">
              <button className="flex items-center p-1 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-all cursor-pointer">
                <div className="relative">
                  <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-sm transition-colors border border-transparent group-hover:border-primary-200 dark:group-hover:border-primary-800">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5">
                    <PlanBadge plan={effectivePlan} variant="dot" />
                  </span>
                </div>
              </button>

              {/* Dropdown menu */}
              <div className="absolute end-0 top-full mt-2 w-60 bg-white dark:bg-gray-900 rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-4 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{user?.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{user?.email}</p>
                    </div>
                    <PlanBadge plan={effectivePlan} variant="badge" className="shrink-0 mt-0.5" />
                  </div>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => navigate('/settings?tab=profile')}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
                  >
                    <Settings className="w-4 h-4" />
                    <span>{t('nav.settings')}</span>
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors mt-1 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('common.logout')}</span>
                  </button>
                </div>
              </div>
            </div>

            <button
              onClick={toggleSidebar}
              className="md:hidden p-2 text-gray-500 hover:text-gray-900 transition-colors cursor-pointer ms-2"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </header>

        <main className="flex-1 p-5 md:p-8 md:ps-12 md:ms-72 lg:p-12 lg:ps-20 animate-fade-in overflow-x-hidden min-h-screen pb-24 md:pb-8">
          <div className="w-full">
            {children}
          </div>
        </main>

        {/* ── Mobile Bottom Navigation ── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md border-t border-gray-100 dark:border-gray-800 flex items-center justify-around px-2 h-16 safe-area-bottom">
          {[
            { to: '/',           end: true,  Icon: LayoutDashboard, key: 'nav.dashboard'  },
            { to: '/history',    end: false, Icon: History,          key: 'nav.history'   },
            { to: '/buy-credits',end: false, Icon: ShoppingCart,     key: 'nav.buyCredits'},
            { to: '/settings',   end: false, Icon: Settings,         key: 'nav.settings'  },
          ].map(({ to, end, Icon, key }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-1 px-4 py-1.5 rounded-xl transition-colors ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-gray-400 dark:text-gray-500'}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary-600 dark:text-primary-400' : ''}`} />
                  <span className="text-[9px] font-bold uppercase tracking-wider">{t(key)}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  );
}
