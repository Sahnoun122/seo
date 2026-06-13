import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Key,
  Shield,
  Coins,
  Users,
  Save,
  Trash2,
  Lock,
  Eye,
  EyeOff,
  Check,
  Loader2,
  AlertTriangle,
  Sparkles,
  Zap,
  CheckCircle2,
  X,
  Globe,
  Smile,
  Compass,
  Cpu,
  Sliders
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import api, { getSettings, updateSettings } from '../lib/api';

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');
  
  const [activeTab, setActiveTab] = useState(
    tabParam && ['profile', 'api', 'admin'].includes(tabParam) ? tabParam : 'profile'
  );

  // Sync activeTab state if tab query param changes externally
  useEffect(() => {
    if (tabParam && ['profile', 'api', 'admin'].includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setSearchParams({ tab: tabName });
  };
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userActionLoading, setUserActionLoading] = useState(null); // stores user ID being updated
  
  // Profile (Name/Email) form state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    role: 'user',
    credits: 0
  });

  // Password change state
  const [passwordData, setPasswordData] = useState({
    newPassword: '',
    confirmNewPassword: '',
  });

  // AI & Multi-Model custom API settings (Step 1-3)
  const [aiSettings, setAiSettings] = useState({
    userApiKey: '',
    userBaseUrl: '',
    preferredModel: '',
    defaultLanguage: 'French',
    defaultTone: 'Professional',
    wpUrl: '',
    wpUsername: '',
    wpApplicationPassword: '',
  });

  // Global settings state (Admin only)
  const [systemSettings, setSystemSettings] = useState({
    openaiApiKey: '',
    defaultModel: 'gpt-4o',
    allowUserKeys: true,
    defaultUserCredits: 10,
  });

  // Roster of users (Admin only)
  const [users, setUsers] = useState([]);
  
  // Visibility toggles for keys
  const [showPersonalKey, setShowPersonalKey] = useState(false);
  const [showGlobalKey, setShowGlobalKey] = useState(false);
  
  // Inline editing state for user management
  const [editingUser, setEditingUser] = useState(null); // stores {_id, credits, role}
  
  // Presets mapping
  const presets = {
    openai: {
      name: 'OpenAI',
      userBaseUrl: 'https://api.openai.com/v1',
      preferredModel: 'gpt-4o-mini'
    },
    deepseek: {
      name: 'DeepSeek Chat',
      userBaseUrl: 'https://api.api.deepseek.com/v1',
      preferredModel: 'deepseek-chat'
    },
    groq: {
      name: 'Groq Cloud',
      userBaseUrl: 'https://api.groq.com/openai/v1',
      preferredModel: 'llama-3.3-70b-versatile'
    },
    openrouter: {
      name: 'OpenRouter',
      userBaseUrl: 'https://openrouter.ai/api/v1',
      preferredModel: 'meta-llama/llama-3-8b-instruct:free'
    }
  };

  // Load settings on mount
  useEffect(() => {
    fetchSettingsData();
  }, []);

  const fetchSettingsData = async () => {
    setLoading(true);
    try {
      // 1. Fetch user settings
      const settingsRes = await getSettings();
      if (settingsRes.success) {
        setAiSettings({
          userApiKey: settingsRes.settings.userApiKey || '',
          userBaseUrl: settingsRes.settings.userBaseUrl || '',
          preferredModel: settingsRes.settings.preferredModel || '',
          defaultLanguage: settingsRes.settings.defaultLanguage || 'French',
          defaultTone: settingsRes.settings.defaultTone || 'Professional',
          wpUrl: settingsRes.settings.wpUrl || '',
          wpUsername: settingsRes.settings.wpUsername || '',
          wpApplicationPassword: settingsRes.settings.wpApplicationPassword || '',
        });
      }

      // 2. Fetch profile & system settings (for roster and administration)
      const res = await api.get('/settings');
      if (res.data.success) {
        const { systemSettings: sys, personalSettings: pers, users: usrRoster } = res.data;
        setProfileData({
          name: pers.name || '',
          email: pers.email || '',
          role: pers.role || 'user',
          credits: pers.credits || 0
        });
        
        setSystemSettings({
          openaiApiKey: sys.openaiApiKey || '',
          defaultModel: sys.defaultModel || 'gpt-4o',
          allowUserKeys: sys.allowUserKeys !== false,
          defaultUserCredits: sys.defaultUserCredits !== undefined ? sys.defaultUserCredits : 10,
        });

        if (usrRoster) {
          setUsers(usrRoster);
        }
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings from server.');
    } finally {
      setLoading(false);
    }
  };

  // Applypreset fields helper
  const handleApplyPreset = (key) => {
    const preset = presets[key];
    if (preset) {
      setAiSettings(prev => ({
        ...prev,
        userBaseUrl: preset.userBaseUrl,
        preferredModel: preset.preferredModel
      }));
      toast.success(`Preset loaded: ${preset.name}!`);
    }
  };

  // Save General profile settings (Name, email, password)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        name: profileData.name,
        email: profileData.email,
      };

      if (passwordData.newPassword.trim() !== '') {
        if (passwordData.newPassword.length < 6) {
          toast.error('Password must be at least 6 characters.');
          setSaving(false);
          return;
        }
        if (passwordData.newPassword !== passwordData.confirmNewPassword) {
          toast.error('Passwords do not match.');
          setSaving(false);
          return;
        }
        payload.password = passwordData.newPassword;
      }

      const res = await api.put('/settings', payload);
      if (res.data.success) {
        toast.success('Profile details updated!');
        setPasswordData({ newPassword: '', confirmNewPassword: '' });
        
        const { personalSettings: pers } = res.data;
        setProfileData(prev => ({
          ...prev,
          name: pers.name,
          email: pers.email,
          role: pers.role,
          credits: pers.credits
        }));
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  // Save Custom OpenAI/LLM settings
  const handleSaveAISettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateSettings(aiSettings);
      if (res.success) {
        toast.success('Custom API configurations saved successfully!');
        setAiSettings({
          userApiKey: res.settings.userApiKey || '',
          userBaseUrl: res.settings.userBaseUrl || '',
          preferredModel: res.settings.preferredModel || '',
          defaultLanguage: res.settings.defaultLanguage || 'French',
          defaultTone: res.settings.defaultTone || 'Professional',
          wpUrl: res.settings.wpUrl || '',
          wpUsername: res.settings.wpUsername || '',
          wpApplicationPassword: res.settings.wpApplicationPassword || '',
        });
      }
    } catch (error) {
      toast.error(error.message || 'Failed to update custom API settings.');
    } finally {
      setSaving(false);
    }
  };

  // Save global configs (Admin only)
  const handleSaveGlobalSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/settings', {
        systemSettings
      });
      if (res.data.success) {
        toast.success('Global platform settings updated!');
        const { systemSettings: sys } = res.data;
        setSystemSettings({
          openaiApiKey: sys.openaiApiKey || '',
          defaultModel: sys.defaultModel || 'gpt-4o',
          allowUserKeys: sys.allowUserKeys !== false,
          defaultUserCredits: sys.defaultUserCredits !== undefined ? sys.defaultUserCredits : 10,
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save global configurations.');
    } finally {
      setSaving(false);
    }
  };

  // Delete user roster account
  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? All their generated articles will remain but they will lose access.')) {
      return;
    }
    setUserActionLoading(userId);
    try {
      const res = await api.delete(`/settings/users/${userId}`);
      if (res.data.success) {
        toast.success('User removed from platform.');
        setUsers(users.filter(u => u._id !== userId));
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete user.');
    } finally {
      setUserActionLoading(null);
    }
  };

  // Update inline user credits or role
  const handleUpdateUserInline = async (userId) => {
    if (!editingUser) return;
    setUserActionLoading(userId);
    try {
      const res = await api.put(`/settings/users/${userId}`, {
        credits: editingUser.credits,
        role: editingUser.role
      });
      if (res.data.success) {
        toast.success('User credentials modified!');
        setUsers(users.map(u => u._id === userId ? { ...u, credits: editingUser.credits, role: editingUser.role } : u));
        setEditingUser(null);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update user.');
    } finally {
      setUserActionLoading(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin" />
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Accessing platform configurations...</p>
        </div>
      </DashboardLayout>
    );
  }

  const isUsingPersonalKey = aiSettings.userApiKey && aiSettings.userApiKey.trim() !== '';

  return (
    <DashboardLayout>
      <div className="space-y-12">
        {/* Header Ribbon */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-primary-600 to-primary-500 p-8 lg:p-10 text-white shadow-2xl shadow-primary-500/20">
          <div className="absolute top-[-30%] right-[-10%] w-[350px] h-[350px] bg-accent/20 rounded-full blur-[90px]" />
          <div className="relative z-10 space-y-2">
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-accent animate-pulse" />
              Settings & Integrations
            </h1>
            <p className="text-primary-100 max-w-lg text-sm font-medium">
              Configure personal profile variables, integrate custom AI endpoints (DeepSeek, Groq, OpenRouter), or handle team rosters.
            </p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex flex-wrap p-1.5 bg-gray-100/85 backdrop-blur-md rounded-2xl w-fit border border-gray-200/50 gap-2">
          <button
            onClick={() => handleTabChange('profile')}
            className={`flex items-center space-x-2.5 px-6 py-3 rounded-xl text-xs font-black transition-all duration-300 ${
              activeTab === 'profile'
                ? 'bg-white text-gray-900 shadow-xl shadow-gray-200/50 scale-[1.02]'
                : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            <User className={`w-4 h-4 ${activeTab === 'profile' ? 'text-primary-600' : ''}`} />
            <span className="uppercase tracking-wider">My Profile</span>
          </button>
          
          <button
            onClick={() => handleTabChange('api')}
            className={`flex items-center space-x-2.5 px-6 py-3 rounded-xl text-xs font-black transition-all duration-300 ${
              activeTab === 'api'
                ? 'bg-white text-gray-900 shadow-xl shadow-gray-200/50 scale-[1.02]'
                : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
            }`}
          >
            <Cpu className={`w-4 h-4 ${activeTab === 'api' ? 'text-primary-600' : ''}`} />
            <span className="uppercase tracking-wider">AI API & Presets</span>
          </button>

          {profileData.role === 'admin' && (
            <button
              onClick={() => handleTabChange('admin')}
              className={`flex items-center space-x-2.5 px-6 py-3 rounded-xl text-xs font-black transition-all duration-300 ${
                activeTab === 'admin'
                  ? 'bg-white text-gray-900 shadow-xl shadow-gray-200/50 scale-[1.02]'
                  : 'text-gray-500 hover:text-gray-800 hover:bg-white/50'
              }`}
            >
              <Shield className={`w-4 h-4 ${activeTab === 'admin' ? 'text-primary-600' : ''}`} />
              <span className="uppercase tracking-wider">Admin Panel</span>
            </button>
          )}
        </div>

        {/* Tab display pane */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              <div className="lg:col-span-2 space-y-8">
                <form onSubmit={handleSaveProfile} className="premium-card p-8 bg-white space-y-6">
                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">Personal Profile Details</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Full Name</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200/70 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
                      <input
                        type="email"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200/70 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                        required
                      />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pt-6 pb-4">Update Password</h3>
                  <p className="text-xs text-gray-400 font-medium">Leave this blank if you do not want to alter your current password.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="password"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          placeholder="Min 6 characters"
                          className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200/70 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="password"
                          value={passwordData.confirmNewPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                          placeholder="Repeat password"
                          className={`w-full pl-11 pr-4 py-3 bg-gray-50 border rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-4 transition-all ${
                            passwordData.confirmNewPassword && passwordData.newPassword !== passwordData.confirmNewPassword
                              ? 'border-red-300 focus:ring-red-500/10 focus:border-red-400'
                              : 'border-gray-200/70 focus:ring-primary-500/10 focus:border-primary-500'
                          }`}
                        />
                      </div>
                      {passwordData.confirmNewPassword && passwordData.newPassword !== passwordData.confirmNewPassword && (
                        <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                          <X className="w-3 h-3" /> Passwords do not match
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="submit"
                      disabled={saving}
                      className="btn-primary flex items-center space-x-2 py-3 px-8 text-xs font-bold uppercase tracking-wider"
                    >
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /><span>Save Settings</span></>}
                    </button>
                  </div>
                </form>
              </div>

              {/* Status side information */}
              <div className="space-y-6">
                <div className="bg-[#0f172a] text-white p-8 rounded-2xl shadow-xl space-y-6 relative overflow-hidden border border-gray-800">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl" />
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary-400">Account Summary</h4>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">System Role</p>
                      <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider mt-1.5 ${
                        profileData.role === 'admin' 
                          ? 'bg-accent/10 text-accent border border-accent/20' 
                          : 'bg-primary-500/10 text-primary-400 border border-primary-500/20'
                      }`}>
                        {profileData.role}
                      </span>
                    </div>

                    <div className="h-px bg-gray-800/60" />

                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Credits Balance</p>
                      {isUsingPersonalKey ? (
                        <p className="text-base font-black text-accent mt-1.5 tracking-tight flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-accent animate-pulse" />
                          UNLIMITED
                          <span className="text-[10px] font-black text-gray-400 tracking-normal block">(Personal key set)</span>
                        </p>
                      ) : (
                        <p className="text-xl font-black text-white mt-1.5 tracking-tight">
                          {profileData.credits} <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">remaining</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'api' && (
            <motion.div
              key="api"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Dynamic Preset Form Card */}
              <div className="lg:col-span-2 space-y-8">
                <form onSubmit={handleSaveAISettings} className="premium-card p-8 bg-white space-y-8">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">AI API Settings & Multi-Model Engine</h3>
                      <p className="text-xs text-gray-400 mt-1 font-medium">Bypass credit restrictions by configuring your own LLM API Key.</p>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 px-2.5 py-1 rounded-full">SaaS Unlimited</span>
                  </div>

                  {!systemSettings.allowUserKeys && profileData.role !== 'admin' ? (
                    <div className="bg-amber-50 border border-amber-200 text-amber-800 p-4 rounded-xl flex items-start space-x-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-xs">
                        <p className="font-bold">Personal API Keys Disabled</p>
                        <p className="mt-1 font-medium text-amber-700 leading-relaxed">
                          The system administrator has restricted models to global accounts. You will consume standard balance credits when generating articles.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Presets Grid */}
                      <div className="space-y-3">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Quick Presets Grid</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <button
                            type="button"
                            onClick={() => handleApplyPreset('openai')}
                            className="p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl font-bold text-xs text-gray-700 hover:text-gray-950 flex flex-col items-center justify-center gap-1.5 transition-all"
                          >
                            <span className="text-primary-600 font-extrabold text-sm">OpenAI</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleApplyPreset('deepseek')}
                            className="p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl font-bold text-xs text-gray-700 hover:text-gray-950 flex flex-col items-center justify-center gap-1.5 transition-all"
                          >
                            <span className="text-accent font-extrabold text-sm">DeepSeek</span>
                          </button>
                          
                          <button
                            type="button"
                            onClick={() => handleApplyPreset('groq')}
                            className="p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl font-bold text-xs text-gray-700 hover:text-gray-950 flex flex-col items-center justify-center gap-1.5 transition-all"
                          >
                            <span className="text-orange-500 font-extrabold text-sm">Groq</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleApplyPreset('openrouter')}
                            className="p-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl font-bold text-xs text-gray-700 hover:text-gray-950 flex flex-col items-center justify-center gap-1.5 transition-all"
                          >
                            <span className="text-purple-600 font-extrabold text-sm">OpenRouter</span>
                          </button>
                        </div>
                      </div>

                      {/* API Credentials Input Form */}
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Private API Key</label>
                          <div className="relative">
                            <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                              type={showPersonalKey ? 'text' : 'password'}
                              value={aiSettings.userApiKey}
                              onChange={(e) => setAiSettings({ ...aiSettings, userApiKey: e.target.value })}
                              placeholder="sk-..."
                              className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200/70 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-mono"
                            />
                            <button
                              type="button"
                              onClick={() => setShowPersonalKey(!showPersonalKey)}
                              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                            >
                              {showPersonalKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Custom Base URL</label>
                            <input
                              type="text"
                              value={aiSettings.userBaseUrl}
                              onChange={(e) => setAiSettings({ ...aiSettings, userBaseUrl: e.target.value })}
                              placeholder="https://api.openai.com/v1"
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200/70 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Custom Model Name</label>
                            <input
                              type="text"
                              value={aiSettings.preferredModel}
                              onChange={(e) => setAiSettings({ ...aiSettings, preferredModel: e.target.value })}
                              placeholder="gpt-4o or deepseek-chat"
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200/70 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Content generation preferences */}
                      <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pt-6 pb-2 flex items-center gap-2">
                        <Sliders className="w-4.5 h-4.5 text-primary-500" />
                        <span>Default Content Preferences</span>
                      </h3>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Globe className="w-3.5 h-3.5 text-gray-400" />
                            <span>Default Language</span>
                          </label>
                          <select
                            value={aiSettings.defaultLanguage}
                            onChange={(e) => setAiSettings({ ...aiSettings, defaultLanguage: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200/70 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                          >
                            <option value="French">French (Français)</option>
                            <option value="English">English</option>
                            <option value="Spanish">Spanish (Español)</option>
                            <option value="German">German (Deutsch)</option>
                            <option value="Arabic">Arabic (العربية)</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Smile className="w-3.5 h-3.5 text-gray-400" />
                            <span>Default Writing Tone</span>
                          </label>
                          <select
                            value={aiSettings.defaultTone}
                            onChange={(e) => setAiSettings({ ...aiSettings, defaultTone: e.target.value })}
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200/70 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                          >
                            <option value="Professional">Professional (Formal & Authoritative)</option>
                            <option value="Informative">Informative (Educational)</option>
                            <option value="Conversational">Conversational (Casual & Friendly)</option>
                            <option value="Persuasive">Persuasive (Marketing & Sales)</option>
                            <option value="Creative">Creative (Original & Unique)</option>
                          </select>
                        </div>
                      </div>
 
                      {/* WordPress 1-Click Publishing Settings */}
                      <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pt-8 pb-2 flex items-center gap-2">
                        <Globe className="w-4.5 h-4.5 text-primary-500" />
                        <span>WordPress 1-Click Publishing</span>
                      </h3>
                      <p className="text-xs text-gray-400 font-medium">
                        Configure your WordPress site parameters to enable instant, 1-click article publishing straight from the generator panel.
                      </p>
                      
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">WordPress Blog URL</label>
                          <input
                            type="text"
                            value={aiSettings.wpUrl}
                            onChange={(e) => setAiSettings({ ...aiSettings, wpUrl: e.target.value })}
                            placeholder="https://myblog.com"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200/70 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">WP Username</label>
                            <input
                              type="text"
                              value={aiSettings.wpUsername}
                              onChange={(e) => setAiSettings({ ...aiSettings, wpUsername: e.target.value })}
                              placeholder="admin"
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200/70 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">WP Application Password</label>
                            <input
                              type="password"
                              value={aiSettings.wpApplicationPassword}
                              onChange={(e) => setAiSettings({ ...aiSettings, wpApplicationPassword: e.target.value })}
                              placeholder="xxxx xxxx xxxx xxxx"
                              className="w-full px-4 py-3 bg-gray-50 border border-gray-200/70 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-mono"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 flex justify-end">
                        <button
                          type="submit"
                          disabled={saving}
                          className="btn-primary flex items-center space-x-2 py-3 px-8 text-xs font-bold uppercase tracking-wider"
                        >
                          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /><span>Save API Settings</span></>}
                        </button>
                      </div>
                    </>
                  )}
                </form>
              </div>

              {/* API settings sidebar help */}
              <div className="space-y-6">
                <div className="premium-card p-6 bg-white space-y-6">
                  <h4 className="text-xs font-black uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <Compass className="w-4.5 h-4.5 text-primary-500 animate-spin-slow" />
                    Key Integration Manual
                  </h4>
                  
                  <div className="space-y-4 text-xs">
                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600 shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">Dynamic Key Precedence</p>
                        <p className="text-gray-400 mt-1 font-medium leading-relaxed">
                          Your personal credentials are prioritized immediately. If you configure a key, you stop consuming your platform credit limits.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="p-2 bg-primary-50 rounded-lg text-primary-600 shrink-0">
                        <Check className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">Custom Base URLs</p>
                        <p className="text-gray-400 mt-1 font-medium leading-relaxed">
                          Base URL redirects API calls to any standard-compliant OpenAI router (like DeepSeek, Groq, or OpenRouter) smoothly.
                        </p>
                      </div>
                    </div>

                    {isUsingPersonalKey && (
                      <div className="p-4 bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-xl flex items-center space-x-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 animate-bounce" />
                        <p className="text-[10px] font-black uppercase tracking-wider leading-none">Unlimited SaaS Mode Enabled</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'admin' && profileData.role === 'admin' && (
            <motion.div
              key="admin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-12"
            >
              {/* Global system Settings Card */}
              <form onSubmit={handleSaveGlobalSettings} className="premium-card p-8 bg-white space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <h3 className="text-lg font-bold text-gray-900">Global Administration Settings</h3>
                  <span className="text-[9px] font-black uppercase tracking-widest bg-primary-50 text-primary-600 border border-primary-100 px-2.5 py-1 rounded-full">Owner Access</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global OpenAI API Key</label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showGlobalKey ? 'text' : 'password'}
                          value={systemSettings.openaiApiKey}
                          onChange={(e) => setSystemSettings({ ...systemSettings, openaiApiKey: e.target.value })}
                          placeholder="System sk-..."
                          className="w-full pl-11 pr-12 py-3 bg-gray-50 border border-gray-200/70 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setShowGlobalKey(!showGlobalKey)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                        >
                          {showGlobalKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[9px] text-gray-400 font-medium">Platform default key. Used when users don't set a personal key.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Default Model</label>
                      <select
                        value={systemSettings.defaultModel}
                        onChange={(e) => setSystemSettings({ ...systemSettings, defaultModel: e.target.value })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200/70 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                      >
                        <option value="gpt-4o">GPT-4o (Premium quality, deep semantic analysis)</option>
                        <option value="gpt-4o-mini">GPT-4o-Mini (Recommended default, cost efficient)</option>
                        <option value="gpt-3.5-turbo">GPT-3.5-Turbo (Economic standard)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200/30">
                      <div>
                        <p className="text-xs font-bold text-gray-900">Allow User-Provided API Keys</p>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5 max-w-xs">Permit end-users to input their own keys in their profile settings.</p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={systemSettings.allowUserKeys}
                          onChange={(e) => setSystemSettings({ ...systemSettings, allowUserKeys: e.target.checked })}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                      </label>
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Default Credits for Signups</label>
                      <input
                        type="number"
                        min="0"
                        value={systemSettings.defaultUserCredits}
                        onChange={(e) => setSystemSettings({ ...systemSettings, defaultUserCredits: Number(e.target.value) })}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200/70 rounded-xl text-sm font-semibold text-gray-900 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 transition-all"
                      />
                      <p className="text-[9px] text-gray-400 font-medium">Credits immediately assigned to newly registered accounts.</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary flex items-center space-x-2 py-3 px-8 text-xs font-bold uppercase tracking-wider"
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /><span>Save Global Settings</span></>}
                  </button>
                </div>
              </form>

              {/* User management and credit Roster */}
              <div className="premium-card p-8 bg-white space-y-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4 flex items-center space-x-2.5">
                  <Users className="w-5 h-5 text-primary-600" />
                  <span>User Roster & Credit Manager</span>
                </h3>

                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 font-black uppercase tracking-wider text-[10px] border-b border-gray-100">
                        <th className="px-6 py-4">User Details</th>
                        <th className="px-6 py-4">Role Status</th>
                        <th className="px-6 py-4">Credits Balance</th>
                        <th className="px-6 py-4">Registration Date</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map(u => {
                        const isEditing = editingUser && editingUser._id === u._id;
                        const actionLoading = userActionLoading === u._id;
                        const hasCustomKey = u.settings && u.settings.userApiKey && u.settings.userApiKey.trim() !== '';

                        return (
                          <tr key={u._id} className="hover:bg-gray-50/50 transition-colors font-medium text-gray-700">
                            {/* User details */}
                            <td className="px-6 py-4">
                              <div>
                                <p className="font-bold text-gray-900 text-sm">{u.name}</p>
                                <p className="text-gray-400 mt-0.5 text-xs font-semibold">{u.email}</p>
                              </div>
                            </td>
                            
                            {/* Role */}
                            <td className="px-6 py-4">
                              {isEditing ? (
                                <select
                                  value={editingUser.role}
                                  onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                  className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg font-bold text-xs"
                                >
                                  <option value="user">User</option>
                                  <option value="admin">Admin</option>
                                </select>
                              ) : (
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  u.role === 'admin' 
                                    ? 'bg-accent/10 text-accent border border-accent/15' 
                                    : 'bg-primary-50 text-primary-600 border border-primary-100'
                                }`}>
                                  {u.role}
                                </span>
                              )}
                            </td>

                            {/* Credits */}
                            <td className="px-6 py-4">
                              {isEditing ? (
                                <input
                                  type="number"
                                  min="0"
                                  value={editingUser.credits}
                                  onChange={(e) => setEditingUser({ ...editingUser, credits: Number(e.target.value) })}
                                  className="w-20 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-center font-bold"
                                />
                              ) : (
                                <p className="font-bold text-gray-900 text-sm">
                                  {hasCustomKey ? (
                                    <span className="text-emerald-600 flex items-center gap-1">
                                      <Zap className="w-3.5 h-3.5 shrink-0 animate-pulse" />
                                      Unlimited
                                    </span>
                                  ) : (
                                    `${u.credits || 0} remaining`
                                  )}
                                </p>
                              )}
                            </td>

                            {/* Created at */}
                            <td className="px-6 py-4 text-gray-400">
                              {new Date(u.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                            </td>

                            {/* Actions */}
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end space-x-2.5">
                                {isEditing ? (
                                  <>
                                    <button
                                      onClick={() => handleUpdateUserInline(u._id)}
                                      disabled={actionLoading}
                                      className="p-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 text-emerald-600 rounded-xl transition-all shadow-sm shadow-emerald-500/5"
                                    >
                                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    </button>
                                    <button
                                      onClick={() => setEditingUser(null)}
                                      disabled={actionLoading}
                                      className="p-2 bg-red-50 hover:bg-red-100 border border-red-100 text-red-500 rounded-xl transition-all"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => setEditingUser({ _id: u._id, credits: u.credits || 0, role: u.role })}
                                      className="px-3.5 py-2 bg-gray-50 border border-gray-200 hover:bg-gray-100 hover:text-gray-950 text-gray-600 rounded-xl font-bold uppercase tracking-wider text-[10px] transition-all"
                                    >
                                      Edit
                                    </button>
                                    
                                    <button
                                      onClick={() => handleDeleteUser(u._id)}
                                      disabled={actionLoading}
                                      className="p-2.5 bg-gray-50 border border-gray-200 hover:bg-red-50 hover:border-red-100 text-gray-400 hover:text-red-500 rounded-xl transition-all"
                                    >
                                      {actionLoading ? <Loader2 className="w-4.5 h-4.5 animate-spin" /> : <Trash2 className="w-4.5 h-4.5" />}
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </DashboardLayout>
  );
}
