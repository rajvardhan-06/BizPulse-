import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Building2, Phone, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../authStore';
import {
  AuthLayout,
  FormField,
  PasswordField,
  PasswordStrengthIndicator,
  PrimaryButton,
  AuthErrorMessage
} from '../../components/auth';

export default function Signup() {
  const navigate = useNavigate();
  const { signup, isLoading, error, clearError } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  // Field validation errors
  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [termsError, setTermsError] = useState<string | null>(null);
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

  const isPasswordSecure =
    passwordRules.minLength &&
    passwordRules.hasUpper &&
    passwordRules.hasLower &&
    passwordRules.hasNumber;

  const validate = (): boolean => {
    let isValid = true;
    setFullNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setTermsError(null);
    setLocalError(null);

    const cleanName = fullName.trim();
    if (!cleanName || cleanName.length < 2) {
      setFullNameError('Please enter your full name (at least 2 characters).');
      isValid = false;
    }

    const cleanEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail) {
      setEmailError('Please enter your business email.');
      isValid = false;
    } else if (!emailRegex.test(cleanEmail)) {
      setEmailError('Please enter a valid email address.');
      isValid = false;
    }

    if (!password) {
      setPasswordError('Please enter a password.');
      isValid = false;
    } else if (!isPasswordSecure) {
      setPasswordError('Password does not meet the security criteria below.');
      isValid = false;
    }

    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password.');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match.');
      isValid = false;
    }

    if (!agreeTerms) {
      setTermsError('You must accept the Terms of Service and Privacy Policy.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    clearError();
    setLocalError(null);

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
    <AuthLayout
      title="Create your BizPulse account"
      subtitle="Start managing your receipts and business insights in one place."
      maxWidth="lg"
      footerContent={
        <p className="leading-normal">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-semibold text-[#1677FF] hover:text-[#0E62D9] dark:text-[#3B82F6] hover:underline focus:outline-none focus:ring-2 focus:ring-[#1677FF] rounded"
          >
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-3 sm:space-y-3.5 w-full box-border">
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

        {/* Full Name */}
        <FormField
          id="signup-name"
          label="Full Name"
          type="text"
          requiredIndicator
          autoComplete="name"
          placeholder="e.g. Ramesh Patel"
          value={fullName}
          onChange={(e) => {
            setFullName(e.target.value);
            if (fullNameError) setFullNameError(null);
            if (error) clearError();
          }}
          error={fullNameError}
          icon={<User className="w-4 h-4 text-[#627D98] dark:text-slate-400" />}
          disabled={isLoading}
        />

        {/* Work Email */}
        <FormField
          id="signup-email"
          label="Work / Business Email"
          type="email"
          requiredIndicator
          autoComplete="email"
          placeholder="owner@yourbusiness.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError(null);
            if (error) clearError();
          }}
          error={emailError}
          icon={<Mail className="w-4 h-4 text-[#627D98] dark:text-slate-400" />}
          disabled={isLoading}
        />

        {/* Optional Business Details Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-3.5">
          <FormField
            id="signup-business-name"
            label="Business Name (Optional)"
            type="text"
            autoComplete="organization"
            placeholder="e.g. Patel Supermart"
            value={businessName}
            onChange={(e) => setBusinessName(e.target.value)}
            icon={<Building2 className="w-4 h-4 text-[#627D98] dark:text-slate-400" />}
            disabled={isLoading}
          />

          <FormField
            id="signup-phone"
            label="Phone Number (Optional)"
            type="tel"
            autoComplete="tel"
            placeholder="+91 98201 23456"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            icon={<Phone className="w-4 h-4 text-[#627D98] dark:text-slate-400" />}
            disabled={isLoading}
          />
        </div>

        {/* Password */}
        <div className="space-y-1.5 sm:space-y-2">
          <PasswordField
            id="signup-password"
            label="Password"
            requiredIndicator
            autoComplete="new-password"
            placeholder="Create a strong password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError(null);
              if (error) clearError();
            }}
            error={passwordError}
            disabled={isLoading}
          />

          {/* Dynamic Password Strength Indicator */}
          <PasswordStrengthIndicator
            password={password}
            confirmPassword={confirmPassword}
          />
        </div>

        {/* Confirm Password */}
        <PasswordField
          id="signup-confirm-password"
          label="Confirm Password"
          requiredIndicator
          autoComplete="new-password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (confirmPasswordError) setConfirmPasswordError(null);
            if (error) clearError();
          }}
          error={confirmPasswordError}
          disabled={isLoading}
        />

        {/* Terms & Privacy Agreement */}
        <div className="pt-0.5">
          <label className="flex items-start space-x-2.5 cursor-pointer select-none">
            <input
              id="signup-terms"
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => {
                setAgreeTerms(e.target.checked);
                if (termsError) setTermsError(null);
              }}
              disabled={isLoading}
              className="w-4 h-4 mt-0.5 rounded border-[#E4EAF0] dark:border-slate-700 text-[#1677FF] focus:ring-[#1677FF] dark:bg-slate-800 transition shrink-0"
            />
            <span className="text-[11px] sm:text-xs text-[#627D98] dark:text-slate-300 leading-normal sm:leading-relaxed">
              I agree to BizPulse&apos;s{' '}
              <span className="font-semibold text-[#102A43] dark:text-slate-100">
                Terms of Service
              </span>{' '}
              and acknowledge the{' '}
              <span className="font-semibold text-[#102A43] dark:text-slate-100">
                Privacy Policy
              </span>.
            </span>
          </label>
          {termsError && (
            <p role="alert" className="text-[11px] sm:text-xs text-[#DC2626] font-medium mt-1 ml-6.5 break-words">
              {termsError}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <div className="pt-1 sm:pt-1.5">
          <PrimaryButton
            type="submit"
            isLoading={isLoading}
            loadingText="Creating account..."
          >
            <span>Create BizPulse Account</span>
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </PrimaryButton>
        </div>
      </form>
    </AuthLayout>
  );
}
