import React from 'react';
import { Sparkles, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-gray-200/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-2 rounded-xl shadow-lg shadow-primary-500/20">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600">
              SEO Gen AI
            </span>
          </div>
          <nav className="flex items-center space-x-6">
            <span className="text-sm font-medium text-gray-600">
              Welcome, <span className="text-gray-900">{user?.name}</span>
            </span>
            <button 
              onClick={handleLogout}
              className="flex items-center text-gray-500 hover:text-red-600 font-medium transition-colors"
            >
              <LogOut className="w-4 h-4 mr-1" />
              Logout
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
