import React, { useState } from 'react';
import { Lock, Eye, EyeOff } from 'lucide-react';

export interface PasswordFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  error?: string | null;
  helperText?: string;
  requiredIndicator?: boolean;
  rightLabelLink?: React.ReactNode;
}

export const PasswordField: React.FC<PasswordFieldProps> = ({
  id,
  label,
  error,
  helperText,
  requiredIndicator = false,
  rightLabelLink,
  className = '',
  disabled,
  onFocus,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Ensure focused field stays in viewport on mobile keyboards
    if (typeof window !== 'undefined' && window.innerWidth < 640) {
      setTimeout(() => {
        e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 250);
    }
    if (onFocus) onFocus(e);
  };

  return (
    <div className="space-y-1 sm:space-y-1.5 w-full min-w-0">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-[#102A43] dark:text-slate-200 tracking-wide select-none truncate"
        >
          {label}
          {requiredIndicator && <span className="text-[#DC2626] ml-1" aria-hidden="true">*</span>}
        </label>
        {rightLabelLink && (
          <div className="shrink-0 text-right">
            {rightLabelLink}
          </div>
        )}
      </div>

      <div className="relative rounded-xl shadow-xs w-full">
        <div
          className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none text-[#627D98] dark:text-slate-400 shrink-0"
          aria-hidden="true"
        >
          <Lock className="w-4 h-4 text-[#627D98] dark:text-slate-400" />
        </div>

        <input
          id={id}
          type={showPassword ? 'text' : 'password'}
          disabled={disabled}
          onFocus={handleFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          className={`w-full min-w-0 min-h-[42px] sm:min-h-[44px] pl-9 sm:pl-10.5 pr-10 sm:pr-11 py-2 sm:py-2.5 bg-white dark:bg-slate-800 border ${
            error
              ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]'
              : 'border-[#E4EAF0] dark:border-slate-700 hover:border-[#CBD5E1] dark:hover:border-slate-600 focus:border-[#1677FF] focus:ring-2 focus:ring-[#1677FF]/15'
          } rounded-xl text-base sm:text-sm text-[#102A43] dark:text-slate-100 placeholder-[#94A3B8] dark:placeholder-slate-500 transition-all outline-none disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:opacity-60 disabled:cursor-not-allowed box-border ${className}`}
          {...props}
        />

        <button
          type="button"
          onClick={() => setShowPassword((prev) => !prev)}
          disabled={disabled}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          className="absolute inset-y-0 right-0 pr-2.5 sm:pr-3 flex items-center text-[#627D98] hover:text-[#102A43] dark:text-slate-400 dark:hover:text-slate-200 transition-colors focus:outline-none focus:ring-2 focus:ring-[#1677FF]/30 rounded-lg p-1"
        >
          {showPassword ? (
            <EyeOff className="w-4 h-4 sm:w-4.5 sm:h-4.5" aria-hidden="true" />
          ) : (
            <Eye className="w-4 h-4 sm:w-4.5 sm:h-4.5" aria-hidden="true" />
          )}
        </button>
      </div>

      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[11px] sm:text-xs text-[#DC2626] font-medium mt-1 break-words">
          {error}
        </p>
      ) : helperText ? (
        <p id={`${id}-helper`} className="text-[11px] sm:text-xs text-[#627D98] dark:text-slate-400 mt-1 break-words">
          {helperText}
        </p>
      ) : null}
    </div>
  );
};

export default PasswordField;
