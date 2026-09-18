import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { useAuthStore } from '../../authStore';
import {
  AuthLayout,
  FormField,
  PrimaryButton,
  AuthErrorMessage
} from '../../components/auth';

export default function ForgotPassword() {
  const { forgotPassword, isLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [demoToken, setDemoToken] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMsg('Please enter your business email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setErrorMsg('Please enter a valid email address.');
      return;
    }

    const res = await forgotPassword(cleanEmail);
    if (res.success) {
      setSubmitted(true);
      if (res.resetToken) {
        setDemoToken(res.resetToken);
      }
    } else {
      setErrorMsg(res.error || 'Failed to submit recovery request.');
    }
  };

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter your business email to receive recovery instructions."
      maxWidth="md"
      footerContent={
        <Link
          to="/login"
          className="inline-flex items-center space-x-1.5 font-semibold text-[#1677FF] hover:text-[#0E62D9] dark:text-[#3B82F6] hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to login</span>
        </Link>
      }
    >
      {submitted ? (
        <div className="text-center space-y-4 py-2 animate-in fade-in">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[#16A34A] flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-base font-bold text-[#102A43] dark:text-slate-100 mb-1.5">
              Check your inbox
            </h2>
            <p className="text-xs sm:text-sm text-[#627D98] dark:text-slate-400 leading-relaxed">
              If an account is registered with{' '}
              <span className="font-semibold text-[#102A43] dark:text-slate-200">{email}</span>,
              we have sent instructions to reset your password.
            </p>
          </div>

          {demoToken && (
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-slate-800/90 border border-blue-200 dark:border-blue-900/60 text-left space-y-2">
              <div className="flex items-center space-x-2 text-xs font-bold text-[#1677FF] dark:text-[#3B82F6] uppercase tracking-wide">
                <KeyRound className="w-4 h-4" />
                <span>Immediate Reset Token (Preview Sandbox)</span>
              </div>
              <p className="text-xs text-[#627D98] dark:text-slate-400">
                In this preview container sandbox, click below to proceed directly to the reset screen:
              </p>
              <Link
                to={`/reset-password?token=${demoToken}`}
                className="inline-flex items-center space-x-2 py-2 px-3.5 rounded-lg bg-[#1677FF] text-white text-xs font-semibold hover:bg-[#0E62D9] transition-colors shadow-xs"
              >
                <span>Proceed to Password Reset</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}

          <div className="pt-3">
            <Link
              to="/login"
              className="w-full flex items-center justify-center min-h-[44px] py-2.5 px-4 rounded-xl border border-[#E4EAF0] dark:border-slate-700 text-xs sm:text-sm font-semibold text-[#102A43] dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} noValidate className="space-y-3.5 sm:space-y-4 w-full box-border">
          {errorMsg && (
            <AuthErrorMessage
              message={errorMsg}
              onDismiss={() => setErrorMsg(null)}
            />
          )}

          <FormField
            id="forgot-email"
            label="Registered Business Email"
            type="email"
            requiredIndicator
            autoComplete="email"
            placeholder="name@business.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            icon={<Mail className="w-4 h-4 text-[#627D98] dark:text-slate-400" />}
            disabled={isLoading}
          />

          <div className="pt-1">
            <PrimaryButton
              type="submit"
              isLoading={isLoading}
              loadingText="Sending instructions..."
            >
              <span>Send Recovery Instructions</span>
              <ArrowRight className="w-4 h-4" />
            </PrimaryButton>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
