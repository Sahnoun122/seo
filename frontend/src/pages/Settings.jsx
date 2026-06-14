import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { User, Save, Lock, Loader2, Globe, Smile, Sliders, X } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import api, { getSettings, updateSettings } from '../lib/api';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  const [profileData, setProfileData] = useState({ name: '', email: '', role: 'user', credits: 0 });
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmNewPassword: '' });
  const [contentSettings, setContentSettings] = useState({
    defaultLanguage: 'English',
    defaultTone: 'Professional',
    wpUrl: '',
    wpUsername: '',
    wpApplicationPassword: '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [settingsRes, profileRes] = await Promise.all([
        getSettings(),
        api.get('/settings'),
      ]);

      if (settingsRes.success) {
        setContentSettings({
          defaultLanguage:      settingsRes.settings.defaultLanguage      || 'English',
          defaultTone:          settingsRes.settings.defaultTone          || 'Professional',
          wpUrl:                settingsRes.settings.wpUrl                || '',
          wpUsername:           settingsRes.settings.wpUsername           || '',
          wpApplicationPassword: settingsRes.settings.wpApplicationPassword || '',
        });
      }

      if (profileRes.data.success) {
        const { personalSettings: pers } = profileRes.data;
        setProfileData({ name: pers.name || '', email: pers.email || '', role: pers.role || 'user', credits: pers.credits || 0 });
      }
    } catch {
      toast.error('Failed to load settings.');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword) {
      if (passwordData.newPassword.length < 6) {
        toast.error('Password must be at least 6 characters.');
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmNewPassword) {
        toast.error('Passwords do not match.');
        return;
      }
    }
    setSaving(true);
    try {
      const payload = { name: profileData.name, email: profileData.email };
      if (passwordData.newPassword) payload.password = passwordData.newPassword;
      const res = await api.put('/settings', payload);
      if (res.data.success) {
        toast.success('Profile updated!');
        setPasswordData({ newPassword: '', confirmNewPassword: '' });
      }
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePreferences = async (e) => {
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-8 animate-fade-in">

        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight">Settings</h1>
          <p className="text-gray-400 text-sm mt-1 font-medium">Manage your account and writing preferences.</p>
        </div>

        {/* Profile */}
        <form onSubmit={handleSaveProfile} className="premium-card bg-white p-8 space-y-6">
          <h2 className="text-base font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-4">
            <User className="w-4 h-4 text-primary-500" />
            Profile Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="label-xs">Full Name</label>
              <input type="text" value={profileData.name}
                onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                className="input-field" required />
            </div>
            <div className="space-y-1.5">
              <label className="label-xs">Email Address</label>
              <input type="email" value={profileData.email}
                onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                className="input-field" required />
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 space-y-1.5">
            <h3 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-gray-400" />
              Change Password
              <span className="text-[10px] font-medium text-gray-400 normal-case">(leave blank to keep current)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="label-xs">New Password</label>
                <input type="password" value={passwordData.newPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                  placeholder="Min 6 characters" className="input-field" />
              </div>
              <div className="space-y-1.5">
                <label className="label-xs">Confirm Password</label>
                <input type="password" value={passwordData.confirmNewPassword}
                  onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                  placeholder="Repeat password"
                  className={`input-field ${
                    passwordData.confirmNewPassword && passwordData.newPassword !== passwordData.confirmNewPassword
                      ? 'border-red-300 focus:border-red-400' : ''
                  }`} />
                {passwordData.confirmNewPassword && passwordData.newPassword !== passwordData.confirmNewPassword && (
                  <p className="text-[10px] text-red-500 font-bold flex items-center gap-1 mt-1">
                    <X className="w-3 h-3" /> Passwords do not match
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /><span>Save Profile</span></>}
            </button>
          </div>
        </form>

        {/* Content Preferences */}
        <form onSubmit={handleSavePreferences} className="premium-card bg-white p-8 space-y-6">
          <h2 className="text-base font-black text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-4">
            <Sliders className="w-4 h-4 text-primary-500" />
            Content Preferences
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="label-xs flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Default Language</label>
              <select value={contentSettings.defaultLanguage}
                onChange={(e) => setContentSettings({ ...contentSettings, defaultLanguage: e.target.value })}
                className="input-field">
                <option value="English">English</option>
                <option value="French">French (Français)</option>
                <option value="Spanish">Spanish (Español)</option>
                <option value="German">German (Deutsch)</option>
                <option value="Arabic">Arabic (العربية)</option>
                <option value="Portuguese">Portuguese (Português)</option>
                <option value="Italian">Italian (Italiano)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="label-xs flex items-center gap-1.5"><Smile className="w-3.5 h-3.5" /> Writing Tone</label>
              <select value={contentSettings.defaultTone}
                onChange={(e) => setContentSettings({ ...contentSettings, defaultTone: e.target.value })}
                className="input-field">
                <option value="Professional">Professional</option>
                <option value="Informative">Informative</option>
                <option value="Conversational">Conversational</option>
                <option value="Persuasive">Persuasive</option>
                <option value="Creative">Creative</option>
              </select>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6 space-y-4">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-2">
              <Globe className="w-4 h-4 text-gray-400" />
              WordPress Publishing
              <span className="text-[10px] font-medium text-gray-400 normal-case">(optional)</span>
            </h3>
            <div className="space-y-1.5">
              <label className="label-xs">Site URL</label>
              <input type="text" value={contentSettings.wpUrl}
                onChange={(e) => setContentSettings({ ...contentSettings, wpUrl: e.target.value })}
                placeholder="https://myblog.com" className="input-field" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div className="space-y-1.5">
                <label className="label-xs">Username</label>
                <input type="text" value={contentSettings.wpUsername}
                  onChange={(e) => setContentSettings({ ...contentSettings, wpUsername: e.target.value })}
                  placeholder="admin" className="input-field" />
              </div>
              <div className="space-y-1.5">
                <label className="label-xs">Application Password</label>
                <input type="password" value={contentSettings.wpApplicationPassword}
                  onChange={(e) => setContentSettings({ ...contentSettings, wpApplicationPassword: e.target.value })}
                  placeholder="xxxx xxxx xxxx xxxx" className="input-field font-mono" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={saving} className="btn-primary">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /><span>Save Preferences</span></>}
            </button>
          </div>
        </form>

      </div>
    </DashboardLayout>
  );
}
