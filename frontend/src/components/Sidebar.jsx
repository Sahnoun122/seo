import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  History,
  Settings,
  LogOut,
  Sparkles,
  ChevronRight,
  X,
  Users
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
  { icon: History, label: 'History', path: '/history' },
  { icon: Settings, label: 'Settings', path: '/settings' },
];

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    onClose?.();
    logout();
    navigate('/login');
  };

  return (
    <aside className={`
      fixed inset-y-0 left-0 h-screen w-72 bg-sidebar border-r border-gray-100 flex flex-col z-50
      transition-transform duration-300 ease-in-out transform
      lg:translate-x-0
      ${isOpen ? 'translate-x-0' : '-translate-x-full'}
    `}>
      <div className="p-8 flex-1 flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-br from-primary-600 to-primary-500 p-2.5 rounded-xl shadow-lg shadow-primary-500/20">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">SEO Gen AI</span>
          </div>
          <button 
            onClick={onClose}
            className="lg:hidden p-2 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group
                ${isActive
                  ? 'bg-primary-50 text-primary-600 shadow-sm shadow-primary-500/5'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
              `}
            >
              <div className="flex items-center space-x-3">
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </div>
              <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            </NavLink>
          ))}
          {user?.role === 'admin' && (
            <>
              <div className="pt-4 mt-4 border-t border-gray-100">
                <p className="px-4 text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Administration</p>
                <NavLink
                  to="/admin/users"
                  onClick={onClose}
                  className={({ isActive }) => `
                    flex items-center justify-between px-4 py-3.5 rounded-xl transition-all duration-200 group
                    ${isActive
                      ? 'bg-red-50 text-red-600 shadow-sm shadow-red-500/5'
                      : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}
                  `}
                >
                  <div className="flex items-center space-x-3">
                    <Users className={`w-5 h-5 ${location.pathname === '/admin/users' ? 'text-red-600' : ''}`} />
                    <span className={`font-medium ${location.pathname === '/admin/users' ? 'text-red-600' : ''}`}>Super Admin</span>
                  </div>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                </NavLink>
              </div>
            </>
          )}
        </nav>
      </div>

      <div className="mt-auto p-6 space-y-4">
        <div 
          onClick={() => {
            onClose?.();
            navigate('/settings?tab=profile');
          }}
          className="bg-gray-50 hover:bg-gray-100/80 active:scale-[0.98] rounded-2xl p-4 flex items-center space-x-3 border border-gray-100 cursor-pointer transition-all group"
          title="Mon profil & Réglages"
        >
          <div className="w-10 h-10 rounded-full bg-primary-100 group-hover:bg-primary-200 flex items-center justify-center text-primary-600 font-bold transition-colors">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-primary-600 transition-colors">{user?.name}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center space-x-3 px-4 py-3.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all duration-200 group cursor-pointer"
        >
          <LogOut className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </aside>
  );
}
