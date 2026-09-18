import React from 'react';
import { Loader2 } from 'lucide-react';

export interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'outline';
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({
  children,
  isLoading = false,
  loadingText = 'Processing...',
  variant = 'primary',
  disabled,
  className = '',
  ...props
}) => {
  const baseStyles =
    'w-full min-h-[44px] py-2.5 sm:py-3 px-4 sm:px-6 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center space-x-2 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed select-none active:scale-[0.99]';

  const variantStyles = {
    primary:
      'bg-[#1677FF] hover:bg-[#0E62D9] active:bg-[#0952BC] text-white shadow-sm shadow-[#1677FF]/25 focus:ring-[#1677FF]',
    secondary:
      'bg-[#102A43] hover:bg-[#0B1E30] text-white shadow-sm focus:ring-[#102A43]',
    outline:
      'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800 text-[#102A43] dark:text-slate-200 border border-[#E4EAF0] dark:border-slate-700 focus:ring-[#1677FF]'
  };

  return (
    <button
      disabled={disabled || isLoading}
      className={`${baseStyles} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />
          <span>{loadingText}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default PrimaryButton;
