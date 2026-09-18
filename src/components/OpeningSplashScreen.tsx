import React, { useState, useEffect } from 'react';
import { BizPulseLogo } from './BizPulseLogo';
import { Sparkles, ArrowRight } from 'lucide-react';

interface OpeningSplashScreenProps {
  onComplete: () => void;
  forceShow?: boolean;
}

export const OpeningSplashScreen: React.FC<OpeningSplashScreenProps> = ({ onComplete, forceShow = false }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [pulseActive, setPulseActive] = useState(false);

  useEffect(() => {
    // Check if already shown in this session
    const hasSeenSplash = sessionStorage.getItem('bizpulse_splash_seen');
    if (hasSeenSplash && !forceShow) {
      setIsVisible(false);
      onComplete();
      return;
    }

    const timer1 = setTimeout(() => {
      setPulseActive(true);
    }, 400);

    const timer2 = setTimeout(() => {
      setFadeOut(true);
    }, 1800);

    const timer3 = setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('bizpulse_splash_seen', 'true');
      onComplete();
    }, 2200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [forceShow, onComplete]);

  if (!isVisible) return null;

  const handleSkip = () => {
    setFadeOut(true);
    setTimeout(() => {
      setIsVisible(false);
      sessionStorage.setItem('bizpulse_splash_seen', 'true');
      onComplete();
    }, 200);
  };

  return (
    <div
      onClick={handleSkip}
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-between p-8 bg-white dark:bg-[#0B132B] transition-opacity duration-500 cursor-pointer ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Subtle ambient gradient aura */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-gradient-to-tr from-[#3562FF]/15 via-[#02C39A]/15 to-transparent blur-3xl pointer-events-none" />

      {/* Top spacing */}
      <div className="w-full flex justify-end">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSkip();
          }}
          className="text-xs font-semibold text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 px-3 py-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          Skip
        </button>
      </div>

      {/* Center Brand Area: Exact Logo from Image 1 */}
      <div className="flex flex-col items-center space-y-6 transform transition-all duration-700 animate-in zoom-in-95">
        <div className="p-6 rounded-3xl bg-white/80 dark:bg-gray-800/80 shadow-xl border border-gray-100 dark:border-gray-700/60 backdrop-blur-md">
          <BizPulseLogo size="xl" animated={pulseActive} />
        </div>

        <div className="text-center space-y-1.5 max-w-xs">
          <h2 className="text-xl font-bold tracking-tight text-[#132A46] dark:text-white">
            Smart Financial Wallet
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Intelligent receipt intelligence, cards & business ledger
          </p>
        </div>

        {/* Live Loading Pulse indicator */}
        <div className="flex items-center space-x-1.5 pt-2">
          <span className="w-2 h-2 rounded-full bg-[#3562FF] animate-bounce [animation-delay:-0.3s]" />
          <span className="w-2 h-2 rounded-full bg-[#02C39A] animate-bounce [animation-delay:-0.15s]" />
          <span className="w-2 h-2 rounded-full bg-[#38EF7D] animate-bounce" />
        </div>
      </div>

      {/* Bottom Footer Info */}
      <div className="text-center">
        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium tracking-wider uppercase">
          Empowering Business Growth
        </p>
      </div>
    </div>
  );
};
export default OpeningSplashScreen;
