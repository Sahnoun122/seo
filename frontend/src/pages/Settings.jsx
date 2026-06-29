import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { User, Save, Lock, Loader2, Globe, Smile, Sliders, X, Brain, FileText } from 'lucide-react';
import DashboardLayout from '../components/DashboardLayout';
import SubscriptionCard from '../components/SubscriptionCard';
import api, { getSettings, updateSettings } from '../lib/api';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { Card, CardHeader, CardContent, CardFooter } from '../components/ui/Card';

export default function Settings() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  const [profileData, setProfileData] = useState({ name: '', email: '', role: 'user', credits: 0 });
  const [passwordData, setPasswordData] = useState({ newPassword: '', confirmNewPassword: '' });
  const [contentSettings, setContentSettings] = useState({
    defaultLanguage: 'English',
    defaultTone: 'Professional',
    preferredModel: 'gpt-4o',
    wpUrl: '',
    wpUsername: '',
    wpApplicationPassword: '',
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const settingsRes = await getSettings();

      if (settingsRes.success) {
        const userSettings = settingsRes.personalSettings?.settings || {};
        setContentSettings({
          defaultLanguage:      userSettings.defaultLanguage      || 'English',
          defaultTone:          userSettings.defaultTone          || 'Professional',
          preferredModel:       userSettings.preferredModel       || 'gpt-4o',
          wpUrl:                userSettings.wpUrl                || '',
          wpUsername:           userSettings.wpUsername           || '',
          wpApplicationPassword: userSettings.wpApplicationPassword || '',
        });

        const pers = settingsRes.personalSettings || {};
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
      if (passwordData.newPassword.length < 8) {
        toast.error(t('settings.passwordMin8'));
        return;
      }
      if (!/[A-Z]/.test(passwordData.newPassword)) {
        toast.error(t('settings.passwordUppercase'));
        return;
      }
      if (!/[0-9]/.test(passwordData.newPassword)) {
        toast.error(t('settings.passwordNumber'));
        return;
      }
      if (passwordData.newPassword !== passwordData.confirmNewPassword) {
        toast.error(t('settings.passwordMismatch'));
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
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">{t('settings.title')}</h1>
          <p className="text-gray-400 text-sm mt-1 font-medium">{t('settings.subtitle')}</p>
        </div>

        {/* Profile */}
        <Card>
          <form onSubmit={handleSaveProfile}>
            <CardHeader 
              icon={User} 
              title={t('settings.sections.profile')} 
              className="border-b border-gray-100 dark:border-gray-800"
            />
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <Input 
                  label={t('settings.profile.name')} 
                  value={profileData.name}
                  onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                  required 
                />
                <Input 
                  label={t('settings.profile.email')} 
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                  required 
                />
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-1.5">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
                  <Lock className="w-4 h-4 text-gray-400" />
                  {t('settings.profile.password')}
                  <span className="text-[10px] font-medium text-gray-400 normal-case">({t('settings.profile.passwordPlaceholder')})</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input 
                    label={t('settings.profile.password')} 
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    placeholder="Min 8 chars, 1 uppercase, 1 number"
                  />
                  <Input 
                    label={t('auth.resetPassword.confirm')} 
                    type="password"
                    value={passwordData.confirmNewPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmNewPassword: e.target.value })}
                    placeholder="Repeat password"
                    error={passwordData.confirmNewPassword && passwordData.newPassword !== passwordData.confirmNewPassword ? 'Passwords do not match' : null}
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-end bg-transparent pt-2">
              <Button type="submit" isLoading={saving} icon={Save}>
                {t('common.save')}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Content Preferences */}
        <Card>
          <form onSubmit={handleSavePreferences}>
            <CardHeader 
              icon={Sliders} 
              title={t('settings.sections.preferences')} 
            />
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="label-xs flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> {t('settings.preferences.language')}</label>
                  <select value={contentSettings.defaultLanguage}
                    onChange={(e) => setContentSettings({ ...contentSettings, defaultLanguage: e.target.value })}
                    className="w-full py-3 px-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white dark:focus:bg-gray-900 transition-all duration-200">
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
                  <label className="label-xs flex items-center gap-1.5"><Smile className="w-3.5 h-3.5" /> {t('settings.preferences.tone')}</label>
                  <select value={contentSettings.defaultTone}
                    onChange={(e) => setContentSettings({ ...contentSettings, defaultTone: e.target.value })}
                    className="w-full py-3 px-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white dark:focus:bg-gray-900 transition-all duration-200">
                    <option value="Professional">Professional</option>
                    <option value="Informative">Informative</option>
                    <option value="Conversational">Conversational</option>
                    <option value="Persuasive">Persuasive</option>
                    <option value="Creative">Creative</option>
                  </select>
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="label-xs flex items-center gap-1.5"><Brain className="w-3.5 h-3.5" /> {t('settings.ai.model')}</label>
                  <select value={contentSettings.preferredModel}
                    onChange={(e) => setContentSettings({ ...contentSettings, preferredModel: e.target.value })}
                    className="w-full py-3 px-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-medium text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-4 focus:ring-primary-500/10 focus:border-primary-500 focus:bg-white dark:focus:bg-gray-900 transition-all duration-200">
                    <option value="gpt-4o">GPT-4o (Most Capable)</option>
                    <option value="gpt-4o-mini">GPT-4o Mini (Faster & Cheaper)</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Legacy Fast)</option>
                  </select>
                  <p className="text-[10px] text-gray-500 mt-1 pl-1">Note: Availability depends on the administrator's global configuration or your own API key.</p>
                </div>
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 pt-6 space-y-4">
                <h3 className="text-sm font-bold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-gray-400" />
                  {t('settings.sections.wordpress')}
                </h3>
                <Input 
                  label={t('settings.wordpress.url')} 
                  value={contentSettings.wpUrl}
                  onChange={(e) => setContentSettings({ ...contentSettings, wpUrl: e.target.value })}
                  placeholder="https://myblog.com" 
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input 
                    label={t('settings.wordpress.username')} 
                    value={contentSettings.wpUsername}
                    onChange={(e) => setContentSettings({ ...contentSettings, wpUsername: e.target.value })}
                    placeholder="admin" 
                  />
                  <Input 
                    label={t('settings.wordpress.password')} 
                    type="password"
                    value={contentSettings.wpApplicationPassword}
                    onChange={(e) => setContentSettings({ ...contentSettings, wpApplicationPassword: e.target.value })}
                    placeholder="xxxx xxxx xxxx xxxx" 
                    className="font-mono" 
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-end bg-transparent pt-2">
              <Button type="submit" isLoading={saving} icon={Save}>
                {t('common.save')}
              </Button>
            </CardFooter>
          </form>
        </Card>

        {/* Subscription management */}
        <SubscriptionCard />

      </div>
    </DashboardLayout>
  );
}
