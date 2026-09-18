import React, { useState } from 'react';
import { useStore, PayeeContact } from '../../store';
import { useLiveWebSocket } from '../../lib/websocket';
import { ArrowLeft, Plus, CheckCircle, Check, X, ShieldCheck } from 'lucide-react';
import { formatCurrency } from '../../lib/utils';

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TransferModal: React.FC<TransferModalProps> = ({ isOpen, onClose }) => {
  const { payees, cards, activeCardId, sendTransfer } = useStore();
  const { broadcastEvent } = useLiveWebSocket();

  const [step, setStep] = useState<'input' | 'confirm' | 'success'>('input');
  const [selectedPayee, setSelectedPayee] = useState<PayeeContact | null>(payees[0] || null);
  const [phoneInput, setPhoneInput] = useState('');
  const [amount, setAmount] = useState<string>('275.00');
  const [message, setMessage] = useState<string>('For vendor supply payment');

  if (!isOpen) return null;

  const activeCard = cards.find(c => c.id === activeCardId) || cards[0];

  const handleSelectPayee = (p: PayeeContact) => {
    setSelectedPayee(p);
    setPhoneInput(p.phone);
    if (p.recentAmount) {
      setAmount(p.recentAmount.toFixed(2));
    }
  };

  const handleExecuteTransfer = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    const payeeName = selectedPayee ? selectedPayee.name : (phoneInput || 'Payee');
    sendTransfer(payeeName, numAmount, message);

    // Broadcast live WebSocket event
    broadcastEvent('transfer_completed', {
      payee: payeeName,
      amount: numAmount,
      currency: activeCard?.currency || 'INR',
      date: new Date().toISOString()
    });

    setStep('success');
  };

  const handleClose = () => {
    setStep('input');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-[32px] w-full max-w-sm overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]">
        
        {/* STEP 1: TRANSFER INPUT */}
        {step === 'input' && (
          <div className="flex flex-col h-full p-6 overflow-y-auto">
            {/* Top Navigation */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Transfer</h2>
              <div className="w-9" />
            </div>

            {/* Contact Input */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                Contact
              </label>
              <input
                type="text"
                value={phoneInput || (selectedPayee ? `${selectedPayee.name} (${selectedPayee.phone})` : '')}
                onChange={(e) => {
                  setPhoneInput(e.target.value);
                  setSelectedPayee(null);
                }}
                placeholder="Enter phone number"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/80 rounded-2xl text-sm border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3562FF] text-gray-900 dark:text-white"
              />
            </div>

            {/* Recent Payees matching Image 2 */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Recent Payees
                </span>
                <span className="text-[11px] text-[#3562FF] font-medium">Favorite</span>
              </div>
              <div className="flex items-center space-x-3 overflow-x-auto py-1 scrollbar-hide">
                {payees.map((payee) => {
                  const isSelected = selectedPayee?.id === payee.id;
                  return (
                    <button
                      key={payee.id}
                      onClick={() => handleSelectPayee(payee)}
                      className="flex flex-col items-center shrink-0 space-y-1 group"
                    >
                      <div
                        className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm transition-all duration-200 ${
                          isSelected ? 'ring-2 ring-offset-2 ring-[#3562FF] scale-105' : 'opacity-85 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: payee.avatarColor }}
                      >
                        {payee.name[0]}
                      </div>
                      <span className={`text-[11px] font-medium ${isSelected ? 'text-[#3562FF] font-bold' : 'text-gray-600 dark:text-gray-300'}`}>
                        {payee.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Amount Input */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                Amount
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

              {/* Quick Amount Pills matching Image 2 */}
              <div className="flex space-x-2 mt-2.5">
                {['100.00', '250.00', '500.00'].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      amount === val
                        ? 'bg-[#3562FF] text-white border-[#3562FF]'
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-[#3562FF]'
                    }`}
                  >
                    {formatCurrency(Number(val))}
                  </button>
                ))}
              </div>
            </div>

            {/* Message input */}
            <div className="mb-6">
              <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider block mb-1.5">
                Message
              </label>
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Write Message Here"
                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800/80 rounded-2xl text-xs border border-gray-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-[#3562FF] text-gray-900 dark:text-white"
              />
            </div>

            {/* Continue Button */}
            <button
              onClick={() => setStep('confirm')}
              disabled={!amount || parseFloat(amount) <= 0}
              className="w-full py-3.5 bg-[#3562FF] hover:bg-[#2B54E6] disabled:opacity-50 text-white rounded-2xl font-semibold text-sm shadow-md shadow-blue-500/25 transition-all mt-auto"
            >
              Continue
            </button>
          </div>
        )}

        {/* STEP 2: CONFIRM TRANSFER MATCHING IMAGE 2 */}
        {step === 'confirm' && (
          <div className="flex flex-col h-full p-6 text-center">
            {/* Top Navigation */}
            <div className="flex items-center justify-between mb-5">
              <button
                onClick={() => setStep('input')}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Confirm Transfer</h2>
              <div className="w-9" />
            </div>

            {/* Payee Avatar & Name */}
            <div className="my-4 flex flex-col items-center">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-3"
                style={{ backgroundColor: selectedPayee?.avatarColor || '#3562FF' }}
              >
                {selectedPayee?.name?.[0] || 'P'}
              </div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                {selectedPayee?.name || phoneInput || 'Recipient'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {selectedPayee?.phone || phoneInput || '+62 8123456789'}
              </p>
            </div>

            {/* Big Amount Card */}
            <div className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 rounded-2xl py-3 px-6 my-2 inline-block mx-auto">
              <span className="text-2xl font-bold text-[#3562FF]">
                {formatCurrency(parseFloat(amount || '0'))}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Transfer on {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </p>

            {/* Note */}
            <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-700/60 text-left">
              <span className="text-[10px] text-gray-400 uppercase font-semibold block">Message</span>
              <p className="text-xs text-gray-700 dark:text-gray-300">{message || 'Transfer'}</p>
            </div>

            {/* Transfer Button */}
            <div className="mt-6 pt-2">
              <button
                onClick={handleExecuteTransfer}
                className="w-full py-3.5 bg-[#3562FF] hover:bg-[#2B54E6] text-white rounded-2xl font-semibold text-sm shadow-md shadow-blue-500/30 transition-all"
              >
                Transfer
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: TRANSFER SUCCESS (Vibrant Blue Backdrop matching Image 2) */}
        {step === 'success' && (
          <div className="flex flex-col items-center justify-between h-full p-8 bg-gradient-to-b from-[#3562FF] via-[#2B54E6] to-[#1E40AF] text-white text-center relative overflow-hidden min-h-[420px]">
            {/* Ambient decorative rings */}
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-56 h-56 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-56 h-56 rounded-full bg-white/10 blur-xl pointer-events-none" />

            <div className="w-full flex justify-end">
              <button onClick={handleClose} className="p-1 rounded-full text-white/80 hover:bg-white/10">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-col items-center my-auto space-y-4">
              <div className="w-18 h-18 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center p-3 shadow-inner">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-[#3562FF]">
                  <Check className="w-7 h-7 stroke-[3]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h2 className="text-2xl font-bold tracking-tight text-white">Transfer Success</h2>
                <p className="text-xs text-blue-100/90 max-w-[220px] mx-auto leading-relaxed">
                  You Have Successfully transferred {formatCurrency(parseFloat(amount || '0'))} to {selectedPayee?.name || 'payee'}
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="w-full py-3.5 bg-white text-[#3562FF] hover:bg-blue-50 rounded-2xl font-bold text-sm shadow-lg transition-all"
            >
              Back to home
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
export default TransferModal;
