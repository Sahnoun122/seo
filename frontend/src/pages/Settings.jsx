import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Key, Shield, Coins, Users, Save, Trash2, Lock,
  Eye, EyeOff, Check, Loader2, Sparkles, Zap, X,
  Globe, Smile, Sliders
} from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import api, { getSettings, updateSettings } from '../lib/api';

export default function Settings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get('tab');

  const [activeTab, setActiveTab] = useState(
    tabParam && ['profile', 'admin'].includes(tabParam) ? tabParam : 'profile'
  );

  useEffect(() => {
    if (tabParam && ['profile', 'admin'].includes(tabParam) && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setSearchParams({ tab: tabName });
  };

  const [loading, setLoading]               = useState(true);
  const [saving, setSaving]                 = useState(false);
  const [userActionLoading, setUserActionLoading] = useState(null);

  const [profileData, setProfileData] = useState({ name: '', email: '', role: 'user', credits: 0 });
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmNewPassword: '' });

  const [contentSettings, setContentSettings] = useState({
    defaultLanguage: 'English',
    defaultTone: 'Professional',
    wpUrl: '',
    wpUsername: '',
    wpApplicationPassword: '',
  });

  const [systemSettings, setSystemSettings] = useState({
    openaiApiKey: '',
    openaiBaseUrl: '',
    defaultModel: '',
    allowUserKeys: true,
    defaultUserCredits: 10,
  });

  const [users, setUsers]               = useState([]);
  const [showGlobalKey, setShowGlobalKey] = useState(false);
  const [editingUser, setEditingUser]   = useState(null);

  useEffect(() => { fetchSettingsData(); }, []);

  const fetchSettingsData = async () => {
    setLoading(true);
    try {
      const settingsRes = await getSettings();
      if (settingsRes.success) {
        setContentSettings({
          defaultLanguage: settingsRes.settings.defaultLanguage || 'English',
          defaultTone:     settingsRes.settings.defaultTone     || 'Professional',
          wpUrl:           settingsRes.settings.wpUrl           || '',
          wpUsername:      settingsRes.settings.wpUsername      || '',
          wpApplicationPassword: settingsRes.settings.wpApplicationPassword || '',
        });
      }

      const res = await api.get('/settings');
      if (res.data.success) {
        const { systemSettings: sys, personalSettings: pers, users: roster } = res.data;
        setProfileData({ name: pers.name || '', email: pers.email || '', role: pers.role || 'user', credits: pers.credits || 0 });
        setSystemSettings({
          openaiApiKey:       sys.openaiApiKey       || '',
          openaiBaseUrl:      sys.openaiBaseUrl       || '',
          defaultModel:       sys.defaultModel        || '',
          allowUserKeys:      sys.allowUserKeys !== false,
          defaultUserCredits: sys.defaultUserCredits ?? 10,
        });
        if (roster) setUsers(roster);
      }
    } catch {
      toast.error('Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = { name: profileData.name, email: profileData.email };

      if (passwordData.newPassword.trim() !== '') {
        if (passwordData.newPassword.length < 6) {
          toast.error('Password must be at least 6 characters.');
          return;
        }
        if (passwordData.newPassword !== passwordData.confirmNewPassword) {
          toast.error('Passwords do not match.');
          return;
        }
        payload.password = passwordData.newPassword;
      }

      const res = await api.put('/settings', payload);
      if (res.data.success) {
        toast.success('Profile updated!');
        setPasswordData({ newPassword: '', confirmNewPassword: '' });
        const { personalSettings: pers } = res.data;
        setProfileData(p => ({ ...p, name: pers.name, email: pers.email }));
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContentSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateSettings(contentSettings);
      if (res.success) toast.success('Preferences saved!');
    } catch {
      toast.error('Failed to save preferences.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGlobalSettings = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await api.put('/settings', { systemSettings });
      if (res.data.success) {
        toast.success('Global settings saved!');
        const { systemSettings: sys } = res.data;
        setSystemSettings({
          openaiApiKey:       sys.openaiApiKey       || '',
          openaiBaseUrl:      sys.openaiBaseUrl       || '',
          defaultModel:       sys.defaultModel        || '',
          allowUserKeys:      sys.allowUserKeys !== false,
          defaultUserCredits: sys.defaultUserCredits ?? 10,
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to save global settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    setUserActionLoading(userId);
    try {
      const res = await api.delete(`/settings/users/${userId}`);
      if (res.data.success) {
        toast.success('User deleted.');
        setUsers(users.filter(u => u._id !== userId));
      }
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to delete user.');
    } finally {
      setUserActionLoading(null);
    }
  };

  const handleUpdateUserInline = async (userId) => {
    if (!editingUser) return;
    setUserActionLoading(userId);
    try {
      const res = await api.put(`/settings/users/${userId}`, { credits: editingUser.credits, role: editingUser.role });
      if (res.data.success) {
        toast.success('User updated!');
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
          <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading settings...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-12">

        {/* Header */}
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-r from-primary-600 to-primary-500 p-8 lg:p-10 text-white shadow-2xl shadow-primary-500/20">
          <div className="absolute top-[-30%] right-[-10%] w-[350px] h-[350px] bg-accent/20 rounded-full blur-[90px]" />
          <div className="relative z-10 space-y-2">
            <h1 className="text-3xl lg:text-4xl font-black tracking-tight flex items-center gap-3">
              <Sparkles className="w-8 h-8 text-accent animate-pulse" />
              Settings
            </h1>
            <p className="text-primary-100 max-w-lg text-sm font-medium">
              Manage your profile, writing preferences, and WordPress integration.
            </p>
          </div>
        </div>

        {/* Tabs */}
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

        {/* Panes */}
        <AnimatePresence mode="wait">

          {/* ── Profile Tab ── */}
          {activeTab === 'profile' && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8">

              <div className="lg:col-span-2 space-y-8">

                {/* Profile form */}
                <form onSubmit={handleSaveProfile} className="premium-card p-8 bg-white space-y-6">
                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4">Personal Information</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="label-xs">Full Name</label>
                      <input type="text" value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        className="input-field" required />
                    </div>
                    <div className="space-y-2">
                      <label className="label-xs">Email Address</label>
                      <input type="email" value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        className="input-field" required />
                    </div>
                  </div>

                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pt-4 pb-4">Change Password</h3>
                  <p className="text-xs text-gray-400 font-medium">Leave blank to keep your current password.</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="label-xs">New Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="password" value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          placeholder="Min 6 characters"
                          className="input-field pl-11" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="label-xs">Confirm Password</label>
                      <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input type="password" value={passwordData.confirmNewPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                          placeholder="Repeat password"
                          className={`input-field pl-11 ${
                            passwordData.confirmNewPassword && passwordData.newPassword !== passwordData.confirmNewPassword
                              ? 'border-red-300 focus:border-red-400' : ''
                          }`} />
                      </div>
                      {passwordData.confirmNewPassword && passwordData.newPassword !== passwordData.confirmNewPassword && (
                        <p className="text-[10px] text-red-500 font-bold flex items-center gap-1">
                          <X className="w-3 h-3" /> Passwords do not match
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={saving} className="btn-primary py-3 px-8 text-xs uppercase tracking-wider">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /><span>Save Profile</span></>}
                    </button>
                  </div>
                </form>

                {/* Content preferences */}
                <form onSubmit={handleSaveContentSettings} className="premium-card p-8 bg-white space-y-6">
                  <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4 flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-primary-500" />
                    Content Preferences
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="label-xs flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Default Language</label>
                      <select value={contentSettings.defaultLanguage}
                        onChange={(e) => setContentSettings({ ...contentSettings, defaultLanguage: e.target.value })}
                        className="input-field">
                        <option value="English">English</option>
                        <option value="French">French (Français)</option>
                        <option value="Spanish">Spanish (Español)</option>
                        <option value="German">German (Deutsch)</option>
                        <option value="Arabic">Arabic (العربية)</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="label-xs flex items-center gap-1.5"><Smile className="w-3.5 h-3.5" /> Default Writing Tone</label>
                      <select value={contentSettings.defaultTone}
                        onChange={(e) => setContentSettings({ ...contentSettings, defaultTone: e.target.value })}
                        className="input-field">
                        <option value="Professional">Professional (Formal & Authoritative)</option>
                        <option value="Informative">Informative (Educational)</option>
                        <option value="Conversational">Conversational (Casual & Friendly)</option>
                        <option value="Persuasive">Persuasive (Marketing & Sales)</option>
                        <option value="Creative">Creative (Original & Unique)</option>
                      </select>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-gray-900 border-b border-gray-100 pt-4 pb-4 flex items-center gap-2">
                    <Globe className="w-5 h-5 text-primary-500" />
                    WordPress 1-Click Publishing
                  </h3>
                  <p className="text-xs text-gray-400 font-medium">Connect your WordPress site to publish articles directly from the generator.</p>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="label-xs">WordPress Site URL</label>
                      <input type="text" value={contentSettings.wpUrl}
                        onChange={(e) => setContentSettings({ ...contentSettings, wpUrl: e.target.value })}
                        placeholder="https://myblog.com" className="input-field" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="label-xs">WP Username</label>
                        <input type="text" value={contentSettings.wpUsername}
                          onChange={(e) => setContentSettings({ ...contentSettings, wpUsername: e.target.value })}
                          placeholder="admin" className="input-field" />
                      </div>
                      <div className="space-y-2">
                        <label className="label-xs">WP Application Password</label>
                        <input type="password" value={contentSettings.wpApplicationPassword}
                          onChange={(e) => setContentSettings({ ...contentSettings, wpApplicationPassword: e.target.value })}
                          placeholder="xxxx xxxx xxxx xxxx" className="input-field font-mono" />
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={saving} className="btn-primary py-3 px-8 text-xs uppercase tracking-wider">
                      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /><span>Save Preferences</span></>}
                    </button>
                  </div>
                </form>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                <div className="bg-[#0f172a] text-white p-8 rounded-2xl shadow-xl space-y-6 relative overflow-hidden border border-gray-800">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary-500/10 rounded-full blur-2xl" />
                  <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary-400">Account Summary</h4>
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Role</p>
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
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Credits</p>
                      <p className="text-xl font-black text-white mt-1.5">
                        {profileData.credits} <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">remaining</span>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ── Admin Tab ── */}
          {activeTab === 'admin' && profileData.role === 'admin' && (
            <motion.div key="admin" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }}
              className="space-y-12">

              {/* Global API config */}
              <form onSubmit={handleSaveGlobalSettings} className="premium-card p-8 bg-white space-y-6">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <h3 className="text-lg font-bold text-gray-900">Global AI Configuration</h3>
                  <span className="text-[9px] font-black uppercase tracking-widest bg-primary-50 text-primary-600 border border-primary-100 px-2.5 py-1 rounded-full">Admin Only</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="label-xs">Global AI API Key</label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type={showGlobalKey ? 'text' : 'password'}
                          value={systemSettings.openaiApiKey}
                          onChange={(e) => setSystemSettings({ ...systemSettings, openaiApiKey: e.target.value })}
                          placeholder="sk-..."
                          className="input-field pl-11 pr-12 font-mono"
                        />
                        <button type="button" onClick={() => setShowGlobalKey(!showGlobalKey)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700">
                          {showGlobalKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-[9px] text-gray-400 font-medium">This key is used for all users. Supports OpenAI, OpenRouter, Groq, DeepSeek.</p>
                    </div>

                    <div className="space-y-2">
                      <label className="label-xs">API Base URL</label>
                      <input type="text" value={systemSettings.openaiBaseUrl}
                        onChange={(e) => setSystemSettings({ ...systemSettings, openaiBaseUrl: e.target.value })}
                        placeholder="https://openrouter.ai/api/v1"
                        className="input-field" />
                      <p className="text-[9px] text-gray-400 font-medium">Leave empty for OpenAI. For OpenRouter: https://openrouter.ai/api/v1</p>
                    </div>

                    <div className="space-y-2">
                      <label className="label-xs">AI Model</label>
                      <input type="text" value={systemSettings.defaultModel}
                        onChange={(e) => setSystemSettings({ ...systemSettings, defaultModel: e.target.value })}
                        placeholder="gpt-4o or meta-llama/llama-3.3-70b-instruct:free"
                        className="input-field" />
                      <p className="text-[9px] text-gray-400 font-medium">Any model compatible with your API provider.</p>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200/30">
                      <div>
                        <p className="text-xs font-bold text-gray-900">Credits System</p>
                        <p className="text-[10px] text-gray-400 font-medium mt-0.5">Users consume credits per generation.</p>
                      </div>
                      <Coins className="w-6 h-6 text-amber-500" />
                    </div>

                    <div className="space-y-2">
                      <label className="label-xs">Default Credits for New Users</label>
                      <input type="number" min="0"
                        value={systemSettings.defaultUserCredits}
                        onChange={(e) => setSystemSettings({ ...systemSettings, defaultUserCredits: Number(e.target.value) })}
                        className="input-field" />
                      <p className="text-[9px] text-gray-400 font-medium">Credits given to each new account on registration.</p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button type="submit" disabled={saving} className="btn-primary py-3 px-8 text-xs uppercase tracking-wider">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /><span>Save Configuration</span></>}
                  </button>
                </div>
              </form>

              {/* User roster */}
              <div className="premium-card p-8 bg-white space-y-6">
                <h3 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary-600" />
                  User Roster & Credit Manager
                </h3>

                <div className="overflow-x-auto rounded-2xl border border-gray-100">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 font-black uppercase tracking-wider text-[10px] border-b border-gray-100">
                        <th className="px-6 py-4">User</th>
                        <th className="px-6 py-4">Role</th>
                        <th className="px-6 py-4">Credits</th>
                        <th className="px-6 py-4">Joined</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {users.map(u => {
                        const isEditing   = editingUser && editingUser._id === u._id;
                        const actionLoading = userActionLoading === u._id;
                        return (
                          <tr key={u._id} className="hover:bg-gray-50/50 transition-colors font-medium text-gray-700">
                            <td className="px-6 py-4">
                              <p className="font-bold text-gray-900 text-sm">{u.name}</p>
                              <p className="text-gray-400 text-xs">{u.email}</p>
                            </td>
                            <td className="px-6 py-4">
                              {isEditing ? (
                                <select value={editingUser.role} onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
                                  className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg font-bold text-xs">
                                  <option value="user">User</option>
                                  <option value="admin">Admin</option>
                                </select>
                              ) : (
                                <span className={`inline-flex px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                  u.role === 'admin' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-primary-50 text-primary-600 border border-primary-100'
                                }`}>{u.role}</span>
                              )}
                            </td>
                            <td className="px-6 py-4">
                              {isEditing ? (
                                <input type="number" min="0" value={editingUser.credits}
                                  onChange={(e) => setEditingUser({ ...editingUser, credits: Number(e.target.value) })}
                                  className="w-20 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-center font-bold" />
                              ) : (
                                <span className="font-bold text-gray-900">{u.credits ?? 0}</span>
                              )}
                            </td>
                            <td className="px-6 py-4 text-gray-400">
                              {new Date(u.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {isEditing ? (
                                  <>
                                    <button onClick={() => handleUpdateUserInline(u._id)} disabled={actionLoading}
                                      className="p-2 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl hover:bg-emerald-100 transition-colors">
                                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                    </button>
                                    <button onClick={() => setEditingUser(null)}
                                      className="p-2 bg-red-50 border border-red-100 text-red-500 rounded-xl hover:bg-red-100 transition-colors">
                                      <X className="w-4 h-4" />
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <button onClick={() => setEditingUser({ _id: u._id, credits: u.credits ?? 0, role: u.role })}
                                      className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-gray-100 transition-colors">
                                      Edit
                                    </button>
                                    <button onClick={() => handleDeleteUser(u._id)} disabled={actionLoading}
                                      className="p-2 bg-gray-50 border border-gray-200 text-gray-400 rounded-xl hover:bg-red-50 hover:text-red-500 hover:border-red-100 transition-colors">
                                      {actionLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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
