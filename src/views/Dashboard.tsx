import React, { useState, useMemo } from 'react';
import { useStore, isConfirmedReceipt, Receipt } from '../store';
import { useAuthStore } from '../authStore';
import { useLiveWebSocket } from '../lib/websocket';
import { formatCurrency } from '../lib/utils';
import { FintechCard } from '../components/fintech/FintechCard';
import { SelectCardModal } from '../components/fintech/SelectCardModal';
import { 
  Bell, 
  Camera, 
  ReceiptText,
  BarChart2,
  FileText,
  ChevronRight,
  Plus,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Search
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

function getTimeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  if (hour < 21) return 'Good Evening';
  return 'Good Night';
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { 
    cards, 
    activeCardId, 
    receipts, 
    walletTransactions,
    loadSampleData
  } = useStore();

  const [isSelectCardOpen, setIsSelectCardOpen] = useState(false);

  const activeCard = cards.find(c => c.id === activeCardId) || cards[0];
  const confirmedReceipts = useMemo(() => receipts.filter(isConfirmedReceipt), [receipts]);

  const displayName = user?.fullName || activeCard?.cardholderName || 'Business User';
  const greeting = getTimeGreeting();

  const totalSpend = useMemo(() => confirmedReceipts.reduce((sum, r) => sum + (r.total || 0), 0), [confirmedReceipts]);
  const avgReceipt = confirmedReceipts.length > 0 ? totalSpend / confirmedReceipts.length : 0;

  // Format wallet transactions and receipts into a unified recent activity list
  const recentActivity = useMemo(() => {
    const items = [];
    
    // Add receipts
    confirmedReceipts.forEach(r => {
      items.push({
        id: `receipt-${r.id}`,
        type: 'receipt',
        title: r.merchant,
        subtitle: `${r.items.length} items verified`,
        date: r.date || 'Recent',
        amount: -(r.total || 0),
        isPositive: false
      });
    });

    // Add wallet tx
    walletTransactions.forEach(t => {
      items.push({
        id: `tx-${t.id}`,
        type: 'tx',
        title: t.title,
        subtitle: t.note || 'Wallet transaction',
        date: t.date,
        amount: t.amount,
        isPositive: t.amount > 0
      });
    });

    return items.sort((a, b) => 0).slice(0, 5); // Sort logic would normally go here if real dates were parseable
  }, [confirmedReceipts, walletTransactions]);


  return (
    <div className="flex flex-col min-h-full bg-app-bg px-5 pt-6 pb-8 md:pb-10 max-w-2xl mx-auto w-full transition-colors duration-300">
      
      {/* 1. TOP HEADER */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Link to="/profile" className="relative group">
            <div className="w-12 h-12 rounded-full bg-primary-blue text-white flex items-center justify-center font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
              {displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
            </div>
          </Link>
          <div>
            <span className="text-xs text-app-text-secondary font-medium block leading-tight mb-0.5">
              {greeting}
            </span>
            <h1 className="text-lg font-bold text-app-text leading-tight tracking-tight">
              {displayName}
            </h1>
          </div>
        </div>
        <Link
          to="/insights"
          className="p-2.5 rounded-full bg-app-surface border border-app-border text-app-text-secondary hover:text-primary-blue transition-colors shadow-sm"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
        </Link>
      </div>

      {/* 2. PRIMARY BUSINESS METRIC (Fintech Card) */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-sm font-bold text-app-text">Current Balance</h2>
        </div>
        <FintechCard card={activeCard} onClick={() => setIsSelectCardOpen(true)} />
      </div>

      {/* 3. QUICK ACTIONS */}
      <div className="mb-10">
        <h2 className="text-sm font-bold text-app-text mb-4 px-1">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-3">
          <button
            onClick={() => navigate('/scan')}
            className="flex flex-col items-center space-y-2 group"
          >
            <div className="w-14 h-14 rounded-2xl bg-app-surface border border-app-border text-primary-blue flex items-center justify-center shadow-sm group-hover:border-primary-blue group-hover:shadow-md transition-all">
              <Camera className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-app-text-secondary group-hover:text-primary-blue transition-colors text-center leading-tight">
              Scan<br/>Receipt
            </span>
          </button>

          <button
            onClick={() => navigate('/activity')}
            className="flex flex-col items-center space-y-2 group"
          >
            <div className="w-14 h-14 rounded-2xl bg-app-surface border border-app-border text-brand-teal flex items-center justify-center shadow-sm group-hover:border-brand-teal group-hover:shadow-md transition-all">
              <ReceiptText className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-app-text-secondary group-hover:text-brand-teal transition-colors text-center leading-tight">
              View<br/>Activity
            </span>
          </button>

          <button
            onClick={() => navigate('/insights')}
            className="flex flex-col items-center space-y-2 group"
          >
            <div className="w-14 h-14 rounded-2xl bg-app-surface border border-app-border text-indigo-500 flex items-center justify-center shadow-sm group-hover:border-indigo-500 group-hover:shadow-md transition-all">
              <BarChart2 className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-app-text-secondary group-hover:text-indigo-500 transition-colors text-center leading-tight">
              View<br/>Insights
            </span>
          </button>

          <button
            onClick={() => navigate('/reports')}
            className="flex flex-col items-center space-y-2 group"
          >
            <div className="w-14 h-14 rounded-2xl bg-app-surface border border-app-border text-rose-500 flex items-center justify-center shadow-sm group-hover:border-rose-500 group-hover:shadow-md transition-all">
              <FileText className="w-6 h-6" />
            </div>
            <span className="text-xs font-semibold text-app-text-secondary group-hover:text-rose-500 transition-colors text-center leading-tight">
              View<br/>Reports
            </span>
          </button>
        </div>
      </div>

      {/* 4. RECENT ACTIVITY */}
      <div>
        <div className="flex items-center justify-between mb-4 px-1">
          <h2 className="text-sm font-bold text-app-text">Recent Activity</h2>
          <Link
            to="/activity"
            className="text-xs font-semibold text-primary-blue hover:underline flex items-center"
          >
            View All
            <ChevronRight className="w-4 h-4 ml-0.5" />
          </Link>
        </div>

        <div className="bg-app-surface rounded-3xl p-2 shadow-sm border border-app-border">
          {recentActivity.length > 0 ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {recentActivity.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-2xl transition-colors">
                  <div className="flex items-center space-x-3 min-w-0">
                    <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
                      item.type === 'receipt' 
                        ? 'bg-teal-50 dark:bg-teal-950/40 text-brand-teal' 
                        : 'bg-blue-50 dark:bg-blue-950/40 text-primary-blue'
                    }`}>
                      {item.type === 'receipt' ? <ReceiptText className="w-5 h-5" /> : (
                        item.isPositive ? <ArrowDownLeft className="w-5 h-5" /> : <ArrowUpRight className="w-5 h-5" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-app-text truncate">{item.title}</p>
                      <p className="text-xs text-app-text-secondary truncate mt-0.5">{item.date} • {item.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <span className={`text-sm font-bold block ${
                      item.isPositive ? 'text-success' : 'text-app-text'
                    }`}>
                      {item.isPositive ? '+' : ''}{formatCurrency(Math.abs(item.amount))}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-10 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center mx-auto mb-3">
                <ReceiptText className="w-8 h-8 text-gray-300 dark:text-gray-600" />
              </div>
              <h3 className="text-sm font-bold text-app-text mb-1">Start building your business picture</h3>
              <p className="text-xs text-app-text-secondary max-w-[220px] mx-auto mb-4">
                Scan your first receipt to begin tracking activity and discovering insights.
              </p>
              <button
                onClick={() => navigate('/scan')}
                className="px-5 py-2.5 bg-primary-blue text-white text-sm font-bold rounded-xl shadow-sm hover:bg-blue-600 transition-colors inline-flex items-center space-x-2"
              >
                <Camera className="w-4 h-4" />
                <span>Scan First Receipt</span>
              </button>
              
              <div className="mt-6">
                <button
                  onClick={loadSampleData}
                  className="text-xs font-semibold text-brand-teal hover:underline inline-flex items-center space-x-1"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Load sample data instead</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      <SelectCardModal isOpen={isSelectCardOpen} onClose={() => setIsSelectCardOpen(false)} />
    </div>
  );
}
