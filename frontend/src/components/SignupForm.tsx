import React from 'react';
import { useForm } from 'react-hook-form';
import { useAuthStore } from '../stores/authStore';

interface SignupFormData {
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  gender: string;
  affiliated_authorities: string;
  date_of_birth: string;
  escrow_deposit_amount: number;
  duration_days: number;
  personal_item: string;
  profile_picture: FileList;
  password: string;
  password_confirm: string;
}

interface SignupFormProps {
  onSubmitSuccess?: () => void;
  onSwitchToSignin?: () => void;
}

export const SignupForm: React.FC<SignupFormProps> = ({ onSubmitSuccess, onSwitchToSignin }) => {
  const { signup, error: authError, isLoading, signupSuccess } = useAuthStore();
  const { register, handleSubmit, formState: { errors }, watch } = useForm<SignupFormData>({
    mode: 'onChange',
  });

  const password = watch('password');

  const onSubmit = async (data: SignupFormData) => {
    try {
      await signup({
        email: data.email,
        first_name: data.first_name,
        last_name: data.last_name,
        password: data.password,
        phone: data.phone || undefined,
        gender: data.gender || undefined,
        affiliated_authorities: data.affiliated_authorities || undefined,
        date_of_birth: data.date_of_birth || undefined,
        escrow_deposit_amount: data.escrow_deposit_amount ? Number(data.escrow_deposit_amount) : undefined,
        duration_days: data.duration_days ? Number(data.duration_days) : undefined,
        personal_item: data.personal_item || undefined,
        profile_picture: data.profile_picture?.[0] || undefined,
      });
      onSubmitSuccess?.();
    } catch {
      // error shown via authError
    }
  };

  if (signupSuccess) {
    return (
      <div className="text-center space-y-4 py-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-800">Check your email</h3>
        <p className="text-gray-500 text-sm">
          We sent a confirmation link to your email address.<br />
          Click it to activate your account, then sign in.
        </p>
        <button type="button" onClick={onSwitchToSignin}
          className="w-full py-3 bg-purple-900 hover:bg-purple-800 text-white font-semibold rounded-lg transition-colors mt-4">
          Go to Sign In
        </button>
      </div>
    );
  }

  const fieldClass = "w-full px-4 py-2.5 border border-gray-300 rounded-lg text-gray-800 bg-white focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 mb-1";
  const errorClass = "text-red-500 text-xs mt-1";

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {authError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {authError}
        </div>
      )}

      {/* Email */}
      <div>
        <label className={labelClass}>Email:</label>
        <input type="email" className={fieldClass} placeholder=""
          {...register('email', { required: 'Email is required',
            pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' } })} />
        {errors.email && <p className={errorClass}>{errors.email.message}</p>}
      </div>

      {/* First Name */}
      <div>
        <label className={labelClass}>First Name:</label>
        <input type="text" className={fieldClass}
          {...register('first_name', { required: 'First name is required' })} />
        {errors.first_name && <p className={errorClass}>{errors.first_name.message}</p>}
      </div>

      {/* Last Name */}
      <div>
        <label className={labelClass}>Last Name:</label>
        <input type="text" className={fieldClass}
          {...register('last_name', { required: 'Last name is required' })} />
        {errors.last_name && <p className={errorClass}>{errors.last_name.message}</p>}
      </div>

      {/* Phone */}
      <div>
        <label className={labelClass}>Phone:</label>
        <input type="tel" className={fieldClass} {...register('phone')} />
      </div>

      {/* Gender */}
      <div>
        <label className={labelClass}>Gender:</label>
        <select className={fieldClass} {...register('gender')}>
          <option value="">Select</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
          <option value="prefer-not-say">Prefer not to say</option>
        </select>
      </div>

      {/* Affiliated Authorities */}
      <div>
        <label className={labelClass}>Affiliated with Authorities:</label>
        <input type="text" className={fieldClass} {...register('affiliated_authorities')} />
      </div>

      {/* Date of Birth */}
      <div>
        <label className={labelClass}>Date of Birth:</label>
        <input type="date" className={fieldClass} {...register('date_of_birth')} />
      </div>

      {/* Deposit Amount */}
      <div>
        <label className={labelClass}>Enter Deposit Amount ($):</label>
        <input type="number" min="0" step="0.01" className={fieldClass}
          {...register('escrow_deposit_amount')} />
      </div>

      {/* Duration */}
      <div>
        <label className={labelClass}>Duration (in days):</label>
        <input type="number" min="1" className={fieldClass}
          {...register('duration_days')} />
      </div>

      {/* Personal Item */}
      <div>
        <label className={labelClass}>Personal Item:</label>
        <select className={fieldClass} {...register('personal_item')}>
          <option value="Yes">Yes</option>
          <option value="No">No</option>
        </select>
      </div>

      {/* Profile Picture */}
      <div>
        <label className={labelClass}>Profile Picture:</label>
        <input type="file" accept="image/jpeg,image/png,image/webp"
          className="w-full text-sm text-gray-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200 cursor-pointer"
          {...register('profile_picture')} />
      </div>

      {/* Password */}
      <div>
        <label className={labelClass}>Password:</label>
        <input type="password" className={fieldClass}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'Minimum 8 characters' },
          })} />
        {errors.password && <p className={errorClass}>{errors.password.message}</p>}
      </div>

      {/* Retype Password */}
      <div>
        <label className={labelClass}>Retype Password:</label>
        <input type="password" className={fieldClass}
          {...register('password_confirm', {
            required: 'Please confirm your password',
            validate: v => v === password || 'Passwords do not match',
          })} />
        {errors.password_confirm && <p className={errorClass}>{errors.password_confirm.message}</p>}
      </div>

      {/* Terms */}
      <p className="text-xs text-gray-500">
        By clicking "Continue", you agree to the{' '}
        <a href="/terms" className="text-blue-600 hover:underline">Terms</a>.
        For more information about how we process your personal data, please see our{' '}
        <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>.
      </p>

      {/* Submit */}
      <button type="submit" disabled={isLoading}
        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50">
        {isLoading ? 'Creating Account…' : 'Create Account'}
      </button>
    </form>
  );
};
