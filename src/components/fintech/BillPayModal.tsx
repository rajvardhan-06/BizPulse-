import React, { useState } from 'react';
import { useStore } from '../../store';
import { useLiveWebSocket } from '../../lib/websocket';
import { ArrowLeft, Zap, Droplet, Wifi, MoreHorizontal, Check, ShieldCheck, CreditCard } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface BillPayModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BillPayModal: React.FC<BillPayModalProps> = ({ isOpen, onClose }) => {
  const { cards, activeCardId, payBill } = useStore();
  const { broadcastEvent } = useLiveWebSocket();

  const [selectedCategory, setSelectedCategory] = useState<'electricity' | 'water' | 'internet' | 'more'>('electricity');
  const [billAmount, setBillAmount] = useState('20.00');
  const [tokenInput, setTokenInput] = useState('QCU12GH3');
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const activeCard = cards.find(c => c.id === activeCardId) || cards[0];

  const handlePay = () => {
    const num = parseFloat(billAmount);
    if (isNaN(num) || num <= 0) return;

    const titleMap: Record<string, string> = {
      electricity: 'Electricity Utility',
      water: 'Water Supply Co',
      internet: 'Fiber Broadband',
      more: 'Vendor Utility'
    };

    payBill(titleMap[selectedCategory], selectedCategory === 'more' ? 'other' : selectedCategory, num);

    broadcastEvent('bill_paid', {
      category: selectedCategory,
      amount: num,
      date: new Date().toISOString()
    });

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onClose();
    }, 1800);
  };

  const categories = [
    { id: 'electricity' as const, label: 'Electricity', icon: Zap, color: 'bg-blue-500' },
    { id: 'water' as const, label: 'Water', icon: Droplet, color: 'bg-cyan-500' },
    { id: 'internet' as const, label: 'Internet', icon: Wifi, color: 'bg-indigo-500' },
    { id: 'more' as const, label: 'More', icon: MoreHorizontal, color: 'bg-slate-500' },
  ];

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
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Bill Pay</h2>
          <div className="w-9" />
        </div>

        {/* Unpaid Bill Notification Banner matching Image 2 */}
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950/40 dark:to-indigo-950/40 border border-blue-100 dark:border-blue-900/50 rounded-2xl mb-5 flex items-center justify-between">
          <div>
            <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium block">
              You have unpaid bill
            </span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              {formatCurrency(20.00)}
            </span>
          </div>
          <button
            onClick={() => setBillAmount('20.00')}
            className="px-4 py-2 bg-[#3562FF] text-white rounded-xl text-xs font-semibold hover:bg-[#2B54E6] shadow-sm transition-colors"
          >
            Pay Now
          </button>
        </div>

        {/* Categories Grid matching Image 2 */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className="flex flex-col items-center space-y-1.5 p-2 rounded-2xl transition-all"
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm transition-all ${
                    cat.color
                  } ${isSelected ? 'ring-2 ring-offset-2 ring-[#3562FF] scale-105' : 'opacity-85 hover:opacity-100'}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-[10px] font-semibold truncate ${isSelected ? 'text-[#3562FF]' : 'text-gray-600 dark:text-gray-400'}`}>
                  {cat.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Pay Via Card Details matching Image 2 */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
              Pay Via
            </label>
            <div className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-800/80 rounded-2xl border border-gray-200 dark:border-gray-700">
              <div className="w-9 h-9 rounded-xl bg-[#3562FF] text-white flex items-center justify-center">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                  {activeCard.cardholderName} Card
                </p>
                <p className="text-[10px] text-gray-400 font-mono">
                  {activeCard.cardNumber}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
              Enter Token
            </label>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="e.g. QCU12GH3"
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/80 rounded-2xl text-xs font-mono border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3562FF] text-gray-900 dark:text-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
              Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
              <input
                type="number"
                step="0.01"
                value={billAmount}
                onChange={(e) => setBillAmount(e.target.value)}
                placeholder="20.00"
                className="w-full pl-8 pr-4 py-3 bg-gray-50 dark:bg-gray-800/80 rounded-2xl text-lg font-bold border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3562FF] text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={handlePay}
          disabled={!billAmount || parseFloat(billAmount) <= 0 || isSuccess}
          className="w-full py-3.5 bg-[#3562FF] hover:bg-[#2B54E6] text-white rounded-2xl font-semibold text-sm shadow-md shadow-blue-500/25 transition-all flex items-center justify-center space-x-2"
        >
          {isSuccess ? (
            <>
              <Check className="w-5 h-5 text-white" />
              <span>Bill Paid Successfully!</span>
            </>
          ) : (
            <span>Pay Bill</span>
          )}
        </button>
      </div>
    </div>
  );
};
export default BillPayModal;
