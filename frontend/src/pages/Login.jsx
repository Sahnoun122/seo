import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { LogIn, Sparkles, ArrowRight, Zap, Shield, Globe, Brain } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

export default function Login() {
  const { t } = useTranslation();

  const features = [
    { icon: Brain,  title: t('auth.loginPage.feature1Title'), desc: t('auth.loginPage.feature1Desc') },
    { icon: Globe,  title: t('auth.loginPage.feature2Title'), desc: t('auth.loginPage.feature2Desc') },
    { icon: Zap,    title: t('auth.loginPage.feature3Title'), desc: t('auth.loginPage.feature3Desc') },
    { icon: Shield, title: t('auth.loginPage.feature4Title'), desc: t('auth.loginPage.feature4Desc') },
  ];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success(t('auth.login.title'));
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || t('auth.login.invalidCredentials'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative items-center justify-center overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 40%, #6d28d9 100%)' }}>

        {/* Decorative orbs */}
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 orb orb-pink opacity-30" />
        <div className="absolute bottom-[-5%] left-[-5%] w-80 h-80 orb orb-blue opacity-25" />

        {/* Dot grid */}
        <div className="absolute inset-0 bg-dots opacity-[0.06]" />

        <div className="relative z-10 p-16 max-w-xl w-full">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>

            {/* Logo */}
            <Link to="/welcome" className="flex items-center gap-3 mb-12 w-fit">
              <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-xl border border-white/20">
                <Sparkles className="w-7 h-7 text-primary-200" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">SEO Gen AI</span>
            </Link>

            {/* Headline */}
            <h1 className="text-5xl font-extrabold text-white leading-[1.1] mb-4 tracking-tight">
              {t('auth.loginPage.headline')}
              <br />
              <span className="text-primary-300">{t('auth.loginPage.headlineHighlight')}</span>
            </h1>
            <p className="text-primary-200/80 text-base font-medium mb-12 leading-relaxed">
              {t('auth.loginPage.tagline')}
            </p>

            {/* Feature list */}
            <div className="space-y-4">
              {features.map((f, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                  className="flex items-start gap-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-4"
                >
                  <div className="bg-primary-500/20 p-2 rounded-xl shrink-0">
                    <f.icon className="w-4 h-4 text-primary-300" />
                  </div>
                  <div>
                    <p className="text-white font-bold text-sm">{f.title}</p>
                    <p className="text-primary-200/70 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

          </motion.div>
        </div>
      </div>

      {/* ── Right panel (form) ── */}
      <div className="w-full lg:w-[48%] flex items-center justify-center p-6 sm:p-8 lg:p-14 bg-white dark:bg-gray-900 min-h-screen lg:min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          {/* Mobile logo */}
          <Link to="/welcome" className="flex lg:hidden items-center gap-2.5 mb-8 sm:mb-10 w-fit">
            <div className="bg-primary-600 p-2 rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">SEO Gen AI</span>
          </Link>

          <div className="mb-7 sm:mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">{t('auth.login.title')}</h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm sm:text-base">{t('auth.login.subtitle')}</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="label-xs" htmlFor="email">{t('auth.login.email')}</label>
              <input
                id="email"
                type="email"
                required
                className="input-field"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="label-xs" htmlFor="password">{t('auth.login.password')}</label>
                <Link to="/forgot-password" className="text-[10px] font-bold text-primary-600 hover:text-primary-700 uppercase tracking-wider">
                  {t('auth.login.forgot')}
                </Link>
              </div>
              <input
                id="password"
                type="password"
                required
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3.5 mt-2 text-sm"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>{t('auth.login.submit')}</span>
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 mt-8">
            {t('auth.login.noAccount')}{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-bold underline underline-offset-4 decoration-2">
              {t('auth.login.register')}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
