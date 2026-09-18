import React from 'react';
import { useStore, PayeeContact } from '../../store';
import { ArrowLeft, Share2, Download, Copy, Check } from 'lucide-react';

interface RequestQRModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RequestQRModal: React.FC<RequestQRModalProps> = ({ isOpen, onClose }) => {
  const { payees, cards, activeCardId } = useStore();
  const [copied, setCopied] = React.useState(false);

  if (!isOpen) return null;

  const activeCard = cards.find(c => c.id === activeCardId) || cards[0];

  const handleCopyLink = () => {
    navigator.clipboard?.writeText(`bizpulse://pay?merchant=${encodeURIComponent(activeCard.cardholderName)}&account=2600`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200 flex flex-col p-6 max-h-[92vh] overflow-y-auto">
        {/* Top Navigation */}
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Request</h2>
          <div className="w-9" />
        </div>

        {/* User Card */}
        <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/80 rounded-2xl mb-5">
          <div className="w-10 h-10 rounded-full bg-[#3562FF] text-white flex items-center justify-center font-bold text-sm shadow-sm">
            {activeCard.cardholderName[0]}
          </div>
          <div>
            <h3 className="font-bold text-xs text-gray-900 dark:text-white">
              {activeCard.cardholderName}
            </h3>
            <p className="text-[10px] text-gray-400">
              Account: {activeCard.cardNumber}
            </p>
          </div>
        </div>

        {/* The QR Code Container matching Image 2 */}
        <div className="flex flex-col items-center justify-center p-6 bg-[#F8FAFC] dark:bg-gray-800/60 rounded-3xl border border-gray-100 dark:border-gray-700/60 my-auto shadow-inner">
          <div className="relative p-3 bg-white rounded-2xl shadow-md border border-gray-100">
            {/* High fidelity SVG QR Code matrix with center brand emblem */}
            <svg width="180" height="180" viewBox="0 0 180 180" fill="none">
              {/* Corner position markers */}
              <rect x="10" y="10" width="40" height="40" rx="6" fill="#132A46" />
              <rect x="18" y="18" width="24" height="24" rx="2" fill="white" />
              <rect x="24" y="24" width="12" height="12" rx="2" fill="#3562FF" />

              <rect x="130" y="10" width="40" height="40" rx="6" fill="#132A46" />
              <rect x="138" y="18" width="24" height="24" rx="2" fill="white" />
              <rect x="144" y="24" width="12" height="12" rx="2" fill="#3562FF" />

              <rect x="10" y="130" width="40" height="40" rx="6" fill="#132A46" />
              <rect x="18" y="138" width="24" height="24" rx="2" fill="white" />
              <rect x="24" y="144" width="12" height="12" rx="2" fill="#3562FF" />

              {/* Data modules */}
              <rect x="60" y="15" width="8" height="8" rx="2" fill="#132A46" />
              <rect x="75" y="15" width="8" height="8" rx="2" fill="#02C39A" />
              <rect x="90" y="15" width="8" height="8" rx="2" fill="#132A46" />
              <rect x="105" y="15" width="8" height="8" rx="2" fill="#132A46" />

              <rect x="60" y="30" width="8" height="8" rx="2" fill="#132A46" />
              <rect x="75" y="30" width="8" height="8" rx="2" fill="#132A46" />
              <rect x="105" y="30" width="8" height="8" rx="2" fill="#02C39A" />

              <rect x="15" y="60" width="8" height="8" rx="2" fill="#132A46" />
              <rect x="30" y="60" width="8" height="8" rx="2" fill="#02C39A" />
              <rect x="45" y="60" width="8" height="8" rx="2" fill="#132A46" />
              <rect x="60" y="60" width="8" height="8" rx="2" fill="#132A46" />
              <rect x="120" y="60" width="8" height="8" rx="2" fill="#132A46" />
              <rect x="135" y="60" width="8" height="8" rx="2" fill="#02C39A" />
              <rect x="150" y="60" width="8" height="8" rx="2" fill="#132A46" />

              {/* Center Icon badge */}
              <rect x="68" y="68" width="44" height="44" rx="12" fill="#3562FF" />
              <circle cx="90" cy="90" r="14" fill="white" />
              <path d="M 85 90 L 89 94 L 96 86" stroke="#3562FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

              <rect x="15" y="105" width="8" height="8" rx="2" fill="#132A46" />
              <rect x="30" y="105" width="8" height="8" rx="2" fill="#132A46" />
              <rect x="120" y="105" width="8" height="8" rx="2" fill="#132A46" />
              <rect x="150" y="105" width="8" height="8" rx="2" fill="#02C39A" />

              <rect x="60" y="125" width="8" height="8" rx="2" fill="#132A46" />
              <rect x="75" y="125" width="8" height="8" rx="2" fill="#02C39A" />
              <rect x="90" y="125" width="8" height="8" rx="2" fill="#132A46" />
              <rect x="105" y="125" width="8" height="8" rx="2" fill="#132A46" />

              <rect x="60" y="145" width="8" height="8" rx="2" fill="#02C39A" />
              <rect x="75" y="145" width="8" height="8" rx="2" fill="#132A46" />
              <rect x="90" y="145" width="8" height="8" rx="2" fill="#132A46" />
              <rect x="135" y="145" width="8" height="8" rx="2" fill="#132A46" />
              <rect x="150" y="145" width="8" height="8" rx="2" fill="#132A46" />
            </svg>
          </div>

          <p className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 mt-4 text-center">
            Show this barcode at the store
          </p>
        </div>

        {/* Request to Contact matching Image 2 */}
        <div className="mt-5">
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-2.5">
            Request to Contact
          </span>
          <div className="flex items-center space-x-3 overflow-x-auto py-1 scrollbar-hide">
            {payees.map((payee) => (
              <button
                key={payee.id}
                onClick={handleCopyLink}
                className="flex flex-col items-center shrink-0 space-y-1 group"
              >
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-sm hover:scale-105 transition-transform"
                  style={{ backgroundColor: payee.avatarColor }}
                >
                  {payee.name[0]}
                </div>
                <span className="text-[10px] text-gray-600 dark:text-gray-300 font-medium">
                  {payee.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 pt-2">
          <button
            onClick={handleCopyLink}
            className="w-full py-3.5 bg-[#3562FF] hover:bg-[#2B54E6] text-white rounded-2xl font-semibold text-xs shadow-md shadow-blue-500/25 transition-all flex items-center justify-center space-x-2"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Payment Link Copied!' : 'Copy Payment Link'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
export default RequestQRModal;
