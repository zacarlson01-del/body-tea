import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authService } from '../services/apiClient';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [isCheckingToken, setIsCheckingToken] = useState(true);
  const [isTokenValid, setIsTokenValid] = useState(false);

  useEffect(() => {
    const run = async () => {
      if (!token) {
        setIsTokenValid(false);
        setStatus('error');
        setMessage('This reset link is invalid or missing a token.');
        setIsCheckingToken(false);
        return;
      }

      try {
        setIsCheckingToken(true);
        await authService.validateResetToken(token);
        setIsTokenValid(true);
      } catch (error) {
        setIsTokenValid(false);
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Invalid or expired reset token');
      } finally {
        setIsCheckingToken(false);
      }
    };

    run();
  }, [token]);

  const validatePassword = (value: string) => {
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(value)) return 'Password must include at least one uppercase letter';
    if (!/[0-9]/.test(value)) return 'Password must include at least one number';
    if (!/[@$!%*?&]/.test(value)) return 'Password must include at least one special character';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('idle');
    setMessage('');

    if (!token || !isTokenValid) {
      setStatus('error');
      setMessage('This reset link is invalid or expired.');
      return;
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setStatus('error');
      setMessage(passwordError);
      return;
    }

    if (newPassword !== confirmPassword) {
      setStatus('error');
      setMessage('Passwords do not match.');
      return;
    }

    try {
      setIsSubmitting(true);
      await authService.resetPassword({ token, new_password: newPassword });
      setStatus('success');
      setMessage('Password reset successful. Redirecting to Sign In...');
      window.setTimeout(() => navigate('/signin', { replace: true }), 1500);
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-6 sm:p-8">
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">Reset Password</h1>
        <p className="text-sm text-gray-500 text-center mb-6">
          Enter a new password for your ISEA account.
        </p>

        {isCheckingToken ? (
          <p className="text-sm text-gray-600 text-center">Validating reset link...</p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              required
              disabled={!isTokenValid}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400"
              required
              disabled={!isTokenValid}
            />
          </div>

          {status !== 'idle' && (
            <p className={`text-sm ${status === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {message}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !isTokenValid}
            className="w-full py-3 bg-purple-900 hover:bg-purple-800 text-white font-semibold rounded-lg transition-colors disabled:opacity-60"
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
          </form>
        )}

        <div className="text-center mt-4">
          <Link to="/signin" className="text-sm text-purple-700 hover:underline">
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};
