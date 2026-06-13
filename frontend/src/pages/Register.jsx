import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { UserPlus, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const features = [
  'AI-Powered SEO Article Generation',
  'Multi-Model Engine (OpenAI, DeepSeek, Groq)',
  'WordPress 1-Click Publishing',
  'Internal Link Suggestion Engine',
];

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await register(name, email, password);
      toast.success('Account created! Welcome aboard.');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">

      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-[52%] relative items-center justify-center overflow-hidden"
           style={{ background: 'linear-gradient(135deg, #1e1b4b 0%, #3730a3 40%, #6d28d9 100%)' }}>
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 orb orb-pink opacity-30" />
        <div className="absolute bottom-[-5%] left-[-5%] w-80 h-80 orb orb-blue opacity-25" />
        <div className="absolute inset-0 bg-dots opacity-[0.06]" />

        <div className="relative z-10 p-16 max-w-xl w-full">
          <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>

            <div className="flex items-center gap-3 mb-12">
              <div className="bg-white/10 backdrop-blur-sm p-2.5 rounded-xl border border-white/20">
                <Sparkles className="w-7 h-7 text-primary-200" />
              </div>
              <span className="text-2xl font-bold text-white tracking-tight">SEO Gen AI</span>
            </div>

            <h1 className="text-5xl font-extrabold text-white leading-[1.1] mb-4 tracking-tight">
              Start generating
              <br />
              <span className="text-primary-300">premium content.</span>
            </h1>
            <p className="text-primary-200/80 text-base font-medium mb-12 leading-relaxed">
              Your complete AI-powered toolkit for SEO domination.
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
      <div className="w-full lg:w-[48%] flex items-center justify-center p-8 sm:p-14 bg-white">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-md w-full"
        >
          <div className="flex lg:hidden items-center gap-2.5 mb-10">
            <div className="bg-primary-600 p-2 rounded-xl">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">SEO Gen AI</span>
          </div>

          <div className="mb-10">
            <h2 className="text-4xl font-extrabold text-gray-900 mb-2 tracking-tight">Create account</h2>
            <p className="text-gray-500 font-medium">Get started with your free account today.</p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div>
              <label className="label-xs" htmlFor="name">Full Name</label>
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
              <label className="label-xs" htmlFor="email">Email Address</label>
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
              <label className="label-xs" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                required
                className="input-field"
                placeholder="Min. 6 characters"
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
                  <UserPlus className="w-4 h-4" />
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 ml-auto" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm font-medium text-gray-500 mt-8">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-600 hover:text-primary-700 font-bold underline underline-offset-4 decoration-2">
              Sign in here
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
