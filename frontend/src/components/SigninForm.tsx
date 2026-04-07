import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../stores/authStore';
import { authService } from '../services/apiClient';

interface SigninFormData {
  email: string;
  password: string;
  remember_me?: boolean;
}

interface SigninFormProps {
  onSubmitSuccess?: () => void;
  onSwitchToSignup?: () => void;
  onForgotPassword?: () => void;
}

export const SigninForm: React.FC<SigninFormProps> = ({
  onSubmitSuccess,
  onSwitchToSignup,
  onForgotPassword,
}) => {
  const { signin, error: authError, isLoading } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [openPolicy, setOpenPolicy] = useState<'terms' | 'privacy' | null>(null);
  const [isForgotOpen, setIsForgotOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);
  const [forgotStatus, setForgotStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [forgotMessage, setForgotMessage] = useState('');
  const { register, handleSubmit, formState: { errors }, reset, getValues } = useForm<SigninFormData>({
    mode: 'onChange',
  });

  const onSubmit = async (data: SigninFormData) => {
    try {
      await signin({ username_or_email: data.email, password: data.password });
      reset();
      onSubmitSuccess?.();
    } catch {
      // error shown via authError
    }
  };

  const handleForgotPasswordClick = () => {
    const typedEmail = getValues('email');
    setForgotEmail(typedEmail || '');
    setForgotStatus('idle');
    setForgotMessage('');
    setIsForgotOpen(true);
    onForgotPassword?.();
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsForgotSubmitting(true);
      setForgotStatus('idle');
      setForgotMessage('');
      await authService.requestPasswordReset({ email: forgotEmail });
      setForgotStatus('success');
      setForgotMessage('If this email is registered, a password reset link has been generated.');
    } catch (error) {
      setForgotStatus('error');
      setForgotMessage(error instanceof Error ? error.message : 'Failed to request password reset');
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {authError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {authError}
        </div>
      )}

      {/* Email / Username */}
      <div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </span>
          <input
            id="email"
            type="email"
            placeholder="Username"
            autoComplete="email"
            className="w-full pl-12 pr-12 py-3 bg-gray-100 border-0 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            {...register('email', { required: 'Email is required' })}
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 cursor-pointer">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </span>
        </div>
        {errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{errors.email.message}</p>}
      </div>

      {/* Password */}
      <div>
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </span>
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Password"
            autoComplete="current-password"
            className="w-full pl-12 pr-12 py-3 bg-gray-100 border-0 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-400"
            {...register('password', { required: 'Password is required' })}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{errors.password.message}</p>}
      </div>

      {/* Forgot Password */}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleForgotPasswordClick}
          className="text-sm text-purple-700 hover:text-purple-900 font-medium"
        >
          Forgot Password?
        </button>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 bg-purple-900 hover:bg-purple-800 text-white font-semibold rounded-full transition-colors disabled:opacity-50"
      >
        {isLoading ? 'Signing In…' : 'Sign In'}
      </button>

      {/* Links */}
      <div className="text-center text-sm text-gray-500 space-y-1 pt-1">
        <div>
          <button type="button" onClick={() => setOpenPolicy('terms')} className="hover:text-gray-700">
            Terms of Service
          </button>
        </div>
        <div>
          Don't have an account?{' '}
          <button type="button" onClick={onSwitchToSignup} className="text-purple-700 font-semibold hover:underline">
            Sign Up
          </button>
        </div>
        <div>
          <button type="button" onClick={() => setOpenPolicy('privacy')} className="hover:text-gray-700">
            Privacy Policy
          </button>
        </div>
      </div>

      {openPolicy && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close policy modal"
            onClick={() => setOpenPolicy(null)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {openPolicy === 'terms' ? 'Terms of Service' : 'Privacy Policy'}
              </h3>
              <button
                type="button"
                onClick={() => setOpenPolicy(null)}
                className="text-gray-500 hover:text-gray-700 text-sm font-semibold"
              >
                Close
              </button>
            </div>

            {openPolicy === 'terms' ? (
              <div className="space-y-3 text-sm text-gray-700 leading-6">
                <p className="text-gray-500">Effective: April 6, 2026</p>
                <p>
                  These Terms govern your access to and use of the International Secure Escrow Account ("ISEA") website and services. By using ISEA, you agree to these Terms.
                </p>
                <p><span className="font-semibold">1. Eligibility</span><br />You must be able to form a legally binding agreement in your jurisdiction to use ISEA.</p>
                <p><span className="font-semibold">2. Account Security</span><br />You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.</p>
                <p><span className="font-semibold">3. Escrow Process</span><br />ISEA may hold funds in escrow according to the transaction details provided by the parties. Funds release, disputes, and refunds follow ISEA's review procedures and may require supporting documentation.</p>
                <p><span className="font-semibold">4. Prohibited Use</span><br />Fraud, impersonation, or deceptive activity; attempts to bypass security or access other users' data; use of the service for unlawful activities.</p>
                <p><span className="font-semibold">5. Limitations</span><br />ISEA provides its services "as is" and may update features and policies to improve safety and compliance.</p>
                <p><span className="font-semibold">6. Contact</span><br />For questions about these Terms, contact support@isea-secure.com or +1 (800) 555-0129.</p>
              </div>
            ) : (
              <div className="space-y-3 text-sm text-gray-700 leading-6">
                <p className="text-gray-500">Effective: April 6, 2026</p>
                <p>
                  This Privacy Policy explains how International Secure Escrow Account ("ISEA") collects, uses, and protects your information.
                </p>
                <p><span className="font-semibold">1. Information We Collect</span><br />Account information (e.g., name, email, login identifiers); transaction information you submit for escrow processing; basic device and usage data for security and performance.</p>
                <p><span className="font-semibold">2. How We Use Data</span><br />To operate escrow transactions and support requests; to improve security, detect fraud, and prevent abuse; to comply with applicable laws and enforce policies.</p>
                <p><span className="font-semibold">3. Data Sharing</span><br />We share information only as needed to provide the service, comply with legal requirements, or protect users and the platform.</p>
                <p><span className="font-semibold">4. Security</span><br />We use reasonable safeguards to protect your data. No system is 100% secure, so please use strong passwords and keep them private.</p>
                <p><span className="font-semibold">5. Contact</span><br />For privacy questions, contact privacy@isea-secure.com or +1 (800) 555-0133.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {isForgotOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <button
            type="button"
            aria-label="Close forgot password modal"
            onClick={() => setIsForgotOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4 mb-4">
              <h3 className="text-xl font-bold text-gray-900">Reset Password</h3>
              <button
                type="button"
                onClick={() => setIsForgotOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-sm font-semibold"
              >
                Close
              </button>
            </div>
            <form onSubmit={handleForgotSubmit} className="space-y-3">
              <p className="text-sm text-gray-600">
                Enter your account email and we will generate password reset instructions.
              </p>
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
                required
              />
              {forgotStatus !== 'idle' && (
                <p className={`text-xs ${forgotStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
                  {forgotMessage}
                </p>
              )}
              <button
                type="submit"
                disabled={isForgotSubmitting}
                className="w-full py-2.5 bg-purple-900 hover:bg-purple-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-60"
              >
                {isForgotSubmitting ? 'Submitting...' : 'Send Reset Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </form>
  );
};
