import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { authService } from './services/apiClient';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import './index.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) return <Navigate to="/signin" replace />;
  return <>{children}</>;
};

function App() {
  const { getCurrentUser } = useAuthStore();
  const [confirming, setConfirming] = useState(false);
  const [confirmError, setConfirmError] = useState('');

  useEffect(() => {
    // Handle email confirmation link: Netlify appends #confirmation_token=... to the URL
    const hash = window.location.hash;
    const tokenMatch = hash.match(/confirmation_token=([^&]+)/);

    if (tokenMatch) {
      setConfirming(true);
      authService
        .confirm(tokenMatch[1])
        .then(() => {
          window.location.replace('/dashboard');
        })
        .catch(() => {
          setConfirmError('Confirmation link is invalid or expired. Please sign in.');
          setConfirming(false);
        });
      return;
    }

    // Restore session from GoTrue's local cache
    getCurrentUser();
  }, [getCurrentUser]);

  if (confirming) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-gray-400">Confirming your account…</p>
      </div>
    );
  }

  if (confirmError) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <p className="text-red-400">{confirmError}</p>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<AuthPage />} />
        <Route path="/signup" element={<AuthPage />} />
        <Route path="/" element={<Navigate to="/signin" replace />} />
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
