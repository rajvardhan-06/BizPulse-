import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, Eye, EyeOff, Sparkles, ArrowRight, CheckCircle2, AlertCircle, Check, X } from 'lucide-react';
import { useAuthStore } from '../../authStore';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { resetPassword, isLoading } = useAuthStore();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Password rules validation
  const passwordRules = useMemo(() => {
    return {
      minLength: newPassword.length >= 8,
      hasUpper: /[A-Z]/.test(newPassword),
      hasLower: /[a-z]/.test(newPassword),
      hasNumber: /[0-9]/.test(newPassword),
      matchesConfirm: newPassword.length > 0 && newPassword === confirmPassword
    };
  }, [newPassword, confirmPassword]);

  const isPasswordValid = passwordRules.minLength && passwordRules.hasUpper && passwordRules.hasLower && passwordRules.hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!token) {
      setErrorMsg('Missing password reset security token. Please request a new reset link.');
      return;
    }

    if (!isPasswordValid) {
      setErrorMsg('Please satisfy all password security requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMsg('Passwords do not match.');
      return;
    }

    const res = await resetPassword({ token, newPassword, confirmPassword });
    if (res.success) {
      setIsSuccess(true);
    } else {
      setErrorMsg(res.error || 'Failed to reset password. The link may have expired.');
    }
  };

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
          Create New Password
        </h1>
        <p className="mt-2 text-sm text-[#5C7A7D] dark:text-gray-400 max-w-sm mx-auto">
          Choose a strong, private password for your business account.
        </p>
      </div>

      {/* Card Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-gray-900 py-8 px-6 sm:px-10 shadow-xl shadow-teal-900/5 rounded-3xl border border-teal-100/60 dark:border-gray-800">
          
          {isSuccess ? (
            <div className="text-center space-y-5 animate-in fade-in zoom-in-95">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-[#028090] dark:text-[#02C39A] flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#0B2E33] dark:text-gray-100 mb-2">Password Updated!</h3>
                <p className="text-sm text-[#5C7A7D] dark:text-gray-400 leading-relaxed">
                  Your password has been changed securely. All prior active sessions have been invalidated.
                </p>
              </div>

              <div className="pt-3">
                <Link
                  to="/login"
                  className="w-full flex items-center justify-center py-4 px-6 rounded-2xl shadow-lg shadow-[#028090]/25 bg-gradient-to-r from-[#028090] to-[#00A896] hover:from-[#00A896] hover:to-[#02C39A] text-white font-semibold text-sm transition-all"
                >
                  <span>Log In to BizPulse</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </div>
            </div>
          ) : !token ? (
            <div className="text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mx-auto">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[#0B2E33] dark:text-gray-100">Invalid Reset Link</h3>
              <p className="text-xs text-[#5C7A7D] dark:text-gray-400">
                This reset link is missing a security token or has already been used.
              </p>
              <Link
                to="/forgot-password"
                className="inline-block py-3 px-5 rounded-2xl bg-[#028090] text-white font-semibold text-xs hover:bg-[#00A896]"
              >
                Request New Reset Link
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-sm flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <div className="flex-1 font-medium">{errorMsg}</div>
                </div>
              )}

              {/* New Password */}
              <div>
                <label className="block text-xs font-bold text-[#0B2E33] dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative rounded-2xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
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
                <div className="mt-2 p-3 rounded-2xl bg-gray-50/80 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 text-xs space-y-1">
                  <div className="font-semibold text-gray-500 dark:text-gray-400">Security criteria:</div>
                  <div className="grid grid-cols-2 gap-1 text-[11px]">
                    <div className={`flex items-center space-x-1.5 ${passwordRules.minLength ? 'text-teal-600 font-medium' : 'text-gray-400'}`}>
                      {passwordRules.minLength ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                      <span>8+ characters</span>
                    </div>
                    <div className={`flex items-center space-x-1.5 ${passwordRules.hasUpper ? 'text-teal-600 font-medium' : 'text-gray-400'}`}>
                      {passwordRules.hasUpper ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                      <span>1 uppercase</span>
                    </div>
                    <div className={`flex items-center space-x-1.5 ${passwordRules.hasLower ? 'text-teal-600 font-medium' : 'text-gray-400'}`}>
                      {passwordRules.hasLower ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                      <span>1 lowercase</span>
                    </div>
                    <div className={`flex items-center space-x-1.5 ${passwordRules.hasNumber ? 'text-teal-600 font-medium' : 'text-gray-400'}`}>
                      {passwordRules.hasNumber ? <Check className="w-3.5 h-3.5 shrink-0" /> : <X className="w-3.5 h-3.5 shrink-0" />}
                      <span>1 number</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Confirm Password */}
              <div>
                <label className="block text-xs font-bold text-[#0B2E33] dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Confirm Password
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
                    placeholder="Repeat new password"
                    className="w-full pl-11 pr-4 py-3 bg-gray-50/50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#028090] text-[#0B2E33] dark:text-gray-100 placeholder-gray-400 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center py-4 px-6 rounded-2xl shadow-lg shadow-[#028090]/25 bg-gradient-to-r from-[#028090] to-[#00A896] hover:from-[#00A896] hover:to-[#02C39A] text-white font-semibold text-sm transition-all transform active:scale-[0.98] disabled:opacity-60"
              >
                {isLoading ? (
                  <span>Updating password...</span>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Set New Password</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </button>

              <div className="pt-3 border-t border-gray-100 dark:border-gray-800 text-center">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-[#028090] dark:text-[#02C39A] hover:underline"
                >
                  Return to Login
                </Link>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
