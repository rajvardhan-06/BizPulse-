import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, ArrowRight, UserCheck } from 'lucide-react';
import { useAuthStore } from '../../authStore';
import {
  AuthLayout,
  FormField,
  PasswordField,
  PrimaryButton,
  AuthErrorMessage
} from '../../components/auth';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, demoLogin, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);

  const fromLocation = (location.state as any)?.from?.pathname || '/';

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem('bizpulse_remembered_email');
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, []);

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (emailError) setEmailError(null);
    if (localError) setLocalError(null);
    if (error) clearError();
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (passwordError) setPasswordError(null);
    if (localError) setLocalError(null);
    if (error) clearError();
  };

  const validate = (): boolean => {
    let isValid = true;
    setEmailError(null);
    setPasswordError(null);
    setLocalError(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setEmailError('Please enter your business email address.');
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        setEmailError('Please enter a valid email address.');
        isValid = false;
      }
    }

    if (!password) {
      setPasswordError('Please enter your account password.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    clearError();
    setLocalError(null);

    const res = await login(email.trim(), password, rememberMe);
    if (res.success) {
      navigate(fromLocation, { replace: true });
    }
  };

  const handleDemoLogin = async () => {
    clearError();
    setLocalError(null);
    setEmailError(null);
    setPasswordError(null);

    const res = await demoLogin();
    if (res.success) {
      navigate(fromLocation, { replace: true });
    }
  };

  const activeError = localError || error;

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to continue managing your business"
      maxWidth="md"
      footerContent={
        <p className="leading-normal">
          Don&apos;t have an account?{' '}
          <Link
            to="/signup"
            className="font-semibold text-[#1677FF] hover:text-[#0E62D9] dark:text-[#3B82F6] hover:underline focus:outline-none focus:ring-2 focus:ring-[#1677FF] rounded"
          >
            Create an account
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-3.5 sm:space-y-4 w-full box-border">
        {/* Global Error Alert */}
        {activeError && (
          <AuthErrorMessage
            message={activeError}
            onDismiss={() => {
              setLocalError(null);
              clearError();
            }}
          />
        )}

        {/* Business Email Field */}
        <FormField
          id="login-email"
          label="Business Email"
          type="email"
          requiredIndicator
          autoComplete="email"
          placeholder="name@company.com"
          value={email}
          onChange={handleEmailChange}
          error={emailError}
          icon={<Mail className="w-4 h-4 text-[#627D98] dark:text-slate-400" />}
          disabled={isLoading}
        />

        {/* Password Field */}
        <PasswordField
          id="login-password"
          label="Password"
          requiredIndicator
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={handlePasswordChange}
          error={passwordError}
          disabled={isLoading}
          rightLabelLink={
            <Link
              to="/forgot-password"
              className="text-[11px] sm:text-xs font-semibold text-[#1677FF] hover:text-[#0E62D9] dark:text-[#3B82F6] hover:underline focus:outline-none focus:ring-2 focus:ring-[#1677FF] rounded"
            >
              Forgot password?
            </Link>
          }
        />

        {/* Remember Me Checkbox */}
        <div className="flex items-center justify-between pt-0.5 min-h-[32px]">
          <label className="flex items-center space-x-2 cursor-pointer select-none py-1">
            <input
              id="login-remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              disabled={isLoading}
              className="w-4 h-4 rounded border-[#E4EAF0] dark:border-slate-700 text-[#1677FF] focus:ring-[#1677FF] dark:bg-slate-800 transition shrink-0"
            />
            <span className="text-xs text-[#627D98] dark:text-slate-300 font-medium">
              Remember my email
            </span>
          </label>
        </div>

        {/* Primary Submit Button */}
        <div className="pt-1">
          <PrimaryButton
            type="submit"
            isLoading={isLoading}
            loadingText="Signing in..."
          >
            <span>Sign In</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </PrimaryButton>
        </div>

        {/* Divider */}
        <div className="relative my-3 sm:my-3.5 flex items-center justify-center">
          <div className="w-full border-t border-[#E4EAF0] dark:border-slate-800" />
          <span className="absolute px-2.5 bg-white dark:bg-slate-900 text-[10px] sm:text-[11px] font-semibold text-[#627D98] dark:text-slate-400 uppercase tracking-wider">
            or explore
          </span>
        </div>

        {/* Quick Demo Access Button */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={isLoading}
          className="w-full min-h-[42px] sm:min-h-[44px] py-2 px-3 sm:px-4 rounded-xl font-medium text-xs sm:text-sm text-[#102A43] dark:text-slate-200 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800/80 dark:hover:bg-slate-800 border border-[#E4EAF0] dark:border-slate-700 transition-all flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-[#1677FF] disabled:opacity-60 box-border"
        >
          <UserCheck className="w-4 h-4 text-[#00A896] shrink-0" aria-hidden="true" />
          <span className="truncate">Instant Demo (Patel Supermart)</span>
        </button>
      </form>
    </AuthLayout>
  );
}
