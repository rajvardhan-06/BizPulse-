import React, { useState } from 'react';
import { useStore, isConfirmedReceipt } from '../store';
import { FintechCard } from '../components/fintech/FintechCard';
import { SelectCardModal } from '../components/fintech/SelectCardModal';
import { TopUpModal } from '../components/fintech/TopUpModal';
import { TransferModal } from '../components/fintech/TransferModal';
import { ArrowLeft, ArrowUpRight, PlusCircle, CreditCard, ChevronRight } from 'lucide-react';
import { formatCurrency } from '../lib/utils';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { useNavigate } from 'react-router-dom';

const SPENDING_CATEGORIES = [
  { name: 'Grocery', value: 420, color: '#00C896' },
  { name: 'Food', value: 290, color: '#3562FF' },
  { name: 'Top Up', value: 150, color: '#6366F1' },
  { name: 'Equipment', value: 210, color: '#F59E0B' },
  { name: 'Utilities', value: 80, color: '#EC4899' },
  { name: 'Inventory', value: 340, color: '#028090' },
];

export default function Wallet() {
  const navigate = useNavigate();
  const { cards, activeCardId, receipts, walletTransactions } = useStore();

  const [isSelectCardOpen, setIsSelectCardOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);

  const activeCard = cards.find(c => c.id === activeCardId) || cards[0];

  const confirmedReceipts = receipts.filter(isConfirmedReceipt);
  const totalReceiptSpending = confirmedReceipts.reduce((sum, r) => sum + (r.total || 0), 0);
  const totalSpending = 1490.00 + (totalReceiptSpending > 0 ? totalReceiptSpending : 0);

  return (
    <div className="flex flex-col min-h-full bg-app-bg px-4 sm:px-6 pt-6 pb-8 md:pb-10 max-w-lg mx-auto w-full transition-colors duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => navigate('/')}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-gray-900 dark:text-white">Wallet</h1>
        <button
          onClick={() => setIsSelectCardOpen(true)}
          className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-[#3562FF] transition-colors"
          title="Switch Card"
        >
          <CreditCard className="w-5 h-5" />
        </button>
      </div>

      {/* Featured Virtual Card matching Image 2 */}
      <div className="mb-4">
        <FintechCard card={activeCard} onClick={() => setIsSelectCardOpen(true)} />
      </div>

      {/* Card Carousel Dots & Switch indicator */}
      <div className="flex items-center justify-center space-x-1.5 mb-5">
        {cards.map((c) => (
          <div
            key={c.id}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              c.id === activeCardId ? 'w-6 bg-[#3562FF]' : 'w-2 bg-gray-300 dark:bg-gray-700'
            }`}
          />
        ))}
      </div>

      {/* Action Buttons: Withdraw & Deposit / Top Up matching Image 2 */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => setIsTransferOpen(true)}
          className="flex items-center justify-center space-x-2 py-3.5 px-4 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-800 rounded-2xl font-bold text-xs shadow-xs hover:border-[#3562FF] hover:text-[#3562FF] transition-all"
        >
          <ArrowUpRight className="w-4 h-4" />
          <span>Withdraw</span>
        </button>

        <button
          onClick={() => setIsTopUpOpen(true)}
          className="flex items-center justify-center space-x-2 py-3.5 px-4 bg-[#3562FF] hover:bg-[#2B54E6] text-white rounded-2xl font-bold text-xs shadow-md shadow-blue-500/25 transition-all"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Top Up</span>
        </button>
      </div>

      {/* Total Spending Section matching Image 2 Screen 3 */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800/80 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">
            Total Spending
          </h2>
          <span className="text-xs font-semibold text-[#3562FF]">
            This Month
          </span>
        </div>

        {/* Donut Chart with Center Amount */}
        <div className="relative w-full h-56 flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={SPENDING_CATEGORIES}
                innerRadius={65}
                outerRadius={85}
                paddingAngle={4}
                dataKey="value"
                stroke="none"
              >
                {SPENDING_CATEGORIES.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(val: number) => [formatCurrency(val), 'Spending']}
                contentStyle={{
                  borderRadius: '12px',
                  backgroundColor: '#1E293B',
                  border: 'none',
                  color: '#fff',
                  fontSize: '12px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          {/* Center Text inside Donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-gray-400 uppercase font-semibold">Total</span>
            <span className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {formatCurrency(totalSpending)}
            </span>
          </div>
        </div>

        {/* Category Legend Tags matching Image 2 */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
          {SPENDING_CATEGORIES.map((cat) => (
            <div key={cat.name} className="flex items-center space-x-1.5 p-1">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span className="text-[11px] font-medium text-gray-600 dark:text-gray-300 truncate">
                {cat.name}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Modals */}
      <SelectCardModal isOpen={isSelectCardOpen} onClose={() => setIsSelectCardOpen(false)} />
      <TopUpModal isOpen={isTopUpOpen} onClose={() => setIsTopUpOpen(false)} />
      <TransferModal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} />
    </div>
  );
}
