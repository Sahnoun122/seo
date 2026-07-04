import { useEffect, useState, useCallback } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import api, { getCreditPackages, createPaymentIntent } from '../lib/api';
import { toast } from 'react-hot-toast';
import { Zap, CheckCircle2, Loader2, CreditCard, ShieldCheck, X, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Card, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const PACKAGE_COLORS = {
  starter: {
    bg: 'bg-blue-50/50 dark:bg-blue-900/10',
    border: 'border-blue-200 dark:border-blue-800/50',
    badge: 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
    btn: 'bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white',
  },
  growth: {
    bg: 'bg-violet-50/50 dark:bg-violet-900/10',
    border: 'border-violet-200 dark:border-violet-800/50',
    badge: 'bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-400',
    btn: 'bg-violet-600 hover:bg-violet-700 dark:bg-violet-500 dark:hover:bg-violet-600 text-white',
    popular: true,
  },
  pro: {
    bg: 'bg-emerald-50/50 dark:bg-emerald-900/10',
    border: 'border-emerald-200 dark:border-emerald-800/50',
    badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
    btn: 'bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white',
  },
};

// Inner form — must live inside <Elements> provider
function CheckoutForm({ pkg, onSuccess, onClose }) {
  const { t } = useTranslation();
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements || processing) return;

    setProcessing(true);
    setErrorMsg('');

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: 'if_required',
    });

    if (error) {
      setErrorMsg(error.message || t('common.error'));
      setProcessing(false);
      return;
    }

    if (paymentIntent?.status === 'succeeded') {
      setProcessing(false);
      try {
        await api.post(`/stripe/verify/${paymentIntent.id}`);
      } catch {
        // Verify failed — the webhook will credit the user as fallback.
        // Still show success so the user is not stuck.
      }
      setSucceeded(true);
      setTimeout(() => onSuccess(), 1400);
    }
  };

  if (succeeded) {
    return (
      <div className="flex flex-col items-center justify-center py-8 gap-4 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
          <CheckCircle2 className="w-8 h-8 text-emerald-500" />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{t('buyCredits.modal.success')}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('buyCredits.modal.successSubtitle', { credits: pkg.credits })}
          </p>
        </div>
        <Loader2 className="w-4 h-4 animate-spin text-gray-300" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Order summary */}
      <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-xl px-4 py-3 border border-gray-100 dark:border-gray-700/50">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">{t('buyCredits.modal.orderSummary', { name: pkg.name })}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{t('buyCredits.modal.orderSubtitle', { credits: pkg.credits })}</p>
        </div>
        <span className="text-lg font-black text-gray-900 dark:text-white">
          ${(pkg.amount / 100).toFixed(2)}
        </span>
      </div>

      {/* Stripe Payment Element */}
      <PaymentElement options={{ layout: 'tabs' }} />

      {errorMsg && (
        <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/40 rounded-xl px-3 py-2.5">
          <X className="w-4 h-4 shrink-0 mt-0.5" />
          {errorMsg}
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onClose}
          disabled={processing}
          className="px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-40"
        >
          {t('buyCredits.modal.cancel')}
        </button>
        <button
          type="submit"
          disabled={!stripe || processing}
          className="flex-1 py-3 rounded-xl bg-primary-600 hover:bg-primary-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-bold flex items-center justify-center gap-2 transition-all"
        >
          {processing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('buyCredits.modal.processing')}
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              {t('buyCredits.modal.pay', { amount: `$${(pkg.amount / 100).toFixed(2)}` })}
            </>
          )}
        </button>
      </div>

      <p className="text-center text-xs text-gray-400 flex items-center justify-center gap-1.5 pt-1">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
        {t('buyCredits.modal.secured')}
      </p>
    </form>
  );
}

// Payment modal wraps CheckoutForm inside Elements provider
function PaymentModal({ pkg, clientSecret, stripePromise, onSuccess, onClose }) {
  const { t } = useTranslation();
  const appearance = {
    theme: 'stripe',
    variables: {
      colorPrimary: '#6366f1',
      colorBackground: '#ffffff',
      colorText: '#111827',
      colorTextSecondary: '#6b7280',
      colorDanger: '#ef4444',
      fontFamily: '"Inter", "system-ui", sans-serif',
      fontSizeBase: '14px',
      borderRadius: '10px',
      spacingUnit: '4px',
    },
    rules: {
      '.Input': {
        border: '1.5px solid #e5e7eb',
        boxShadow: 'none',
        padding: '10px 12px',
      },
      '.Input:focus': {
        border: '1.5px solid #6366f1',
        boxShadow: '0 0 0 3px rgba(99,102,241,0.12)',
      },
      '.Label': { fontWeight: '600', marginBottom: '6px' },
    },
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="bg-white dark:bg-gray-900 w-full sm:max-w-[420px] rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-emerald-500" />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
              {t('buyCredits.modal.title')}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-5">
          <Elements stripe={stripePromise} options={{ clientSecret, appearance }}>
            <CheckoutForm pkg={pkg} onSuccess={onSuccess} onClose={onClose} />
          </Elements>
        </div>
      </motion.div>
    </div>
  );
}

// Main page
export default function BuyCredits() {
  const { t } = useTranslation();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState(null);
  const [stripePromise, setStripePromise] = useState(null);
  const [modal, setModal] = useState(null); // { pkg, clientSecret }

  const { refreshUser } = useAuth();

  useEffect(() => {
    const init = async () => {
      try {
        const pkgsData = await getCreditPackages();
        if (pkgsData.success) setPackages(pkgsData.data);
      } catch {
        toast.error(t('common.error'));
      } finally {
        setLoading(false);
      }
    };
    init();

    api.get('/stripe/config')
      .then((res) => {
        if (res.data.publishableKey) {
          setStripePromise(loadStripe(res.data.publishableKey));
        }
      })
      .catch(() => {});
    // Intentionally run once on mount only — switching language shouldn't
    // re-fetch credit packages or re-initialize Stripe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBuy = async (pkg) => {
    if (!stripePromise) {
      toast.error(t('errors.stripeNotConfigured'));
      return;
    }
    setBuying(pkg.id);
    try {
      const data = await createPaymentIntent(pkg.id);
      if (data.success && data.clientSecret) {
        setModal({ pkg, clientSecret: data.clientSecret });
      } else {
        toast.error(t('common.error'));
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Payment setup failed.';
      if (msg.toLowerCase().includes('stripe') || msg.toLowerCase().includes('configured')) {
        toast.error(t('errors.stripeNotConfigured'), { duration: 5000 });
      } else {
        toast.error(msg);
      }
    } finally {
      setBuying(null);
    }
  };

  const handleSuccess = useCallback(() => {
    setModal(null);
    toast.success(t('buyCredits.success'), { duration: 5000 });
    refreshUser(); // background — no await
  }, [refreshUser, t]);

  const handleClose = useCallback(() => setModal(null), []);

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-10 animate-fade-in">

        {/* Header */}
        <div className="text-center space-y-4 py-6">
          <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 px-4 py-1.5 rounded-full">
            <CreditCard className="w-4 h-4 text-primary-600" />
            <span className="text-xs font-black text-primary-700 dark:text-primary-400 uppercase tracking-widest">{t('buyCredits.topUp', { defaultValue: 'Top Up Credits' })}</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            {t('buyCredits.title')} <span className="text-primary-600 dark:text-primary-400">{t('buyCredits.titleHighlight')}</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-lg max-w-md mx-auto">
            {t('buyCredits.subtitle')}
          </p>
        </div>

        {/* Packages */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg, i) => {
              const colors = PACKAGE_COLORS[pkg.id] || PACKAGE_COLORS.starter;
              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                >
                  <Card
                    className={`relative flex flex-col border-2 ${colors.bg} ${colors.border}`}
                    hoverable={true}
                  >
                    <CardContent className="p-8 flex flex-col gap-6 h-full">
                      {colors.popular && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="bg-violet-600 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg">
                            Most Popular
                          </span>
                        </div>
                      )}

                      <div className="space-y-2">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full ${colors.badge}`}>
                          <Zap className="w-3 h-3" />
                          {pkg.name}
                        </span>
                        <div className="flex items-end gap-1">
                          <span className="text-4xl font-black text-gray-900 dark:text-white">
                            ${(pkg.amount / 100).toFixed(0)}
                          </span>
                          <span className="text-gray-400 dark:text-gray-500 text-sm font-medium mb-1">one-time</span>
                        </div>
                      </div>

                      <ul className="space-y-3 flex-1">
                        <li className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                            <strong className="text-gray-900 dark:text-white">{pkg.credits}</strong> {t('buyCredits.generations')}
                          </span>
                        </li>
                        <li className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('buyCredits.features.seo')}</span>
                        </li>
                        <li className="flex items-center gap-2.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                          <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('buyCredits.features.wordpress')}</span>
                        </li>
                        {pkg.id === 'pro' && (
                          <li className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{t('buyCredits.features.priority')}</span>
                          </li>
                        )}
                      </ul>

                      <Button
                        onClick={() => handleBuy(pkg)}
                        isLoading={buying === pkg.id}
                        icon={CreditCard}
                        className={`w-full py-3.5 mt-auto text-sm uppercase tracking-widest shadow-lg ${colors.btn}`}
                      >
                        {t('buyCredits.buy', { name: pkg.name })}
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-gray-400 font-medium flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          {t('buyCredits.secured')}
        </p>
      </div>

      {/* Payment Modal — rendered outside the scrollable area */}
      <AnimatePresence>
        {modal && stripePromise && (
          <PaymentModal
            pkg={modal.pkg}
            clientSecret={modal.clientSecret}
            stripePromise={stripePromise}
            onSuccess={handleSuccess}
            onClose={handleClose}
          />
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
