import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, History, Settings,
  Sparkles, ChevronRight, X, Users, Zap, Coins, ShoppingCart, LogOut, Sun, Moon
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useTranslation } from 'react-i18next';
import PlanBadge from './ui/PlanBadge';
import LanguageSwitcher from './LanguageSwitcher';

const navItems = [
  { icon: LayoutDashboard, labelKey: 'nav.dashboard', path: '/' },
  { icon: History,         labelKey: 'nav.history',   path: '/history' },
  { icon: Settings,        labelKey: 'nav.settings',  path: '/settings' },
];

export default function Sidebar({ isOpen, onClose, isDesktop }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const isRTL = i18n.dir() === 'rtl';

  const hasPersonalKey = user?.settings?.userApiKey && user.settings.userApiKey.trim() !== '';
  const credits = user?.credits ?? 0;
  const effectivePlan = user?.role === 'admin'
    ? 'admin'
    : hasPersonalKey ? 'unlimited'
    : (user?.plan || 'free');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Sur mobile : drawer fixe qui slide. Sur desktop : le parent wrapper gère tout.
  const mobileStyle = !isDesktop ? {
    position: 'fixed',
    top: 0,
    bottom: 0,
    width: '18rem',
    zIndex: 50,
    [isRTL ? 'right' : 'left']: 0,
    transform: isOpen ? 'translateX(0)' : isRTL ? 'translateX(100%)' : 'translateX(-100%)',
    transition: 'transform 300ms ease-in-out',
    boxShadow: isDark ? '4px 0 32px rgba(0,0,0,0.5)' : '4px 0 32px rgba(0,0,0,0.08)',
  } : {};

  return (
    <aside
      style={mobileStyle}
      className="h-full flex flex-col bg-white dark:bg-gray-900"
    >
      {/* ── Logo ── */}
      <div className="px-6 py-5 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl shrink-0" style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-gray-900 dark:text-white">SEO Gen AI</span>
        </div>
        {!isDesktop && (
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* ── Crédits ── */}
      <div className="px-4 py-3 shrink-0">
        {hasPersonalKey ? (
          <div className="flex items-center gap-2.5 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800/40 rounded-xl px-4 py-3">
            <Zap className="w-4 h-4 text-emerald-500 shrink-0 animate-pulse" />
            <div>
              <p className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Unlimited Mode</p>
              <p className="text-[10px] text-emerald-500 font-medium">Personal API key active</p>
            </div>
          </div>
        ) : (
          <div className="bg-primary-50 dark:bg-primary-900/20 border border-primary-100 dark:border-primary-800/40 rounded-xl px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5 text-primary-500" />
                <p className="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-widest">{t('sidebar.credits')}</p>
              </div>
              <span className="text-sm font-black text-primary-700 dark:text-primary-300">{credits}</span>
            </div>
            <div className="w-full h-1.5 bg-primary-100 dark:bg-primary-900/40 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, (credits / 10) * 100)}%`, background: 'linear-gradient(90deg,#7c3aed,#a78bfa)' }}
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
            onClick={isDesktop ? undefined : onClose}
            className={({ isActive }) =>
              `flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group
              ${isActive
                ? 'text-primary-700 dark:text-primary-300 font-bold bg-primary-50 dark:bg-primary-900/40 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800 font-medium'}`
            }
          >
            <div className="flex items-center gap-3">
              <item.icon className="w-4 h-4 shrink-0" />
              <span className="text-sm">{t(item.labelKey)}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
          </NavLink>
        ))}

        {!hasPersonalKey && (
          <NavLink
            to="/buy-credits"
            onClick={isDesktop ? undefined : onClose}
            className={({ isActive }) =>
              `flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group font-medium text-sm
              ${isActive
                ? 'text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-900/20'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'}`
            }
          >
            <div className="flex items-center gap-3">
              <ShoppingCart className="w-4 h-4 shrink-0" />
              <span>{t('nav.buyCredits')}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
          </NavLink>
        )}

        {user?.role === 'admin' && (
          <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
            <p className="px-4 text-[9px] font-black text-gray-400 dark:text-gray-600 uppercase tracking-[0.2em] mb-2">{t('common.admin')}</p>
            {[
              { to: '/admin/dashboard', Icon: LayoutDashboard, label: 'Dashboard' },
              { to: '/admin/users',     Icon: Users,            label: t('nav.userManager') },
            ].map(({ to, Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={isDesktop ? undefined : onClose}
                className={({ isActive }) =>
                  `flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group font-medium text-sm
                  ${isActive
                    ? 'text-primary-700 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-800'}`
                }
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{label}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
              </NavLink>
            ))}
          </div>
        )}
      </nav>

      {/* ── Settings (Theme, Language) ── */}
      <div className="px-4 py-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 shrink-0">
        <LanguageSwitcher direction="up" />
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-all cursor-pointer"
          title="Basculer le thème"
        >
          {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
      </div>

      {/* ── Carte utilisateur ── */}
      <div className="px-4 py-4 border-t border-gray-100 dark:border-gray-800 shrink-0">
        <div
          onClick={() => {
            navigate('/settings');
            if (!isDesktop && onClose) onClose();
          }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors group cursor-pointer"
        >
          <div className="relative shrink-0">
            <div className="w-8 h-8 rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold text-sm">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <span className="absolute -bottom-0.5 -right-0.5">
              <PlanBadge plan={effectivePlan} variant="dot" />
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate leading-tight">{user?.name}</p>
            <PlanBadge plan={effectivePlan} variant="inline" className="mt-0.5" />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleLogout();
            }}
            title="Déconnexion"
            className="p-1.5 text-gray-300 hover:text-red-500 dark:text-gray-600 dark:hover:text-red-400 rounded-lg transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
