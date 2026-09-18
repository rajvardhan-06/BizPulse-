import React from 'react';
import { VirtualCard } from '../../store';
import { Wifi, Copy, Check } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface FintechCardProps {
  card: VirtualCard;
  onClick?: () => void;
  showActions?: boolean;
}

export const FintechCard: React.FC<FintechCardProps> = ({ card, onClick, showActions = true }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(card.cardNumber.replace(/\s+/g, ''));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getThemeClasses = () => {
    switch (card.theme) {
      case 'cyan':
        return 'from-[#00A896] via-[#028090] to-[#0B2E33] shadow-cyan-500/20';
      case 'dark':
        return 'from-[#1E293B] via-[#0F172A] to-[#020617] border border-white/10 shadow-black/40';
      case 'purple':
        return 'from-[#6366F1] via-[#4F46E5] to-[#3730A3] shadow-indigo-500/25';
      case 'blue':
      default:
        // Exact Royal Blue gradient from Image 2
        return 'from-[#3562FF] via-[#2B54E6] to-[#1E40AF] shadow-blue-500/30';
    }
  };

  return (
    <div
      onClick={onClick}
      className={`relative w-full aspect-[1.58/1] max-w-sm rounded-[28px] p-6 text-white bg-gradient-to-tr ${getThemeClasses()} shadow-xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02] select-none`}
    >
      {/* Glossy ambient circles overlay matching Image 2 */}
      <div className="absolute top-0 right-0 -mr-8 -mt-8 w-44 h-44 rounded-full bg-white/10 blur-xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-8 -mb-8 w-40 h-40 rounded-full bg-white/10 blur-xl pointer-events-none" />
      
      {/* Decorative concentric watermark curves matching Image 2 cards */}
      <svg
        className="absolute right-0 top-0 h-full w-2/3 opacity-15 pointer-events-none"
        viewBox="0 0 200 200"
        fill="none"
      >
        <circle cx="160" cy="40" r="100" stroke="white" strokeWidth="20" />
        <circle cx="160" cy="40" r="60" stroke="white" strokeWidth="12" />
        <circle cx="160" cy="40" r="30" stroke="white" strokeWidth="6" />
      </svg>

      <div className="relative z-10 flex flex-col justify-between h-full">
        {/* Top Row: Name on Left, Logo / Chip on Right */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-blue-100/70 font-semibold block">
              Name
            </span>
            <span className="font-semibold text-sm tracking-wide text-white drop-shadow-xs">
              {card.cardholderName}
            </span>
          </div>

          {/* Dual overlapping circles / Contactless chip matching Image 2 */}
          <div className="flex items-center space-x-1.5">
            <Wifi className="w-4 h-4 text-white/80 rotate-90" />
            <div className="flex -space-x-2">
              <div className="w-6 h-6 rounded-full bg-white/40 backdrop-blur-xs" />
              <div className="w-6 h-6 rounded-full bg-white/60 backdrop-blur-xs" />
            </div>
          </div>
        </div>

        {/* Center: Masked Card Number */}
        <div className="my-auto py-1">
          <div className="flex items-center space-x-3">
            <span className="text-base sm:text-lg font-mono tracking-widest text-white/95 font-medium drop-shadow-xs">
              {card.cardNumber}
            </span>
            {showActions && (
              <button
                type="button"
                onClick={handleCopy}
                className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/15 transition-colors"
                title="Copy card number"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            )}
          </div>
        </div>

        {/* Bottom Row: Balance on Left, Expiry on Right */}
        <div className="flex items-end justify-between pt-1">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-blue-100/70 font-semibold block">
              Balance
            </span>
            <span className="text-xl sm:text-2xl font-bold tracking-tight text-white drop-shadow-xs">
              {formatCurrency(card.balance)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-blue-100/70 font-semibold block">
              Exp
            </span>
            <span className="text-xs font-mono font-medium text-white/90">
              {card.expiry}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
export default FintechCard;
