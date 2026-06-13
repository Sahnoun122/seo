import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, History, Settings, LogOut,
  Sparkles, ChevronRight, X, Users, Zap, Coins
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: History,         label: 'History',   path: '/history' },
  { icon: Settings,        label: 'Settings',  path: '/settings' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    onClose?.();
    logout();
    navigate('/login');
  };

  const hasPersonalKey = user?.settings?.userApiKey && user.settings.userApiKey.trim() !== '';
  const credits = user?.credits ?? 0;

  return (
    <aside className={`
      fixed inset-y-0 left-0 h-screen w-72 bg-white border-r border-gray-100 flex flex-col z-50
      transition-transform duration-300 ease-in-out
      lg:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}
    style={{ boxShadow: '4px 0 24px rgba(0,0,0,0.04)' }}
    >
      {/* ── Logo ── */}
      <div className="px-6 py-6 flex items-center justify-between border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-extrabold tracking-tight text-gray-900">SEO Gen AI</span>
        </div>
        <button
          onClick={onClose}
          className="lg:hidden p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
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
                <p className="text-[10px] font-black text-primary-600 uppercase tracking-widest">Credits</p>
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
              <span className="text-sm">{item.label}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
          </NavLink>
        ))}

        {user?.role === 'admin' && (
          <div className="pt-3 mt-3 border-t border-gray-100">
            <p className="px-4 text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Administration</p>
            <NavLink
              to="/admin/users"
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group font-medium text-sm
                ${isActive ? 'text-red-600 bg-red-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'}
              `}
            >
              <div className="flex items-center gap-3">
                <Users className="w-4.5 h-4.5" />
                <span>Admin Panel</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-60 transition-opacity" />
            </NavLink>
          </div>
        )}
      </nav>

      {/* ── User section ── */}
      <div className="px-4 pb-4 pt-2 border-t border-gray-100 space-y-1">
        <button
          onClick={() => { onClose?.(); navigate('/settings?tab=profile'); }}
          className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-all group cursor-pointer"
          title="My Profile & Settings"
        >
          <div className="w-9 h-9 rounded-full bg-primary-100 group-hover:bg-primary-200 flex items-center justify-center text-primary-700 font-black text-sm transition-colors shrink-0">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">{user?.name}</p>
            <p className="text-xs text-gray-400 truncate">{user?.email}</p>
          </div>
        </button>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all group cursor-pointer text-sm font-medium"
        >
          <LogOut className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
