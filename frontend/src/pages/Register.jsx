import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { UserPlus, Sparkles, ArrowRight, CheckCircle2, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';

function getPasswordStrength(pwd) {
  if (!pwd) return { score: 0, key: '', color: '' };
  let score = 0;
  if (pwd.length >= 8) score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;
  if (score <= 1) return { score, key: 'weak',      color: 'bg-red-500'    };
  if (score <= 2) return { score, key: 'fair',      color: 'bg-amber-500'  };
  if (score <= 3) return { score, key: 'good',      color: 'bg-yellow-400' };
  if (score <= 4) return { score, key: 'strong',    color: 'bg-emerald-500' };
  return              { score, key: 'excellent',  color: 'bg-emerald-600' };
}

export default function Register() {
  const { t } = useTranslation();

  const features = [
    t('auth.registerPage.feature1'),
    t('auth.registerPage.feature2'),
    t('auth.registerPage.feature3'),
    t('auth.registerPage.feature4'),
  ];
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const strength = getPasswordStrength(password);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const data = await register(name, email, password);
      toast.success(t('auth.register.success'));
      // Dev mode: no Resend key — backend returns the verify URL so we navigate directly
      if (data?.devVerifyUrl) {
        const path = new URL(data.devVerifyUrl).pathname;
        navigate(path);
      } else {
        navigate('/');
      }
    } catch (error) {
      toast.error(error.response?.data?.error || t('common.error'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white dark:bg-gray-950">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative items-center justify-center overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 40%, #6d28d9 100%)' }}>
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 orb orb-pink opacity-30" />
        <div className="absolute bottom-[-5%] left-[-5%] w-80 h-80 orb orb-blue opacity-25" />
        <div className="absolute inset-0 bg-dots opacity-[0.06]" />

        <div className="relative z-10 p-16 max-w-xl w-full">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>

            <Link to="/welcome" className="flex items-center gap-3 mb-12 w-fit">
              <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-xl border border-white/20">
                <Sparkles className="w-7 h-7 text-primary-200" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">SEO Gen AI</span>
            </Link>

            <h1 className="text-5xl font-extrabold text-white leading-[1.1] mb-4 tracking-tight">
              {t('auth.registerPage.headline')}
              <br />
              <span className="text-primary-300">{t('auth.registerPage.headlineHighlight')}</span>
            </h1>
            <p className="text-primary-200/80 text-base font-medium mb-12 leading-relaxed">
              {t('auth.registerPage.tagline')}
            </p>

            <div className="space-y-4">
              {features.map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                  className="flex items-center gap-3 text-primary-50/90"
                >
                  <CheckCircle2 className="w-5 h-5 text-primary-300 shrink-0" />
                  <span className="text-sm font-medium">{feature}</span>
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
          <Link to="/welcome" className="flex lg:hidden items-center gap-2.5 mb-8 sm:mb-10 w-fit">
            <div className="bg-primary-600 p-2 rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900 dark:text-white">SEO Gen AI</span>
          </Link>

          <div className="mb-7 sm:mb-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white mb-2 tracking-tight">
              {t('auth.register.title')}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 font-medium text-sm sm:text-base">{t('auth.register.subtitle')}</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="label-xs" htmlFor="name">{t('auth.register.name')}</label>
              <input
                id="name"
                type="text"
                required
                className="input-field"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div>
              <label className="label-xs" htmlFor="email">{t('auth.register.email')}</label>
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
              <label className="label-xs" htmlFor="password">{t('auth.register.password')}</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={8}
                  className="input-field pr-11"
                  placeholder={t('auth.register.passwordPlaceholder')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <div
                        key={n}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                          n <= strength.score ? strength.color : 'bg-gray-100'
                        }`}
                      />
                    ))}
                  </div>
                  {strength.key && (
                    <p className={`text-[11px] font-bold ${
                      strength.score <= 1 ? 'text-red-500' :
                      strength.score <= 2 ? 'text-amber-500' :
                      strength.score <= 3 ? 'text-yellow-500' :
                      'text-emerald-600'
                    }`}>
                      {t(`auth.register.passwordStrength.${strength.key}`)}
                    </p>
                  )}
                </div>
              )}
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
                  <UserPlus className="w-4 h-4" />
                  <span>{t('auth.register.submit')}</span>
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-gray-500 dark:text-gray-400 mt-8">
            {t('auth.register.haveAccount')}{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 font-bold underline underline-offset-4 decoration-2">
              {t('auth.register.signIn')}
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
