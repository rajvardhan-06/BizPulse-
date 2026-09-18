import React, { useState, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, ArrowLeft, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../../authStore';
import {
  AuthLayout,
  PasswordField,
  PasswordStrengthIndicator,
  PrimaryButton,
  AuthErrorMessage
} from '../../components/auth';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const navigate = useNavigate();
  const { resetPassword, isLoading } = useAuthStore();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
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

  const isPasswordValid =
    passwordRules.minLength &&
    passwordRules.hasUpper &&
    passwordRules.hasLower &&
    passwordRules.hasNumber;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setPasswordError(null);
    setConfirmPasswordError(null);

    if (!token) {
      setErrorMsg('Missing password reset security token. Please request a new link.');
      return;
    }

    if (!isPasswordValid) {
      setPasswordError('Please satisfy all password security requirements.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
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
    <AuthLayout
      title="Create New Password"
      subtitle="Choose a strong, private password for your business account."
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
      {isSuccess ? (
        <div className="text-center space-y-4 py-2 animate-in fade-in">
          <div className="w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[#16A34A] flex items-center justify-center mx-auto shadow-xs">
            <CheckCircle2 className="w-6 h-6" />
          </div>

          <div>
            <h2 className="text-base font-bold text-[#102A43] dark:text-slate-100 mb-1.5">
              Password Updated Successfully
            </h2>
            <p className="text-xs sm:text-sm text-[#627D98] dark:text-slate-400 leading-relaxed">
              Your password has been changed securely. All previous active sessions have been invalidated.
            </p>
          </div>

          <div className="pt-3">
            <PrimaryButton
              type="button"
              onClick={() => navigate('/login', { replace: true })}
            >
              <span>Sign In with New Password</span>
              <ArrowRight className="w-4 h-4" />
            </PrimaryButton>
          </div>
        </div>
      ) : !token ? (
        <div className="text-center space-y-4 py-2">
          <div className="w-12 h-12 rounded-full bg-red-50 dark:bg-red-950/40 text-[#DC2626] flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-base font-bold text-[#102A43] dark:text-slate-100">
            Invalid or Missing Reset Link
          </h2>
          <p className="text-xs text-[#627D98] dark:text-slate-400 max-w-xs mx-auto">
            This reset link is missing a security token or may have expired. Please request a new one.
          </p>
          <div className="pt-2">
            <Link
              to="/forgot-password"
              className="inline-flex items-center justify-center min-h-[44px] py-2.5 px-5 rounded-xl bg-[#1677FF] text-white text-xs sm:text-sm font-semibold hover:bg-[#0E62D9] transition"
            >
              Request New Reset Link
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

          <div className="space-y-1.5 sm:space-y-2">
            <PasswordField
              id="reset-new-password"
              label="New Password"
              requiredIndicator
              autoComplete="new-password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (passwordError) setPasswordError(null);
                if (errorMsg) setErrorMsg(null);
              }}
              error={passwordError}
              disabled={isLoading}
            />

            <PasswordStrengthIndicator
              password={newPassword}
              confirmPassword={confirmPassword}
            />
          </div>

          <PasswordField
            id="reset-confirm-password"
            label="Confirm New Password"
            requiredIndicator
            autoComplete="new-password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              if (confirmPasswordError) setConfirmPasswordError(null);
              if (errorMsg) setErrorMsg(null);
            }}
            error={confirmPasswordError}
            disabled={isLoading}
          />

          <div className="pt-1">
            <PrimaryButton
              type="submit"
              isLoading={isLoading}
              loadingText="Updating password..."
            >
              <span>Set New Password</span>
              <ArrowRight className="w-4 h-4" />
            </PrimaryButton>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
