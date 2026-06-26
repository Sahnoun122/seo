import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import AdminRoute from './components/AdminRoute';
import UsersManager from './pages/admin/UsersManager';
import AdminDashboard from './pages/admin/AdminDashboard';
import BuyCredits from './pages/BuyCredits';
import Pricing from './pages/Pricing';
import LandingPage from './pages/LandingPage';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import CookieBanner from './components/CookieBanner';
import OnboardingModal, { shouldShowOnboarding } from './components/OnboardingModal';
import EmailVerificationBanner from './components/EmailVerificationBanner';
import VerifyEmail from './pages/VerifyEmail';
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
