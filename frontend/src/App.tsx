import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { LandingPage } from './pages/LandingPage';
import { AboutLandingPage } from './pages/AboutLandingPage';
import { ContactLandingPage } from './pages/ContactLandingPage';
import { RefundLandingPage } from './pages/RefundLandingPage';
import { TestimonialsLandingPage } from './pages/TestimonialsLandingPage';
import './index.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, hasCheckedAuth } = useAuthStore();
  if (!hasCheckedAuth) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-t-2 border-purple-500" />
      </div>
    );
  }
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  return <>{children}</>;
};

function App() {
  const { getCurrentUser } = useAuthStore();

  useEffect(() => {
    getCurrentUser();
  }, [getCurrentUser]);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutLandingPage />} />
        <Route path="/contact" element={<ContactLandingPage />} />
        <Route path="/refund" element={<RefundLandingPage />} />
        <Route path="/testimonials" element={<TestimonialsLandingPage />} />
        <Route path="/signin" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
