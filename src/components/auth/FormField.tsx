import React from 'react';

export interface FormFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id: string;
  label: string;
  icon?: React.ReactNode;
  error?: string | null;
  helperText?: string;
  requiredIndicator?: boolean;
}

export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  icon,
  error,
  helperText,
  requiredIndicator = false,
  className = '',
  disabled,
  onFocus,
  ...props
}) => {
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
      <div className="flex items-center justify-between">
        <label
          htmlFor={id}
          className="block text-xs font-semibold text-[#102A43] dark:text-slate-200 tracking-wide select-none"
        >
          {label}
          {requiredIndicator && <span className="text-[#DC2626] ml-1" aria-hidden="true">*</span>}
        </label>
      </div>

      <div className="relative rounded-xl shadow-xs w-full">
        {icon && (
          <div
            className="absolute inset-y-0 left-0 pl-3 sm:pl-3.5 flex items-center pointer-events-none text-[#627D98] dark:text-slate-400 shrink-0"
            aria-hidden="true"
          >
            {icon}
          </div>
        )}
        <input
          id={id}
          disabled={disabled}
          onFocus={handleFocus}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : helperText ? `${id}-helper` : undefined}
          className={`w-full min-w-0 min-h-[42px] sm:min-h-[44px] ${icon ? 'pl-9 sm:pl-10.5' : 'pl-3 sm:pl-3.5'} pr-3.5 py-2 sm:py-2.5 bg-white dark:bg-slate-800 border ${
            error
              ? 'border-[#DC2626] focus:ring-2 focus:ring-[#DC2626]/20 focus:border-[#DC2626]'
              : 'border-[#E4EAF0] dark:border-slate-700 hover:border-[#CBD5E1] dark:hover:border-slate-600 focus:border-[#1677FF] focus:ring-2 focus:ring-[#1677FF]/15'
          } rounded-xl text-base sm:text-sm text-[#102A43] dark:text-slate-100 placeholder-[#94A3B8] dark:placeholder-slate-500 transition-all outline-none disabled:bg-slate-50 dark:disabled:bg-slate-850 disabled:opacity-60 disabled:cursor-not-allowed box-border ${className}`}
          {...props}
        />
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

export default FormField;
