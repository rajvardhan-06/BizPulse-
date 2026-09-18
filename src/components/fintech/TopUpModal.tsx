import React, { useState } from 'react';
import { useStore } from '../../store';
import { useLiveWebSocket } from '../../lib/websocket';
import { ArrowLeft, PlusCircle, Check, DollarSign, Wallet } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose }) => {
  const { cards, activeCardId, topUp } = useStore();
  const { broadcastEvent } = useLiveWebSocket();

  const [amount, setAmount] = useState('100.00');
  const [method, setMethod] = useState<'bank' | 'card' | 'paypal'>('bank');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const activeCard = cards.find(c => c.id === activeCardId) || cards[0];

  const handleTopUp = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;

    topUp(num);

    broadcastEvent('topup_completed', {
      amount: num,
      currency: activeCard.currency,
      date: new Date().toISOString()
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1600);
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
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Top Up</h2>
          <div className="w-9" />
        </div>

        {/* Current Balance */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl mb-5 flex items-center justify-between border border-gray-100 dark:border-gray-700/60">
          <div>
            <span className="text-[10px] text-gray-400 uppercase font-semibold block">Active Balance</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white font-mono">
              {formatCurrency(activeCard.balance)}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-[#3562FF] flex items-center justify-center">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
            Top Up Amount
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
            <input
              type="number"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-gray-800/80 rounded-2xl text-lg font-bold border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3562FF] text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-4 gap-2 mt-2.5">
            {['50.00', '100.00', '250.00', '500.00'].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val)}
                className={`py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  amount === val
                    ? 'bg-[#3562FF] text-white border-[#3562FF]'
                    : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700'
                }`}
              >
                {formatCurrency(parseInt(val))}
              </button>
            ))}
          </div>
        </div>

        {/* Method */}
        <div className="space-y-2 mb-6">
          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
            Deposit Method
          </label>
          {[
            { id: 'bank' as const, label: 'Instant Bank Transfer', desc: 'Direct from Chase/Citi' },
            { id: 'card' as const, label: 'Debit Card', desc: 'Mastercard ending 2600' },
            { id: 'paypal' as const, label: 'PayPal Account', desc: 'Instant deposit' },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMethod(m.id)}
              className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                method === m.id
                  ? 'border-[#3562FF] bg-blue-50/50 dark:bg-blue-950/30'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50'
              }`}
            >
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-white">{m.label}</p>
                <p className="text-[10px] text-gray-400">{m.desc}</p>
              </div>
              {method === m.id && <Check className="w-4 h-4 text-[#3562FF]" />}
            </button>
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleTopUp}
          disabled={!amount || parseFloat(amount) <= 0 || isSuccess}
          className="w-full py-3.5 bg-[#3562FF] hover:bg-[#2B54E6] text-white rounded-2xl font-semibold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center space-x-2"
        >
          {isSuccess ? (
            <>
              <Check className="w-5 h-5 text-white" />
              <span>Top Up Successful!</span>
            </>
          ) : (
            <span>Confirm Top Up</span>
          )}
        </button>
      </div>
    </div>
  );
};
export default TopUpModal;
