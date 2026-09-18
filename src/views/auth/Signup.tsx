import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, User, Building2, Phone, Sparkles, ArrowRight, AlertCircle, Check, X } from 'lucide-react';
import { useAuthStore } from '../../authStore';

export default function Signup() {
  const navigate = useNavigate();
  const { signup, isLoading, error, clearError } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  // Password rules validation
  const passwordRules = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      matchesConfirm: password.length > 0 && password === confirmPassword
    };
  }, [password, confirmPassword]);

  const isPasswordValid = passwordRules.minLength && passwordRules.hasUpper && passwordRules.hasLower && passwordRules.hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (!fullName.trim() || fullName.trim().length < 2) {
      setLocalError('Please enter your full name (at least 2 characters).');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setLocalError('Please enter a valid email address.');
      return;
    }

    if (!isPasswordValid) {
      setLocalError('Please meet all password security requirements.');
      return;
    }

    if (password !== confirmPassword) {
      setLocalError('Passwords do not match.');
      return;
    }

    const res = await signup({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      confirmPassword,
      businessName: businessName.trim() || undefined,
      phoneNumber: phoneNumber.trim() || undefined
    });

    if (res.success) {
      navigate('/onboarding', { replace: true });
    }
  };

  const activeError = localError || error;

  return (
    <div className="min-h-screen bg-[#F4FAF9] dark:bg-gray-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 transition-colors duration-300">
      
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center px-4">
        <Link to="/" className="inline-flex items-center space-x-3 mb-5 group">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#028090] to-[#02C39A] flex items-center justify-center shadow-lg shadow-[#028090]/20 group-hover:scale-105 transition-transform">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <span className="font-serif text-3xl font-bold text-[#0B2E33] dark:text-gray-100 tracking-tight">BizPulse</span>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#0B2E33] dark:text-gray-100">
          Create your BizPulse account
        </h1>
        <p className="mt-2 text-sm text-[#5C7A7D] dark:text-gray-400 max-w-sm mx-auto">
          Organize your business purchases and turn receipts into smarter insights.
        </p>
      </div>

      {/* Card Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4 sm:px-0">
        <div className="bg-white dark:bg-gray-900 py-8 px-6 sm:px-10 shadow-xl shadow-teal-900/5 rounded-3xl border border-teal-100/60 dark:border-gray-800">
          
          {activeError && (
            <div className="mb-6 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-sm flex items-start space-x-3 animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="flex-1 font-medium">{activeError}</div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div>
              <label className="block text-xs font-bold text-[#0B2E33] dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Full Name <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <User className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Patel"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50/50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#028090] text-[#0B2E33] dark:text-gray-100 placeholder-gray-400 transition-all"
                />
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label className="block text-xs font-bold text-[#0B2E33] dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Work Email <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="owner@yourstore.com"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50/50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#028090] text-[#0B2E33] dark:text-gray-100 placeholder-gray-400 transition-all"
                />
              </div>
            </div>

            {/* Optional Business Name & Phone Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-[#0B2E33] dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Business Name <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <div className="relative rounded-2xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="Patel Supermart"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50/50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#028090] text-[#0B2E33] dark:text-gray-100 placeholder-gray-400 transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0B2E33] dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Phone Number <span className="text-gray-400 font-normal lowercase">(optional)</span>
                </label>
                <div className="relative rounded-2xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50/50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#028090] text-[#0B2E33] dark:text-gray-100 placeholder-gray-400 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Password Field */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-[#0B2E33] dark:text-gray-300 uppercase tracking-wider">
                  Password <span className="text-rose-500">*</span>
                </label>
              </div>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  className="w-full pl-11 pr-11 py-3 bg-gray-50/50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#028090] text-[#0B2E33] dark:text-gray-100 placeholder-gray-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>

              {/* Password Requirements Checklist */}
              <div className="mt-2.5 p-3 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 text-xs space-y-1.5">
                <div className="font-semibold text-gray-500 dark:text-gray-400">Security standard:</div>
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <div className={`flex items-center space-x-1.5 ${passwordRules.minLength ? 'text-teal-600 dark:text-teal-400 font-medium' : 'text-gray-400'}`}>
                    {passwordRules.minLength ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                    <span>8+ characters</span>
                  </div>
                  <div className={`flex items-center space-x-1.5 ${passwordRules.hasUpper ? 'text-teal-600 dark:text-teal-400 font-medium' : 'text-gray-400'}`}>
                    {passwordRules.hasUpper ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                    <span>1 uppercase letter</span>
                  </div>
                  <div className={`flex items-center space-x-1.5 ${passwordRules.hasLower ? 'text-teal-600 dark:text-teal-400 font-medium' : 'text-gray-400'}`}>
                    {passwordRules.hasLower ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                    <span>1 lowercase letter</span>
                  </div>
                  <div className={`flex items-center space-x-1.5 ${passwordRules.hasNumber ? 'text-teal-600 dark:text-teal-400 font-medium' : 'text-gray-400'}`}>
                    {passwordRules.hasNumber ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                    <span>1 numeric digit</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label className="block text-xs font-bold text-[#0B2E33] dark:text-gray-300 uppercase tracking-wider mb-1.5">
                Confirm Password <span className="text-rose-500">*</span>
              </label>
              <div className="relative rounded-2xl shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full pl-11 pr-4 py-3 bg-gray-50/50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#028090] text-[#0B2E33] dark:text-gray-100 placeholder-gray-400 transition-all"
                />
              </div>
              {confirmPassword.length > 0 && !passwordRules.matchesConfirm && (
                <p className="mt-1 text-xs text-rose-500">Passwords do not match.</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center py-4 px-6 rounded-2xl shadow-lg shadow-[#028090]/25 bg-gradient-to-r from-[#028090] to-[#00A896] hover:from-[#00A896] hover:to-[#02C39A] text-white font-semibold text-sm transition-all transform active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                    <span>Creating your account...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </button>
            </div>
          </form>

          {/* Secondary Action */}
          <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-800 text-center">
            <span className="text-xs text-[#5C7A7D] dark:text-gray-400">
              Already have an account?{' '}
            </span>
            <Link
              to="/login"
              className="text-xs font-bold text-[#028090] hover:text-[#00A896] dark:text-[#02C39A] transition-colors"
            >
              Log In
            </Link>
          </div>

        </div>

        {/* Security / Privacy notice */}
        <div className="mt-6 text-center text-xs text-[#5C7A7D] dark:text-gray-400">
          By signing up, you agree to BizPulse's private, merchant-isolated data policy.
        </div>
      </div>
    </div>
  );
}
