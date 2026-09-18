import React from 'react';

export interface BizPulseLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'responsive' | number;
  showText?: boolean;
  animated?: boolean;
  lightText?: boolean;
}

export const BizPulseLogo: React.FC<BizPulseLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  animated = false,
  lightText = false
}) => {
  const isResponsive = size === 'responsive';
  const defaultDimensions = { icon: 40, text: 'text-2xl', subtext: 'text-[11px]' };
  const sizeMap: Record<string, typeof defaultDimensions> = {
    sm: { icon: 28, text: 'text-lg', subtext: 'text-[9px]' },
    md: { icon: 40, text: 'text-2xl', subtext: 'text-[11px]' },
    lg: { icon: 64, text: 'text-3xl', subtext: 'text-xs' },
    xl: { icon: 96, text: 'text-5xl', subtext: 'text-sm' },
    responsive: { icon: 34, text: 'text-xl sm:text-2xl', subtext: 'text-[10px] sm:text-[11px]' }
  };

  const dimensions = typeof size === 'number'
    ? { 
        icon: size, 
        text: size > 48 ? 'text-4xl' : size > 30 ? 'text-xl' : 'text-sm', 
        subtext: 'text-xs' 
      }
    : (sizeMap[size] || defaultDimensions);

  const iconWidth = dimensions.icon || 40;
  const iconHeight = iconWidth * 1.15;

  return (
    <div className={`inline-flex flex-col items-center select-none ${className}`}>
      {/* Exact Logo from Image 1: Navy 'b' with glowing green pulse wave slicing through the center */}
      <div className="relative flex items-center justify-center">
        <svg
          width={iconWidth}
          height={iconHeight}
          viewBox="0 0 100 115"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={`${animated ? 'animate-pulse' : ''} ${isResponsive ? 'w-[30px] h-[34.5px] sm:w-[40px] sm:h-[46px]' : ''}`}
        >
          {/* Definitions for glow and gradients */}
          <defs>
            <linearGradient id="pulseGlow" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#02C39A" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#38EF7D" stopOpacity="1" />
              <stop offset="100%" stopColor="#02C39A" stopOpacity="0.8" />
            </linearGradient>
            <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Upper stem of the letter 'b' */}
          <path
            d="M 28 8 L 44 8 C 45.5 8 46 9 46 10.5 L 46 48 L 28 48 Z"
            fill="currentColor"
            className="text-[#132A46] dark:text-blue-100"
          />

          {/* Outer circular bowl of the 'b' */}
          <path
            d="M 58 36 C 78 36 92 50 92 70 C 92 90 76 104 56 104 C 36 104 22 90 22 70 C 22 52 35 38 52 36.2 L 52 52 C 43 53.5 38 61 38 70 C 38 79.5 45 87 56 87 C 67 87 74 79.5 74 70 C 74 61 67 53.5 56 53.5 L 56 36.2 Z"
            fill="currentColor"
            className="text-[#132A46] dark:text-blue-100"
          />

          {/* Center horizontal split / slot for the pulse wave */}
          <rect x="18" y="66" width="76" height="8" fill="white" className="dark:fill-gray-900" />

          {/* The Vibrant Mint/Green Pulse Waveform (ECG line) matching Image 1 */}
          <path
            d="M 16 70 L 36 70 L 44 76 L 50 50 L 58 84 L 64 68 L 68 72 L 72 70 L 86 70"
            stroke="#02C39A"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#neonGlow)"
            className={animated ? 'animate-[dash_2s_ease-in-out_infinite]' : ''}
          />
        </svg>
      </div>

      {/* Brand Text matching Image 1: 'biz' in navy, 'pulse' in teal */}
      {showText && (
        <div className="mt-1 flex items-baseline tracking-tight font-sans font-bold">
          <span className={`${dimensions.text} ${lightText ? 'text-white' : 'text-[#132A46] dark:text-white'}`}>
            biz
          </span>
          <span className={`${dimensions.text} text-[#02C39A]`}>
            pulse
          </span>
        </div>
      )}
    </div>
  );
};
export default BizPulseLogo;
