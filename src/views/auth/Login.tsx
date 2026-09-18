import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, Sparkles, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '../../authStore';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, demoLogin, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  const fromLocation = (location.state as any)?.from?.pathname || '/';

  const handleDemoLogin = async () => {
    clearError();
    setLocalError(null);
    const res = await demoLogin();
    if (res.success) {
      navigate(fromLocation, { replace: true });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!email.trim() || !password) {
      setLocalError('Please enter both your email address and password.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    const res = await login(email.trim(), password);
    if (res.success) {
      navigate(fromLocation, { replace: true });
    }
  };

  const activeError = localError || error;

  return (
    <div className="min-h-screen bg-[#F4FAF9] dark:bg-gray-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 transition-colors duration-300">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <Link to="/" className="inline-flex items-center space-x-3 mb-6 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#028090] to-[#02C39A] flex items-center justify-center shadow-lg shadow-[#028090]/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="font-serif text-3xl font-bold text-[#0B2E33] dark:text-gray-100 tracking-tight">BizPulse</span>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0B2E33] dark:text-gray-100">
          Welcome back to BizPulse
        </h1>
        <p className="mt-2 text-sm text-[#5C7A7D] dark:text-gray-400 max-w-sm mx-auto">
          Continue managing your business insights.
        </p>
      </div>

      {/* Card Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-gray-900 py-8 px-6 sm:px-10 shadow-xl shadow-teal-900/5 rounded-3xl border border-teal-100/60 dark:border-gray-800">
          
          {activeError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-sm flex items-start space-x-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="flex-1 font-medium">{activeError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-[#0B2E33] dark:text-gray-300 uppercase tracking-wider mb-2">
                Business Email
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="merchant@yourbusiness.com"
                  className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#028090] focus:border-transparent text-[#0B2E33] dark:text-gray-100 placeholder-gray-400 transition-all"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold text-[#0B2E33] dark:text-gray-300 uppercase tracking-wider">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[#028090] hover:text-[#00A896] dark:text-[#02C39A] transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full pl-11 pr-11 py-3.5 bg-gray-50/50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#028090] focus:border-transparent text-[#0B2E33] dark:text-gray-100 placeholder-gray-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center py-4 px-6 rounded-2xl shadow-lg shadow-[#028090]/25 bg-gradient-to-r from-[#028090] to-[#00A896] hover:from-[#00A896] hover:to-[#02C39A] text-white font-semibold text-sm transition-all transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                    <span>Verifying credentials...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Log In</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </button>
            </div>

            {/* Quick Demo Login Option */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center py-3.5 px-6 rounded-2xl bg-teal-50 hover:bg-teal-100/80 dark:bg-gray-800 dark:hover:bg-gray-750 border border-teal-200/80 dark:border-gray-700 text-[#028090] dark:text-[#02C39A] font-semibold text-xs transition-all space-x-2 disabled:opacity-60"
              >
                <Sparkles className="w-4 h-4 text-[#028090] dark:text-[#02C39A]" />
                <span>Explore with Demo Merchant Account</span>
              </button>
            </div>
          </form>

          {/* Quick Demo Test Credential Helper */}
          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 text-center">
            <div className="text-xs text-[#5C7A7D] dark:text-gray-400 mb-2">
              Don't have a BizPulse account yet?
            </div>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center w-full py-3 px-4 rounded-2xl border border-teal-200 dark:border-gray-700 text-[#028090] dark:text-[#02C39A] font-semibold text-xs hover:bg-teal-50/50 dark:hover:bg-gray-800 transition-colors"
            >
              Create BizPulse Account
            </Link>
          </div>

        </div>

        {/* Security Footer Note */}
        <div className="mt-8 text-center text-xs text-[#5C7A7D] dark:text-gray-400 space-y-1">
          <p className="flex items-center justify-center space-x-1">
            <Lock className="w-3.5 h-3.5 text-[#028090] dark:text-[#02C39A]" />
            <span>End-to-end encrypted session with isolated merchant data</span>
          </p>
          <p>© {new Date().getFullYear()} BizPulse • AI-Powered Business Intelligence</p>
        </div>
      </div>
    </div>
  );
}
