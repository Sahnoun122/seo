import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '../components/DashboardLayout';
import { getCreditPackages, createCheckoutSession } from '../lib/api';
import { toast } from 'react-hot-toast';
import { Zap, CheckCircle2, Loader2, ExternalLink, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';

const PACKAGE_COLORS = {
  starter: { bg: 'bg-blue-50',   border: 'border-blue-200',   badge: 'bg-blue-100 text-blue-700',   btn: 'bg-blue-600 hover:bg-blue-700' },
  growth:  { bg: 'bg-violet-50', border: 'border-violet-200', badge: 'bg-violet-100 text-violet-700', btn: 'bg-violet-600 hover:bg-violet-700', popular: true },
  pro:     { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', btn: 'bg-emerald-600 hover:bg-emerald-700' },
};

export default function BuyCredits() {
  const [packages, setPackages]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [buying, setBuying]       = useState(null);
  const [searchParams]            = useSearchParams();
  const navigate                  = useNavigate();

  const success   = searchParams.get('success') === 'true';
  const cancelled = searchParams.get('cancelled') === 'true';

  useEffect(() => {
    if (success) {
      toast.success('Payment successful! Your credits have been added.', { duration: 6000 });
      navigate('/buy-credits', { replace: true });
    } else if (cancelled) {
      toast.error('Payment cancelled.', { duration: 4000 });
      navigate('/buy-credits', { replace: true });
    }
  }, [success, cancelled]);

  useEffect(() => {
    getCreditPackages()
      .then((data) => { if (data.success) setPackages(data.data); })
      .catch(() => toast.error('Failed to load credit packages.'))
      .finally(() => setLoading(false));
  }, []);

  const handleBuy = async (pkgId) => {
    setBuying(pkgId);
    try {
      const data = await createCheckoutSession(pkgId);
      if (data.success && data.url) {
        window.location.href = data.url;
      } else {
        toast.error('Failed to start checkout.');
      }
    } catch (err) {
      const msg = err.response?.data?.error || err.message || 'Checkout failed.';
      if (msg.toLowerCase().includes('stripe') || msg.toLowerCase().includes('configured')) {
        toast.error('Stripe is not configured by the administrator yet.', { duration: 5000 });
      } else {
        toast.error(msg);
      }
    } finally {
      setBuying(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto space-y-10 animate-fade-in">

        {/* Header */}
        <div className="text-center space-y-4 py-6">
          <div className="inline-flex items-center gap-2 bg-primary-50 border border-primary-100 px-4 py-1.5 rounded-full">
            <CreditCard className="w-4 h-4 text-primary-600" />
            <span className="text-xs font-black text-primary-700 uppercase tracking-widest">Top Up Credits</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
            Choose your <span className="text-primary-600">plan</span>
          </h1>
          <p className="text-gray-500 text-lg max-w-md mx-auto">
            Each credit = one complete AI article (title + meta + full content + keywords).
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
                  className={`relative premium-card p-8 flex flex-col gap-6 border-2 ${colors.bg} ${colors.border}`}
                >
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
                      <span className="text-4xl font-black text-gray-900">${(pkg.amount / 100).toFixed(0)}</span>
                      <span className="text-gray-400 text-sm font-medium mb-1">one-time</span>
                    </div>
                  </div>

                  <ul className="space-y-3 flex-1">
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-sm font-semibold text-gray-700">
                        <strong className="text-gray-900">{pkg.credits}</strong> AI article generations
                      </span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-sm font-semibold text-gray-700">Full SEO content + keywords</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                      <span className="text-sm font-semibold text-gray-700">WordPress direct publish</span>
                    </li>
                    {pkg.id === 'pro' && (
                      <li className="flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span className="text-sm font-semibold text-gray-700">Priority queue</span>
                      </li>
                    )}
                  </ul>

                  <button
                    onClick={() => handleBuy(pkg.id)}
                    disabled={buying === pkg.id}
                    className={`w-full py-3.5 rounded-2xl text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed ${colors.btn}`}
                  >
                    {buying === pkg.id
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <ExternalLink className="w-4 h-4" />}
                    {buying === pkg.id ? 'Redirecting…' : `Buy ${pkg.name}`}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Footer note */}
        <p className="text-center text-xs text-gray-400 font-medium">
          Payments are processed securely via Stripe. Credits are added instantly after payment confirmation.
        </p>
      </div>
    </DashboardLayout>
  );
}
