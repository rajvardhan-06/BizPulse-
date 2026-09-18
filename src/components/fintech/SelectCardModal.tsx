import React, { useState } from 'react';
import { useStore, VirtualCard } from '../../store';
import { FintechCard } from './FintechCard';
import { ArrowLeft, Plus, Check } from 'lucide-react';

interface SelectCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SelectCardModal: React.FC<SelectCardModalProps> = ({ isOpen, onClose }) => {
  const { cards, activeCardId, setActiveCard, addCard } = useStore();
  const [isAdding, setIsAdding] = useState(false);
  const [newHolder, setNewHolder] = useState('Arya Wijaya');
  const [newTheme, setNewTheme] = useState<'blue' | 'cyan' | 'dark' | 'purple'>('cyan');

  if (!isOpen) return null;

  const handleAddNewCard = (e: React.FormEvent) => {
    e.preventDefault();
    const lastDigits = Math.floor(1000 + Math.random() * 9000);
    const newCard: VirtualCard = {
      id: crypto.randomUUID(),
      cardholderName: newHolder || 'Cardholder',
      cardNumber: `•••• •••• ${lastDigits}`,
      expiry: '12/28',
      balance: 1000.00,
      currency: 'INR',
      theme: newTheme,
      type: 'visa'
    };
    addCard(newCard);
    setIsAdding(false);
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
          <h2 className="text-base font-bold text-gray-900 dark:text-white">Select Card</h2>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-[#3562FF] transition-colors"
            title="Add Card"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {isAdding ? (
          <form onSubmit={handleAddNewCard} className="space-y-4 my-2">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
              Issue New Virtual Card
            </h3>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-300 font-medium block mb-1">
                Cardholder Name
              </label>
              <input
                type="text"
                value={newHolder}
                onChange={(e) => setNewHolder(e.target.value)}
                className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl text-sm border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="text-xs text-gray-600 dark:text-gray-300 font-medium block mb-1">
                Color Theme
              </label>
              <div className="flex space-x-2">
                {(['blue', 'cyan', 'dark', 'purple'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewTheme(t)}
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      newTheme === t ? 'ring-2 ring-[#3562FF] scale-110' : 'opacity-80'
                    } ${
                      t === 'blue' ? 'bg-[#3562FF]' : t === 'cyan' ? 'bg-[#00A896]' : t === 'dark' ? 'bg-[#1E293B]' : 'bg-[#6366F1]'
                    }`}
                  />
                ))}
              </div>
            </div>
            <div className="flex space-x-2 pt-2">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 py-2.5 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#3562FF] text-white rounded-xl text-xs font-semibold shadow-md"
              >
                Create Card
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 my-2">
            {cards.map((card) => {
              const isActive = card.id === activeCardId;
              return (
                <div key={card.id} className="relative group">
                  <FintechCard card={card} onClick={() => setActiveCard(card.id)} />
                  {isActive && (
                    <div className="absolute top-3 right-3 z-20 bg-white dark:bg-gray-900 text-[#3562FF] rounded-full p-1.5 shadow-md flex items-center space-x-1 text-[10px] font-bold px-2.5 border border-blue-100">
                      <Check className="w-3.5 h-3.5 stroke-[3]" />
                      <span>Active</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <button
          onClick={onClose}
          className="w-full py-3.5 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-2xl font-semibold text-xs transition-all mt-4"
        >
          Close
        </button>
      </div>
    </div>
  );
};
export default SelectCardModal;
