import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-hot-toast';
import { LogIn, Sparkles, ArrowRight, Mail } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
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
      toast.success('Welcome back!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-white">
      {/* Left Side: Marketing */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary-600 items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="/images/auth-bg.png" 
            alt="Marketing" 
            className="w-full h-full object-cover opacity-60 mix-blend-overlay scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-900/80 via-primary-600/40 to-transparent" />
        </div>
        
        <div className="relative z-10 p-16 max-w-2xl text-white">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center space-x-3 mb-8">
              <Sparkles className="w-10 h-10" />
              <span className="text-3xl font-bold tracking-tight">SEO Gen AI</span>
            </div>
            <h1 className="text-6xl font-extrabold leading-tight mb-6">
              Create SEO <br />
              <span className="text-primary-200">Masterpieces.</span>
            </h1>
            <p className="text-xl text-primary-50/80 leading-relaxed">
              Join 10,000+ content creators using our AI-driven engine to dominate search engine results.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-16">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-10"
        >
          <div>
            <h2 className="text-4xl font-bold text-gray-900 mb-3">Welcome Back</h2>
            <p className="text-gray-500 font-medium">Please enter your details to sign in.</p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2" htmlFor="email">Email Address</label>
                <input
                  id="email"
                  type="email"
                  required
                  className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-gray-400"
                  placeholder="name@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-gray-700" htmlFor="password">Password</label>
                  <a href="#" className="text-sm font-medium text-primary-600 hover:text-primary-500">Forgot?</a>
                </div>
                <input
                  id="password"
                  type="password"
                  required
                  className="w-full px-5 py-4 rounded-2xl border border-gray-200 bg-gray-50/50 text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all placeholder:text-gray-400"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full btn-primary flex items-center justify-center space-x-2 py-4"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
            <div className="relative flex justify-center text-sm uppercase"><span className="bg-white px-4 text-gray-400 font-semibold tracking-wider">Or continue with</span></div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <button className="flex items-center justify-center space-x-3 w-full py-4 rounded-2xl border border-gray-200 hover:bg-gray-50 transition-colors font-semibold text-gray-700">
              <Mail className="w-5 h-5" />
              <span>Continue with Google</span>
            </button>
          </div>

          <p className="text-center text-sm font-medium text-gray-500">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary-600 hover:text-primary-700 font-bold underline underline-offset-4 decoration-2">
              Create for free
            </Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
