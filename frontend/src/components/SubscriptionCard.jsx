import { useState, useEffect } from 'react';
import { CreditCard, AlertTriangle, CheckCircle2, Loader2, RefreshCw, ArrowUpDown, X } from 'lucide-react';
import { getSubscription, cancelSubscription, reactivateSubscription, changeSubscriptionPlan } from '../lib/api';
import { toast } from 'react-hot-toast';

const PLANS = [
  { id: 'starter', label: 'Starter', priceId: import.meta.env.VITE_STRIPE_PRICE_STARTER, price: '$9/mo', credits: 20 },
  { id: 'growth',  label: 'Growth',  priceId: import.meta.env.VITE_STRIPE_PRICE_GROWTH,  price: '$29/mo', credits: 100 },
  { id: 'pro',     label: 'Pro',     priceId: import.meta.env.VITE_STRIPE_PRICE_PRO,     price: '$99/mo', credits: 500 },
];

function formatDate(ts) {
  if (!ts) return '—';
  return new Date(ts * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}

export default function SubscriptionCard() {
  const [sub, setSub]           = useState(null);
  const [loading, setLoading]   = useState(true);
  const [busy, setBusy]         = useState(false);
  const [showChange, setShowChange] = useState(false);

  useEffect(() => {
    fetchSub();
  }, []);

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

  const handleCancel = async () => {
    if (!confirm('Cancel your subscription at the end of the current period?')) return;
    setBusy(true);
    try {
      const data = await cancelSubscription();
      setSub((prev) => ({ ...prev, cancelAtPeriodEnd: data.cancelAtPeriodEnd }));
      toast.success('Subscription will cancel at end of period.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to cancel subscription.');
    } finally {
      setBusy(false);
    }
  };

  const handleReactivate = async () => {
    setBusy(true);
    try {
      const data = await reactivateSubscription();
      setSub((prev) => ({ ...prev, cancelAtPeriodEnd: data.cancelAtPeriodEnd }));
      toast.success('Subscription reactivated!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reactivate subscription.');
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
      toast.success('Plan updated! Prorated charge applied.');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change plan.');
    } finally {
      setBusy(false);
    }
  };

  const currentPlan = PLANS.find((p) => p.priceId === sub?.planId);

  if (loading) {
    return (
      <div className="premium-card p-6 flex items-center gap-3 text-gray-400">
        <Loader2 className="w-5 h-5 animate-spin" />
        <span className="text-sm">Loading subscription…</span>
      </div>
    );
  }

  if (!sub) {
    return (
      <div className="premium-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <CreditCard className="w-5 h-5 text-violet-400" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Subscription</h3>
        </div>
        <p className="text-sm text-gray-500 mb-4">You don't have an active subscription.</p>
        <a
          href="/pricing"
          className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors"
        >
          View Plans
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
          <h3 className="font-semibold text-gray-900 dark:text-white">Subscription</h3>
        </div>
        <button onClick={fetchSub} disabled={loading} className="text-gray-400 hover:text-gray-600 transition-colors">
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
          {sub.status.charAt(0).toUpperCase() + sub.status.slice(1)}
        </span>

        {currentPlan && (
          <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">
            {currentPlan.label} — {currentPlan.price}
          </span>
        )}

        {sub.cancelAtPeriodEnd && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400 text-xs font-semibold">
            <AlertTriangle className="w-3 h-3" />
            Cancels {formatDate(sub.currentPeriodEnd)}
          </span>
        )}
      </div>

      {/* Period info */}
      <div className="text-sm text-gray-500 dark:text-gray-400">
        {sub.cancelAtPeriodEnd
          ? `Access until ${formatDate(sub.currentPeriodEnd)}`
          : `Renews on ${formatDate(sub.currentPeriodEnd)}`}
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
              Change plan
            </button>
            <button
              onClick={handleCancel}
              disabled={busy}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 text-sm font-medium rounded-xl transition-colors disabled:opacity-40"
            >
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <X className="w-4 h-4" />}
              Cancel subscription
            </button>
          </>
        ) : (
          <button
            onClick={handleReactivate}
            disabled={busy}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white text-sm font-medium rounded-xl transition-colors disabled:opacity-40"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
            Reactivate subscription
          </button>
        )}
      </div>

      {/* Change plan modal */}
      {showChange && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
              <h4 className="text-white font-semibold">Change Plan</h4>
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
                    <p className="text-xs text-gray-400">{plan.credits} credits/month</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{plan.price}</p>
                    {plan.priceId === sub.planId && (
                      <p className="text-xs text-violet-400">Current plan</p>
                    )}
                  </div>
                </button>
              ))}
              <p className="text-xs text-gray-500 pt-1">
                Plan changes are prorated and charged immediately.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
