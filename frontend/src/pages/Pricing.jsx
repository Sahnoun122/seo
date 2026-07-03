import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Check, Minus, Loader2, Sparkles, Zap, Shield, Crown, X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';
import { loadStripe } from '@stripe/stripe-js';
import { EmbeddedCheckoutProvider, EmbeddedCheckout } from '@stripe/react-stripe-js';
import DashboardLayout from '../components/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import api from '../lib/api';

// Presentation-only metadata, merged by index with the translated plan
// content from locales/*/translation.json → landing.pricing.plans
const PLAN_META = [
  { id: import.meta.env.VITE_STRIPE_PRICE_STARTER, icon: Shield, color: 'text-blue-500 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/30' },
  { id: import.meta.env.VITE_STRIPE_PRICE_GROWTH,  icon: Zap,    color: 'text-primary-500 dark:text-primary-400', bg: 'bg-primary-50 dark:bg-primary-900/30' },
  { id: import.meta.env.VITE_STRIPE_PRICE_PRO,     icon: Crown,  color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/30' },
];

export default function Pricing() {
  const { t } = useTranslation();
  const [loadingId, setLoadingId] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [checkoutClientSecret, setCheckoutClientSecret] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth();

  const planItems = t('landing.pricing.plans', { returnObjects: true });
  const plans = planItems.map((p, i) => ({ ...p, ...PLAN_META[i] }));

  useEffect(() => {
    api.get('/stripe/config')
      .then(res => {
        if (res.data.publishableKey) {
          setStripePromise(loadStripe(res.data.publishableKey));
        }
      })
      .catch(err => console.error('Failed to load Stripe config', err));
  }, []);

  const handleSubscribe = async (planId) => {
    if (!user) {
      navigate('/register');
      return;
    }
    if (!planId) {
      toast.error(t('errors.stripeNotConfigured'));
      return;
    }
    setLoadingId(planId);
    try {
      const res = await api.post('/stripe/subscribe', { priceId: planId });
      if (res.data.clientSecret) {
        setCheckoutClientSecret(res.data.clientSecret);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || t('pricingPage.subscribeError'));
    } finally {
      setLoadingId(null);
    }
  };

  const pricingContent = (
      <div className="py-12 relative overflow-hidden">
        {/* Decorative background blur */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-4xl md:text-5xl font-black text-gray-900 dark:text-white tracking-tight mb-4">
              {t('landing.pricing.title')}
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">
              {t('pricingPage.subtitle')}
            </p>
          </motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            return (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative premium-card p-8 flex flex-col ${plan.popular ? 'border-primary-500 shadow-glow z-10 md:scale-105' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <span className="bg-primary-500 text-white text-xs font-bold uppercase tracking-wider py-1 px-3 rounded-full flex items-center gap-1 shadow-lg">
                      <Sparkles className="w-3 h-3" /> {t('landing.pricing.mostPopular')}
                    </span>
                  </div>
                )}

                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-6 ${plan.bg} ${plan.color}`}>
                  <Icon className="w-6 h-6" />
                </div>

                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{plan.name}</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{plan.desc}</p>

                <div className="mb-8">
                  <span className="text-4xl font-black text-gray-900 dark:text-white">{plan.price}</span>
                  <span className="text-gray-500 dark:text-gray-400 font-medium">{plan.period}</span>
                </div>

                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, i) => (
                    <li key={`f-${i}`} className="flex items-start gap-3">
                      <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-emerald-50 dark:bg-emerald-900/30">
                        <Check className="w-3 h-3 text-emerald-500 font-bold" />
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {feature}
                      </span>
                    </li>
                  ))}
                  {plan.excluded.map((feature, i) => (
                    <li key={`x-${i}`} className="flex items-start gap-3">
                      <div className="mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 bg-gray-100 dark:bg-gray-800">
                        <Minus className="w-3 h-3 text-gray-400 font-bold" />
                      </div>
                      <span className="text-sm font-medium text-gray-400 dark:text-gray-500 line-through">
                        {feature}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loadingId !== null}
                  className={`w-full py-3.5 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                    plan.popular
                      ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/25'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {loadingId === plan.id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    t('pricingPage.subscribeNow')
                  )}
                </button>
              </motion.div>
            );
          })}
        </div>

        {/* Stripe Embedded Checkout Modal */}
        {checkoutClientSecret && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white dark:bg-gray-900 w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh]">
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('pricingPage.secureCheckout')}</h3>
                <button 
                  onClick={() => setCheckoutClientSecret('')}
                  className="p-2 text-gray-400 hover:text-gray-900 dark:hover:text-white bg-gray-100 dark:bg-gray-800 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-4 overflow-y-auto flex-1">
                {stripePromise ? (
                  <EmbeddedCheckoutProvider stripe={stripePromise} options={{ clientSecret: checkoutClientSecret }}>
                    <EmbeddedCheckout />
                  </EmbeddedCheckoutProvider>
                ) : (
                  <div className="flex justify-center p-10"><Loader2 className="w-8 h-8 animate-spin text-primary-500" /></div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-background font-sans">
        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur-sm border-b border-gray-100 dark:border-gray-800">
          <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link to="/welcome" className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <span className="text-lg font-black text-gray-900 dark:text-white tracking-tight">SEO Gen AI</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link to="/login" className="text-sm font-bold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">
                {t('landing.footer.login')}
              </Link>
              <Link to="/register" className="btn-primary text-sm px-5 py-2.5">
                {t('cta.getStartedFree')}
              </Link>
            </div>
          </div>
        </nav>
        <div className="pt-20">
          {pricingContent}
        </div>
        <footer className="border-t border-gray-100 dark:border-gray-800 py-6 text-center text-sm text-gray-400 dark:text-gray-500">
          {t('landing.footer.copyright')} ·{' '}
          <Link to="/privacy" className="hover:text-primary-600 transition-colors">{t('landing.footer.privacy')}</Link> ·{' '}
          <Link to="/terms" className="hover:text-primary-600 transition-colors">{t('landing.footer.terms')}</Link>
        </footer>
      </div>
    );
  }

  return (
    <DashboardLayout>
      {pricingContent}
    </DashboardLayout>
  );
}
