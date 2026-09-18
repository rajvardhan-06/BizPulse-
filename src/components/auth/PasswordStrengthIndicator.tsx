import React, { useMemo } from 'react';
import { Check, X } from 'lucide-react';

export interface PasswordStrengthIndicatorProps {
  password: string;
  confirmPassword?: string;
  showConfirmRule?: boolean;
}

export const PasswordStrengthIndicator: React.FC<PasswordStrengthIndicatorProps> = ({
  password,
  confirmPassword = '',
  showConfirmRule = false
}) => {
  const rules = useMemo(() => {
    return {
      minLength: password.length >= 8,
      hasUpper: /[A-Z]/.test(password),
      hasLower: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      matchesConfirm: confirmPassword.length > 0 && password === confirmPassword
    };
  }, [password, confirmPassword]);

  // Score from 0 to 4 based on complexity
  const score = useMemo(() => {
    let s = 0;
    if (rules.minLength) s += 1;
    if (rules.hasUpper) s += 1;
    if (rules.hasLower) s += 1;
    if (rules.hasNumber) s += 1;
    return s;
  }, [rules]);

  const strengthConfig = useMemo(() => {
    if (password.length === 0) {
      return { label: 'Enter a secure password', color: 'bg-slate-200 dark:bg-slate-700', text: 'text-slate-400' };
    }
    if (score <= 1) {
      return { label: 'Weak', color: 'bg-[#DC2626]', text: 'text-[#DC2626]' };
    }
    if (score === 2) {
      return { label: 'Fair', color: 'bg-[#D97706]', text: 'text-[#D97706]' };
    }
    if (score === 3) {
      return { label: 'Good', color: 'bg-[#3B82F6]', text: 'text-[#3B82F6]' };
    }
    return { label: 'Strong', color: 'bg-[#16A34A]', text: 'text-[#16A34A]' };
  }, [password.length, score]);

  if (!password && !confirmPassword) return null;

  return (
    <div className="space-y-2 p-2.5 sm:p-3 rounded-xl bg-slate-50 dark:bg-slate-850/60 border border-[#E4EAF0] dark:border-slate-800 text-xs w-full min-w-0 box-border">
      {/* Strength Bar */}
      <div className="space-y-1">
        <div className="flex items-center justify-between text-[10px] sm:text-[11px] font-semibold">
          <span className="text-[#627D98] dark:text-slate-400">Password Strength</span>
          <span className={strengthConfig.text}>{strengthConfig.label}</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5 h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
          <div className={`h-full transition-all duration-300 ${score >= 1 ? strengthConfig.color : 'bg-transparent'}`} />
          <div className={`h-full transition-all duration-300 ${score >= 2 ? strengthConfig.color : 'bg-transparent'}`} />
          <div className={`h-full transition-all duration-300 ${score >= 3 ? strengthConfig.color : 'bg-transparent'}`} />
          <div className={`h-full transition-all duration-300 ${score >= 4 ? strengthConfig.color : 'bg-transparent'}`} />
        </div>
      </div>

      {/* Security Requirements Checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 sm:gap-1.5 pt-0.5">
        <RequirementItem met={rules.minLength} label="At least 8 characters" />
        <RequirementItem met={rules.hasUpper} label="One uppercase (A-Z)" />
        <RequirementItem met={rules.hasLower} label="One lowercase (a-z)" />
        <RequirementItem met={rules.hasNumber} label="One number (0-9)" />
        {showConfirmRule && confirmPassword.length > 0 && (
          <div className="sm:col-span-2">
            <RequirementItem met={rules.matchesConfirm} label="Passwords match" />
          </div>
        )}
      </div>
    </div>
  );
};

const RequirementItem: React.FC<{ met: boolean; label: string }> = ({ met, label }) => (
  <div className="flex items-center space-x-1.5 min-w-0">
    {met ? (
      <Check className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
    ) : (
      <X className="w-3.5 h-3.5 text-[#94A3B8] dark:text-slate-500 shrink-0" />
    )}
    <span className={`text-[11px] sm:text-xs truncate ${met ? 'text-[#102A43] dark:text-slate-200 font-medium' : 'text-[#627D98] dark:text-slate-400'}`}>
      {label}
    </span>
  </div>
);

export default PasswordStrengthIndicator;
