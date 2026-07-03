import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, AlertTriangle, CheckCircle2, Loader2, RefreshCw, ArrowUpDown, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSubscription, cancelSubscription, reactivateSubscription, changeSubscriptionPlan } from '../lib/api';
import { toast } from 'react-hot-toast';

const PLANS = [
  { id: 'starter', label: 'Starter', priceId: import.meta.env.VITE_STRIPE_PRICE_STARTER, price: '$9/mo', credits: 20 },
  { id: 'growth',  label: 'Growth',  priceId: import.meta.env.VITE_STRIPE_PRICE_GROWTH,  price: '$29/mo', credits: 100 },
  { id: 'pro',     label: 'Pro',     priceId: import.meta.env.VITE_STRIPE_PRICE_PRO,     price: '$99/mo', credits: 500 },
];

const STATUS_KEYS = { active: 'active', trialing: 'trialing', past_due: 'pastDue', canceled: 'canceled' };

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function SubscriptionCard() {
  const { t } = useTranslation();
  const [sub, setSub]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState(false);
  const [showChange, setShowChange] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const fetchSub = async () => {
    setLoading(true);
    try {
      const data = await getSubscription();
      setSub(data.subscription);
    } catch {
      setSub(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSub();
  }, []);

  const handleCancel = async () => {
    setShowCancelConfirm(false);
    setBusy(true);
    try {
      const data = await cancelSubscription();
      setSub((prev) => ({ ...prev, cancelAtPeriodEnd: data.cancelAtPeriodEnd }));
      toast.success(t('settings.subscription.cancelled'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('settings.subscription.cancelError'));
    } finally {
      setBusy(false);
    }
  };

  const handleReactivate = async () => {
    setBusy(true);
    try {
      const data = await reactivateSubscription();
      setSub((prev) => ({ ...prev, cancelAtPeriodEnd: data.cancelAtPeriodEnd }));
      toast.success(t('settings.subscription.reactivated'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('settings.subscription.reactivateError'));
    } finally {
      setBusy(false);
    }
  };

  const handleChangePlan = async (newPriceId) => {
    if (newPriceId === sub?.planId) {
      setShowChange(false);
      return;
    }
    setBusy(true);
    try {
      await changeSubscriptionPlan(newPriceId);
      setSub((prev) => ({ ...prev, planId: newPriceId }));
      setShowChange(false);
      toast.success(t('settings.subscription.planChanged'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('settings.subscription.planChangeError'));
    } finally {
      setBusy(false);
    }
  };

  const currentPlan = PLANS.find((p) => p.priceId === sub?.planId);

  if (loading) {
    return (
      <div className="premium-card p-6 flex items-center gap-3 text-gray-400 dark:text-gray-500">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">{t('settings.subscription.loading')}</span>
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="premium-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-5 h-5 text-violet-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('settings.sections.subscription')}</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{t('settings.subscription.noSubscription')}</p>
        <a
          href="/pricing"
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          {t('settings.subscription.viewPlans')}
        </a>
      </div>
    );
  }

  return (
    <div className="premium-card p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CreditCard className="w-5 h-5 text-violet-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">{t('settings.sections.subscription')}</h3>
        </div>
        <button
          onClick={fetchSub}
          disabled={loading}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
          aria-label={t('common.loading')}
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Status row */}
      <div className="flex flex-wrap items-center gap-3">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
          sub.status === 'active'   ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400' :
          sub.status === 'trialing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400' :
                                      'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
        }`}>
          <CheckCircle2 className="w-3 h-3" />
          {STATUS_KEYS[sub.status]
            ? t(`settings.subscription.status.${STATUS_KEYS[sub.status]}`)
            : sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
        </span>

        {currentPlan && (
          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            {currentPlan.label} — {currentPlan.price}
          </span>
        )}

        {sub.cancelAtPeriodEnd && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-xs font-semibold">
            <AlertTriangle className="w-3 h-3" />
            {t('settings.subscription.cancelAt', { date: formatDate(sub.currentPeriodEnd) })}
          </span>
        )}
      </div>

      {/* Period info */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {sub.cancelAtPeriodEnd
          ? t('settings.subscription.accessUntil', { date: formatDate(sub.currentPeriodEnd) })
          : t('settings.subscription.renewsOn', { date: formatDate(sub.currentPeriodEnd) })}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 pt-1">
        {!sub.cancelAtPeriodEnd ? (
          <>
            <button
              onClick={() => setShowChange(true)}
              disabled={busy}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-xl transition-colors disabled:opacity-40"
            >
              <ArrowUpDown className="w-4 h-4" />
              {t('settings.subscription.changePlanAction')}
            </button>
            <button
              onClick={() => setShowCancelConfirm(true)}
              disabled={busy}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl transition-colors disabled:opacity-40"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              {t('settings.subscription.cancelPlan')}
            </button>
          </>
        ) : (
          <button
            onClick={handleReactivate}
            disabled={busy}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            {t('settings.subscription.reactivate')}
          </button>
        )}
      </div>

      {/* Change plan modal */}
      {showChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <h4 className="text-white font-semibold">{t('settings.subscription.changePlanTitle')}</h4>
              <button onClick={() => setShowChange(false)} className="text-gray-400 hover:text-white p-1.5 rounded-lg hover:bg-gray-700">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => handleChangePlan(plan.priceId)}
                  disabled={busy || !plan.priceId}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-colors disabled:opacity-40 ${
                    plan.priceId === sub.planId
                      ? 'border-violet-500 bg-violet-600/20 text-violet-300'
                      : 'border-gray-700 hover:border-gray-500 text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <div className="text-left">
                    <p className="font-medium text-sm">{plan.label}</p>
                    <p className="text-xs text-gray-400">{t('settings.subscription.creditsPerMonth', { count: plan.credits })}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{plan.price}</p>
                    {plan.priceId === sub.planId && (
                      <p className="text-xs text-violet-400">{t('settings.subscription.currentPlanBadge')}</p>
                    )}
                  </div>
                </button>
              ))}
              <p className="text-xs text-gray-500 pt-1">
                {t('settings.subscription.prorated')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Cancel confirmation modal */}
      <AnimatePresence>
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={() => setShowCancelConfirm(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl"
            >
              <div className="p-6 text-center space-y-4">
                <div className="w-14 h-14 bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
                  <AlertTriangle className="w-7 h-7 text-red-500" />
                </div>
                <div>
                  <h4 className="text-white font-semibold mb-1">{t('settings.subscription.cancelConfirmTitle')}</h4>
                  <p className="text-gray-400 text-sm leading-relaxed">{t('settings.subscription.cancelConfirmBody')}</p>
                </div>
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={() => setShowCancelConfirm(false)}
                    className="flex-1 py-2.5 text-sm font-medium text-gray-300 bg-gray-800 hover:bg-gray-700 rounded-xl transition-colors"
                  >
                    {t('settings.subscription.keepSubscription')}
                  </button>
                  <button
                    onClick={handleCancel}
                    className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors"
                  >
                    {t('settings.subscription.confirmCancel')}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
