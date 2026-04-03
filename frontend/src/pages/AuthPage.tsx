import React, { useState, useEffect } from 'react';
import { SignupForm } from '../components/SignupForm';
import { SigninForm } from '../components/SigninForm';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

type AuthMode = 'signin' | 'signup';

export const AuthPage: React.FC = () => {
  const [mode, setMode] = useState<AuthMode>('signin');
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated, navigate]);

  const handleAuthSuccess = () => navigate('/dashboard');

  /* ── Sign Up page ─────────────────────────────────────────── */
  if (mode === 'signup') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-md p-6 sm:p-8 max-h-screen overflow-y-auto">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 text-center mb-6">
            Create Your ISEA Account
          </h2>
          <SignupForm
            onSubmitSuccess={handleAuthSuccess}
            onSwitchToSignin={() => setMode('signin')}
          />
        </div>
      </div>
    );
  }

  /* ── Sign In page ─────────────────────────────────────────── */
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">

      {/* Logo */}
      <div className="mb-6 flex flex-col items-center">
        <img
          src="/logo.png"
          alt="ISEA – International Secure Escrow Account"
          className="h-20 object-contain"
          onError={(e) => {
            // fallback if logo.png not placed in /public yet
            (e.target as HTMLImageElement).style.display = 'none';
          }}
        />
        {/* Inline fallback brand shown only when image is missing */}
        <div className="flex items-center gap-3 mt-1">
          <div className="w-12 h-12 rounded-full border-2 border-purple-800 flex items-center justify-center">
            <span className="text-purple-900 font-bold text-sm">ISEA</span>
          </div>
          <div className="leading-tight">
            <p className="text-purple-900 font-semibold text-sm">International</p>
            <p className="text-purple-900 font-semibold text-sm">Secure Escrow Account</p>
          </div>
        </div>
      </div>

      {/* Tagline */}
      <h1 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-gray-800 text-center mb-6 sm:mb-8 max-w-xs leading-snug">
        Swift and secure transaction with ease
      </h1>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">Sign in</h2>
        <SigninForm
          onSubmitSuccess={handleAuthSuccess}
          onSwitchToSignup={() => setMode('signup')}
          onForgotPassword={() => { /* TODO: password recovery */ }}
        />
      </div>

      {/* Language hint */}
      <button className="mt-6 px-5 py-1.5 border border-gray-300 rounded-full text-sm text-gray-500 bg-white hover:bg-gray-50">
        English
      </button>
    </div>
  );
};
