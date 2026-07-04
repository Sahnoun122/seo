import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../lib/api';
import { toast } from 'react-hot-toast';
import {
  Users, FileText, TrendingUp, CreditCard,
  Loader2, BarChart3, Hash, ArrowUpRight
} from 'lucide-react';
import { motion } from 'framer-motion';

function StatCard({ icon: Icon, label, value, sub, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="premium-card p-6 flex items-start gap-4"
    >
      <div className={`p-3 rounded-2xl ${color}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-widest">{label}</p>
        <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">{value}</p>
        {sub && (
          <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 mt-0.5 flex items-center gap-1">
            <ArrowUpRight className="w-3 h-3 text-emerald-500" />
            {sub}
          </p>
        )}
      </div>
    </motion.div>
  );
}

function MiniBarChart({ data }) {
  const maxVal = Math.max(...data.map(d => d.count), 1);

  return (
    <div className="flex items-end gap-2 h-32">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: `${(d.count / maxVal) * 100}%` }}
            transition={{ delay: i * 0.08, duration: 0.5 }}
            className="w-full min-h-[4px] bg-gradient-to-t from-primary-600 to-primary-400 rounded-t-lg"
            title={`${d.date}: ${d.count} articles`}
          />
          <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/admin/stats');
        if (res.data.success) setStats(res.data.data);
      } catch {
        toast.error('Failed to load dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="w-10 h-10 text-primary-500 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  const ov = stats?.overview || {};

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Admin Dashboard</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1 font-medium">Overview of your platform performance.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Users" value={ov.totalUsers || 0}
            sub={`${ov.newUsers30d || 0} new this month`}
            color="bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
            delay={0} />
          <StatCard icon={FileText} label="Total Articles" value={ov.totalArticles || 0}
            sub={`${ov.newArticles30d || 0} this month`}
            color="bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400"
            delay={0.05} />
          <StatCard icon={CreditCard} label="Credits Sold" value={ov.totalCreditsPurchased || 0}
            sub={`${ov.recentCreditsPurchased || 0} this month`}
            color="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
            delay={0.1} />
          <StatCard icon={TrendingUp} label="Avg. Articles/Day" value={
            stats?.chartData
              ? (stats.chartData.reduce((s, d) => s + d.count, 0) / 7).toFixed(1)
              : '0'
          }
            sub="Last 7 days"
            color="bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400"
            delay={0.15} />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Article Generation Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 premium-card p-6"
          >
            <div className="flex items-center gap-2 mb-6">
              <BarChart3 className="w-4 h-4 text-primary-600" />
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Articles Generated — Last 7 Days</h3>
            </div>
            {stats?.chartData ? (
              <MiniBarChart data={stats.chartData} />
            ) : (
              <p className="text-sm text-gray-400">No data available.</p>
            )}
          </motion.div>

          {/* Top Keywords */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="premium-card p-6"
          >
            <div className="flex items-center gap-2 mb-5">
              <Hash className="w-4 h-4 text-primary-600" />
              <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-widest">Top Keywords</h3>
            </div>
            <ul className="space-y-2.5">
              {(stats?.topKeywords || []).map((kw, i) => (
                <li key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-[10px] font-bold text-primary-600 dark:text-primary-400 shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">{kw.keyword}</span>
                  </div>
                  <span className="text-xs font-black text-gray-400 dark:text-gray-500 shrink-0">{kw.count}</span>
                </li>
              ))}
              {(!stats?.topKeywords || stats.topKeywords.length === 0) && (
                <p className="text-xs text-gray-400 text-center py-4">No keywords yet.</p>
              )}
            </ul>
          </motion.div>
        </div>
      </div>
    </DashboardLayout>
  );
}
