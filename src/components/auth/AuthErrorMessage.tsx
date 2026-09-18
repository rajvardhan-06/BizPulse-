import React from 'react';
import { AlertCircle, X } from 'lucide-react';

interface AuthErrorMessageProps {
  message: string | null;
  onDismiss?: () => void;
  className?: string;
}

export const AuthErrorMessage: React.FC<AuthErrorMessageProps> = ({
  message,
  onDismiss,
  className = ''
}) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={`p-3.5 sm:p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-[#DC2626] dark:text-red-300 text-sm flex items-start space-x-3 transition-all ${className}`}
    >
      <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-[#DC2626] dark:text-red-400" />
      <div className="flex-1 font-medium text-xs sm:text-sm leading-relaxed">{message}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="shrink-0 text-red-400 hover:text-red-600 dark:hover:text-red-200 p-0.5 rounded transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
};

export default AuthErrorMessage;
