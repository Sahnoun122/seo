import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, History, Settings,
  Sparkles, ChevronRight, X, Users, Zap, Coins, ShoppingCart, LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import PlanBadge from './ui/PlanBadge';

const navItems = [
  { icon: LayoutDashboard, labelKey: 'nav.dashboard', path: '/' },
  { icon: History,         labelKey: 'nav.history',   path: '/history' },
  { icon: Settings,        labelKey: 'nav.settings',  path: '/settings' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const hasPersonalKey = user?.settings?.userApiKey && user.settings.userApiKey.trim() !== '';
  const credits = user?.credits ?? 0;

  const effectivePlan = user?.role === 'admin'
    ? 'admin'
    : hasPersonalKey
      ? 'unlimited'
      : (user?.plan || 'free');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const { i18n } = useTranslation();
  const isRTL = i18n.dir() === 'rtl';

  return (
    <aside className={`
      fixed inset-y-0 h-screen w-72 bg-white dark:bg-gray-900 flex flex-col z-50
      border-gray-100 dark:border-gray-800
      ltr:left-0 ltr:border-r
      rtl:right-0 rtl:border-l
      transition-all duration-300 ease-in-out
      md:translate-x-0
      ${isOpen ? 'translate-x-0' : 'ltr:-translate-x-full rtl:translate-x-full'}
    `}
    style={{ boxShadow: isRTL
      ? (isDark ? '-4px 0 24px rgba(0,0,0,0.4)' : '-4px 0 24px rgba(0,0,0,0.04)')
      : (isDark ? '4px 0 24px rgba(0,0,0,0.4)'  : '4px 0 24px rgba(0,0,0,0.04)') }}
    >
      {/* ── Logo ── */}
      <div className="px-6 py-6 flex items-center justify-between border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">SEO Gen AI</span>
        </div>
        <button
          onClick={onClose}
          className="md:hidden p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* ── Credits Badge ── */}
      <div className="px-4 py-3">
        {hasPersonalKey ? (
          <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
            <Zap className="w-4 h-4 text-emerald-500 shrink-0 animate-pulse" />
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Unlimited Mode</p>
              <p className="text-[10px] text-emerald-500 font-medium">Personal API key active</p>
            </div>
          </div>
        ) : (
          <div className="bg-primary-50 border border-primary-100 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-primary-500" />
                <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest">{t('sidebar.credits')}</p>
              </div>
              <span className="text-sm font-black text-primary-700">{credits}</span>
            </div>
            <div className="w-full h-1.5 bg-primary-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(100, (credits / 10) * 100)}%`,
                  background: 'linear-gradient(90deg,#7c3aed,#a78bfa)',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            onClick={onClose}
            className={({ isActive }) => `
              flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group
              ${isActive
                ? 'text-primary-700 font-bold'
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 font-medium'}
            `}
            style={({ isActive }) => isActive ? {
              background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
              boxShadow: '0 1px 4px rgba(124,58,237,0.08)',
            } : {}}
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4.5 h-4.5" />
              <span className="text-sm">{t(item.labelKey)}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
          </NavLink>
        ))}

        {/* Buy Credits — only shown when using shared API key */}
        {!hasPersonalKey && (
          <NavLink
            to="/buy-credits"
            onClick={onClose}
            className={({ isActive }) => `
              flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group font-medium text-sm
              ${isActive ? 'text-primary-700 bg-primary-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}
            `}
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-4.5 h-4.5" />
              <span>{t('nav.buyCredits')}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
          </NavLink>
        )}

        {user?.role === 'admin' && (
          <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
            <p className="px-4 text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] mb-2">{t('common.admin')}</p>
            <NavLink
              to="/admin/dashboard"
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group font-medium text-sm
                ${isActive ? 'text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'}
              `}
            >
              <div className="flex items-center gap-3">
                <LayoutDashboard className="w-4.5 h-4.5" />
                <span>Dashboard</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
            </NavLink>
            <NavLink
              to="/admin/users"
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group font-medium text-sm
                ${isActive ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'}
              `}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4.5 h-4.5" />
                <span>{t('nav.userManager')}</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
            </NavLink>
          </div>
        )}
      </nav>

      {/* ── User card ── */}
      <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors group">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5">
              <PlanBadge plan={effectivePlan} variant="dot" />
            </span>
          </div>

          {/* Name + plan */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">
              {user?.name}
            </p>
            <PlanBadge plan={effectivePlan} variant="inline" className="mt-0.5" />
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title="Logout"
            className="p-1.5 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

    </aside>
  );
}
