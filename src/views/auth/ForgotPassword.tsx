import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Sparkles, ArrowRight, ArrowLeft, CheckCircle2, AlertCircle, KeyRound } from 'lucide-react';
import { useAuthStore } from '../../authStore';

export default function ForgotPassword() {
  const { forgotPassword, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [demoToken, setDemoToken] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    const res = await forgotPassword(email.trim());
    if (res.success) {
      setSubmitted(true);
      if (res.resetToken) {
        setDemoToken(res.resetToken);
      }
    } else {
      setErrorMsg(res.error || 'Failed to submit request.');
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
          Reset your password
        </h1>
        <p className="mt-2 text-sm text-[#5C7A7D] dark:text-gray-400 max-w-sm mx-auto">
          Enter the email address linked to your business account to receive recovery instructions.
        </p>
      </div>

      {/* Card Container */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white dark:bg-gray-900 py-8 px-6 sm:px-10 shadow-xl shadow-teal-900/5 rounded-3xl border border-teal-100/60 dark:border-gray-800">
          
          {submitted ? (
            <div className="text-center space-y-5 animate-in fade-in zoom-in-95">
              <div className="w-14 h-14 rounded-2xl bg-teal-50 dark:bg-teal-950/50 border border-teal-200 dark:border-teal-800 text-[#028090] dark:text-[#02C39A] flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-[#0B2E33] dark:text-gray-100 mb-2">Check your inbox</h3>
                <p className="text-sm text-[#5C7A7D] dark:text-gray-400 leading-relaxed">
                  If an account is associated with <span className="font-semibold text-[#0B2E33] dark:text-gray-200">{email}</span>, you will receive password reset instructions.
                </p>
              </div>

              {demoToken && (
                <div className="p-4 rounded-2xl bg-teal-50/70 dark:bg-gray-800/80 border border-teal-200 dark:border-teal-900 text-left space-y-2">
                  <div className="flex items-center space-x-2 text-xs font-bold text-[#028090] dark:text-[#02C39A] uppercase tracking-wider">
                    <KeyRound className="w-4 h-4" />
                    <span>Immediate Reset Link (Preview Sandbox)</span>
                  </div>
                  <p className="text-xs text-[#5C7A7D] dark:text-gray-400">
                    In this preview container environment, click below to test the password reset screen directly:
                  </p>
                  <Link
                    to={`/reset-password?token=${demoToken}`}
                    className="inline-flex items-center space-x-2 py-2.5 px-4 rounded-xl bg-[#028090] text-white text-xs font-semibold hover:bg-[#00A896] transition-colors"
                  >
                    <span>Proceed to Password Reset</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-2 text-sm font-semibold text-[#028090] dark:text-[#02C39A] hover:underline"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Return to Login</span>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMsg && (
                <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-sm flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                  <div className="flex-1 font-medium">{errorMsg}</div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-[#0B2E33] dark:text-gray-300 uppercase tracking-wider mb-2">
                  Registered Email Address
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
                    placeholder="merchant@yourbusiness.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-gray-50/50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#028090] text-[#0B2E33] dark:text-gray-100 placeholder-gray-400 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center py-4 px-6 rounded-2xl shadow-lg shadow-[#028090]/25 bg-gradient-to-r from-[#028090] to-[#00A896] hover:from-[#00A896] hover:to-[#02C39A] text-white font-semibold text-sm transition-all transform active:scale-[0.98] disabled:opacity-60"
              >
                {isLoading ? (
                  <span>Sending instructions...</span>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span>Send Recovery Instructions</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </button>

              <div className="pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
                <Link
                  to="/login"
                  className="inline-flex items-center space-x-1.5 text-xs font-semibold text-[#5C7A7D] hover:text-[#028090] dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Remember password? Log In</span>
                </Link>
              </div>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
