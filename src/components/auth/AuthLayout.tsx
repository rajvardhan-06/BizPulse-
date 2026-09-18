import React from 'react';
import { Link } from 'react-router-dom';
import { BizPulseLogo } from '../BizPulseLogo';
import { ShieldCheck } from 'lucide-react';

export interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  footerContent?: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({
  title,
  subtitle,
  children,
  footerContent,
  maxWidth = 'md'
}) => {
  const maxWidthClass = {
    sm: 'max-w-xs sm:max-w-sm',
    md: 'max-w-sm sm:max-w-md',
    lg: 'max-w-md sm:max-w-lg md:max-w-xl',
    xl: 'max-w-lg sm:max-w-xl md:max-w-2xl'
  }[maxWidth];

  return (
    <div className="min-h-screen min-h-[100dvh] w-full bg-[#F6F9FC] dark:bg-[#0B132B] text-[#102A43] dark:text-slate-100 flex flex-col justify-between pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] px-3.5 sm:px-6 lg:px-8 transition-colors duration-200 overflow-x-hidden box-border">
      
      {/* Centered Main Section */}
      <div className="w-full flex-1 flex flex-col justify-center items-center my-auto py-2 sm:py-4">
        
        {/* Brand Header */}
        <div className="w-full max-w-sm sm:max-w-md mx-auto text-center mb-3.5 sm:mb-5">
          <Link
            to="/"
            className="inline-flex flex-col items-center group focus:outline-none focus:ring-2 focus:ring-[#1677FF] rounded-xl p-1 transition-transform active:scale-[0.98]"
          >
            <BizPulseLogo size="responsive" />
            <p className="mt-1 text-[11px] sm:text-xs text-[#627D98] dark:text-slate-400 font-medium tracking-wide">
              Every Receipt. Smarter Business Decisions.
            </p>
          </Link>

          <div className="mt-3 sm:mt-4">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-[#102A43] dark:text-slate-100 tracking-tight">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-xs sm:text-sm text-[#627D98] dark:text-slate-400 max-w-sm mx-auto leading-relaxed px-2">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Auth Form Card */}
        <div className={`w-full ${maxWidthClass} mx-auto transition-all`}>
          <div className="bg-white dark:bg-slate-900 py-4.5 px-3.5 sm:py-7 sm:px-7 md:px-8 shadow-xs hover:shadow-md transition-shadow rounded-2xl border border-[#E4EAF0] dark:border-slate-800 w-full box-border">
            {children}
          </div>

          {footerContent && (
            <div className="mt-4 sm:mt-5 text-center text-xs text-[#627D98] dark:text-slate-400 px-2">
              {footerContent}
            </div>
          )}
        </div>
      </div>

      {/* Trust & Security Footnote */}
      <footer className="w-full max-w-md mx-auto pt-3 sm:pt-4 text-center text-[10px] sm:text-[11px] text-[#627D98] dark:text-slate-500 flex items-center justify-center space-x-1.5 shrink-0 px-2">
        <ShieldCheck className="w-3.5 h-3.5 text-[#00A896] shrink-0" aria-hidden="true" />
        <span className="leading-tight">Bank-grade 256-bit encryption. Isolated merchant security.</span>
      </footer>
    </div>
  );
};

export default AuthLayout;
