import React, { useState, useEffect, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import AdminRoute from './components/AdminRoute';
import CookieBanner from './components/CookieBanner';
import OnboardingModal, { shouldShowOnboarding } from './components/OnboardingModal';
import EmailVerificationBanner from './components/EmailVerificationBanner';

// Lazy load pages for code splitting
const Dashboard = lazy(() => import('./pages/Dashboard'));
const History = lazy(() => import('./pages/History'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));
const UsersManager = lazy(() => import('./pages/admin/UsersManager'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const BuyCredits = lazy(() => import('./pages/BuyCredits'));
const Pricing = lazy(() => import('./pages/Pricing'));
const LandingPage = lazy(() => import('./pages/LandingPage'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail'));

// Global page loader for suspense fallback
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
    <div className="w-8 h-8 rounded-full border-4 border-primary-200 dark:border-primary-900 border-t-primary-600 dark:border-t-primary-500 animate-spin" />
  </div>
);
import { ThemeProvider } from './context/ThemeContext';
import { MotionConfig } from 'framer-motion';

// Separated so it can access AuthContext (which requires being inside AuthProvider)
function AppContent() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const { user } = useAuth();

  // Only show onboarding when the user is authenticated and hasn't seen it yet
  useEffect(() => {
    if (user && shouldShowOnboarding()) {
      const timer = setTimeout(() => setShowOnboarding(true), 1200);
      return () => clearTimeout(timer);
    }
  }, [user]);

  return (
    <>
      <Toaster position="top-center" />
      <EmailVerificationBanner />
      <CookieBanner />
      {showOnboarding && <OnboardingModal onClose={() => setShowOnboarding(false)} />}
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/welcome" element={<LandingPage />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/history"
            element={
              <ProtectedRoute>
                <History />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            }
          />
          <Route
            path="/buy-credits"
            element={
              <ProtectedRoute>
                <BuyCredits />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <AdminRoute>
                <UsersManager />
              </AdminRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

function App() {
  return (
    <MotionConfig reducedMotion="user">
      <ThemeProvider>
        <ErrorBoundary>
          <AuthProvider>
            <Router>
              <AppContent />
            </Router>
          </AuthProvider>
        </ErrorBoundary>
      </ThemeProvider>
    </MotionConfig>
  );
}

export default App;
