import { Zap, Star, TrendingUp, Crown, Shield, Sparkles } from 'lucide-react';

const PLANS = {
  free: {
    label: 'Free',
    icon: Sparkles,
    className: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
    dot: 'bg-gray-400',
  },
  starter: {
    label: 'Starter',
    icon: Star,
    className: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  growth: {
    label: 'Growth',
    icon: TrendingUp,
    className: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400',
    dot: 'bg-violet-500',
  },
  pro: {
    label: 'Pro',
    icon: Crown,
    className: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  unlimited: {
    label: 'Unlimited',
    icon: Zap,
    className: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  admin: {
    label: 'Admin',
    icon: Shield,
    className: 'bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400',
    dot: 'bg-rose-500',
  },
};

/**
 * @param {'free'|'starter'|'growth'|'pro'|'unlimited'|'admin'} plan
 * @param {'badge'|'dot'|'inline'} variant
 *   badge  — colored pill with icon + label  (default)
 *   dot    — small colored circle only (for avatar overlays)
 *   inline — icon + label, no pill background
 */
export default function PlanBadge({ plan = 'free', variant = 'badge', className = '' }) {
  const config = PLANS[plan] ?? PLANS.free;
  const Icon = config.icon;

  if (variant === 'dot') {
    return (
      <span
        className={`block w-3 h-3 rounded-full border-2 border-white dark:border-gray-900 ${config.dot} ${className}`}
        title={config.label}
      />
    );
  }

  if (variant === 'inline') {
    return (
      <span className={`inline-flex items-center gap-1 text-xs font-semibold ${config.className.split(' ').filter(c => c.startsWith('text-')).join(' ')} ${className}`}>
        <Icon className="w-3 h-3" />
        {config.label}
      </span>
    );
  }

  // default: badge
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wide ${config.className} ${className}`}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
