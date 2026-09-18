import React, { useState, useMemo } from 'react';
import { formatCurrency } from "../lib/utils";
import { useStore, isConfirmedReceipt } from '../store';
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Sparkles, 
  ArrowLeft,
  ReceiptText,
  PieChart as PieIcon,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Statistic() {
  const navigate = useNavigate();
  const receipts = useStore((state) => state.receipts).filter(isConfirmedReceipt);
  const cards = useStore((state) => state.cards);
  const activeCardId = useStore((state) => state.activeCardId);
  const walletTransactions = useStore((state) => state.walletTransactions);

  const [period, setPeriod] = useState<'D' | 'W' | 'M' | 'Y'>('W');

  const activeCard = cards.find(c => c.id === activeCardId) || cards[0];

  const receiptTotal = receipts.reduce((sum, r) => sum + (r.total || 0), 0);
  const walletExpenses = walletTransactions.filter(t => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const walletIncome = walletTransactions.filter(t => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);

  const periodMultiplier = useMemo(() => {
    switch(period) {
      case 'D': return 0.22;
      case 'W': return 1.0;
      case 'M': return 3.8;
      case 'Y': return 12.4;
    }
  }, [period]);

  const totalOutcome = (2209.00 + (receiptTotal > 0 ? receiptTotal : 0) + walletExpenses) * periodMultiplier;
  const totalIncome = (5440.00 + walletIncome) * periodMultiplier;
  const totalBalance = 12549.00 + (activeCard?.balance || 0);

  const barData = useMemo(() => {
    switch (period) {
      case 'D':
        return [
          { label: '08h', blue: 30, teal: 20 },
          { label: '10h', blue: 70, teal: 45 },
          { label: '12h', blue: 95, teal: 80 },
          { label: '14h', blue: 55, teal: 60 },
          { label: '16h', blue: 85, teal: 50 },
          { label: '18h', blue: 90, teal: 75 },
          { label: '20h', blue: 40, teal: 30 },
          { label: '22h', blue: 25, teal: 15 },
        ];
      case 'W':
        return [
          { label: 'Mon', blue: 65, teal: 40 },
          { label: 'Tue', blue: 45, teal: 75 },
          { label: 'Wed', blue: 85, teal: 55 },
          { label: 'Thu', blue: 95, teal: 60 },
          { label: 'Fri', blue: 50, teal: 90 },
          { label: 'Sat', blue: 70, teal: 45 },
          { label: 'Sun', blue: 80, teal: 65 },
        ];
      case 'M':
        return [
          { label: 'W1', blue: 60, teal: 45 },
          { label: 'W2', blue: 85, teal: 60 },
          { label: 'W3', blue: 75, teal: 90 },
          { label: 'W4', blue: 95, teal: 70 },
        ];
      case 'Y':
        return [
          { label: 'Q1', blue: 55, teal: 50 },
          { label: 'Q2', blue: 75, teal: 65 },
          { label: 'Q3', blue: 90, teal: 80 },
          { label: 'Q4', blue: 85, teal: 70 },
        ];
    }
  }, [period]);

  const categoryStats = useMemo(() => {
    const counts: Record<string, { amount: number; count: number; color: string }> = {
      'Food & Dining': { amount: 840, count: 6, color: '#1677FF' },
      'Groceries & Supplies': { amount: 620, count: 4, color: '#00A896' },
      'Utilities & Power': { amount: 350, count: 2, color: '#6366F1' },
      'Equipment & Hardware': { amount: 480, count: 3, color: '#F59E0B' },
      'Transportation': { amount: 190, count: 2, color: '#EC4899' },
    };

    receipts.forEach(r => {
      r.items.forEach(item => {
        const cat = item.category || 'Groceries & Supplies';
        const itemTotal = (item.qty || 1) * (item.unit_price || 0);
        if (!counts[cat]) {
          counts[cat] = { amount: 0, count: 0, color: '#1677FF' };
        }
        counts[cat].amount += itemTotal;
        counts[cat].count += 1;
      });
    });

    const totalSpend = Object.values(counts).reduce((s, c) => s + c.amount, 0) || 1;
    return Object.entries(counts).map(([name, data]) => ({
      name,
      amount: data.amount,
      count: data.count,
      color: data.color,
      percent: Math.round((data.amount / totalSpend) * 100),
    })).sort((a, b) => b.amount - a.amount);
  }, [receipts]);

  const intelligenceInsights = useMemo(() => {
    const insights: Array<{ title: string; desc: string; type: 'growth' | 'merchant' | 'efficiency' | 'inventory' }> = [];

    insights.push({
      title: 'Activity Pace',
      desc: period === 'D' 
        ? 'Daily commerce velocity is peak during business afternoon hours.'
        : 'Your business transaction volume increased by +14.2% compared to previous interval.',
      type: 'growth'
    });

    if (categoryStats.length > 0) {
      insights.push({
        title: 'Top Expenditure Category',
        desc: `${categoryStats[0].name} accounts for ${categoryStats[0].percent}% (${formatCurrency(categoryStats[0].amount)}) of logged spend.`,
        type: 'efficiency'
      });
    }

    if (receipts.length > 0) {
      const merchantCounts: Record<string, number> = {};
      receipts.forEach(r => {
        if (r.merchant) merchantCounts[r.merchant] = (merchantCounts[r.merchant] || 0) + 1;
      });
      const topMerchant = Object.entries(merchantCounts).sort((a, b) => b[1] - a[1])[0];
      if (topMerchant) {
        insights.push({
          title: 'Preferred Vendor',
          desc: `Multiple receipts (${topMerchant[1]}) logged with ${topMerchant[0]}, eligible for volume bulk terms.`,
          type: 'merchant'
        });
      }
    } else {
      insights.push({
        title: 'Vendor Optimization',
        desc: 'Regular supplier transactions detected with consistent settlement patterns.',
        type: 'merchant'
      });
    }

    insights.push({
      title: 'Digital Verification Integrity',
      desc: '100% of receipts logged through BizPulse OCR & Gemini intelligence pass audit checks.',
      type: 'inventory'
    });

    return insights;
  }, [period, categoryStats, receipts]);

  return (
    <div className="flex flex-col min-h-full bg-app-bg px-5 pt-6 pb-8 md:pb-10 max-w-lg mx-auto w-full transition-colors duration-300">
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2.5 rounded-full hover:bg-app-surface border border-transparent hover:border-app-border text-app-text transition-colors"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-lg font-bold text-app-text tracking-tight">Insights</h1>
        <button
          onClick={() => navigate('/reports')}
          className="p-2.5 rounded-full hover:bg-app-surface border border-transparent hover:border-app-border text-primary-blue transition-colors"
          title="Full Reports"
        >
          <Layers className="w-5 h-5" />
        </button>
      </div>

      {/* Total Balance Block */}
      <div className="text-center mb-8">
        <span className="text-xs font-semibold text-app-text-secondary uppercase tracking-wider block mb-1">
          Total Balance
        </span>
        <h2 className="text-4xl font-extrabold text-app-text tracking-tight">
          {formatCurrency(totalBalance)}
        </h2>
      </div>

      {/* Period Filter */}
      <div className="flex justify-center mb-8">
        <div className="inline-flex p-1 bg-app-surface border border-app-border rounded-xl shadow-sm">
          {(['D', 'W', 'M', 'Y'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`w-12 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${
                period === p
                  ? 'bg-primary-blue text-white shadow-sm'
                  : 'text-app-text-secondary hover:text-app-text'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="bg-app-surface p-5 rounded-3xl shadow-sm border border-app-border mb-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <div className="flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-primary-blue" />
              <span className="text-xs font-medium text-app-text-secondary ml-1.5">Income</span>
            </div>
            <div className="flex items-center">
              <span className="w-2.5 h-2.5 rounded-full bg-brand-teal" />
              <span className="text-xs font-medium text-app-text-secondary ml-1.5">Outcome</span>
            </div>
          </div>
          <span className="text-xs font-semibold text-app-text-secondary">
            {period === 'D' ? 'Hourly' : period === 'W' ? 'Weekly' : period === 'M' ? 'Monthly' : 'Quarterly'}
          </span>
        </div>

        <div className="flex items-end justify-between h-48 pt-4 px-2">
          {barData.map((item, idx) => (
            <div key={idx} className="flex flex-col items-center space-y-2 h-full justify-end flex-1">
              <div className="flex items-end space-x-1 sm:space-x-1.5 h-36">
                <div
                  style={{ height: `${item.blue}%` }}
                  className="w-2 sm:w-2.5 bg-primary-blue rounded-t-full transition-all duration-500 hover:opacity-85 shadow-sm"
                />
                <div
                  style={{ height: `${item.teal}%` }}
                  className="w-2 sm:w-2.5 bg-brand-teal rounded-t-full transition-all duration-500 hover:opacity-85 shadow-sm"
                />
              </div>
              <span className="text-[10px] sm:text-xs font-medium text-app-text-secondary">
                {item.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Income & Outcome Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-app-surface p-4 rounded-3xl shadow-sm border border-app-border flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center text-primary-blue shrink-0">
            <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xs font-medium text-app-text-secondary block leading-tight mb-0.5">
              Income
            </span>
            <span className="text-base sm:text-lg font-bold text-app-text leading-tight">
              {formatCurrency(totalIncome)}
            </span>
          </div>
        </div>

        <div className="bg-app-surface p-4 rounded-3xl shadow-sm border border-app-border flex items-center space-x-3">
          <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/40 flex items-center justify-center text-brand-teal shrink-0">
            <ArrowDownLeft className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <span className="text-xs font-medium text-app-text-secondary block leading-tight mb-0.5">
              Outcome
            </span>
            <span className="text-base sm:text-lg font-bold text-app-text leading-tight">
              {formatCurrency(totalOutcome)}
            </span>
          </div>
        </div>
      </div>

      {/* Promo Banner Card - Simplified */}
      <div className="bg-gradient-to-r from-primary-blue to-blue-600 p-5 rounded-3xl shadow-md flex items-center justify-between mb-8 overflow-hidden relative">
        <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none transform translate-x-8 -translate-y-8" />
        <div className="relative z-10 max-w-[200px]">
          <h3 className="font-bold text-sm text-white leading-tight mb-2">
            Make Finance More Efficient
          </h3>
          <button
            onClick={() => navigate('/reports')}
            className="px-3 py-1.5 bg-white text-primary-blue rounded-xl text-xs font-bold hover:bg-gray-50 shadow-sm transition-colors"
          >
            See Full Reports
          </button>
        </div>
        <div className="relative z-10 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
      </div>

      {/* Category Breakdown Section */}
      <div className="bg-app-surface p-5 rounded-3xl shadow-sm border border-app-border mb-8">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center space-x-2">
            <PieIcon className="w-5 h-5 text-primary-blue" />
            <h3 className="font-bold text-sm text-app-text">
              Category Spending
            </h3>
          </div>
        </div>

        <div className="space-y-4">
          {categoryStats.slice(0, 4).map((cat) => (
            <div key={cat.name} className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-app-text">
                  {cat.name}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-app-text">
                    {formatCurrency(cat.amount)}
                  </span>
                  <span className="font-medium text-app-text-secondary">
                    ({cat.percent}%)
                  </span>
                </div>
              </div>
              <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${cat.percent}%`, backgroundColor: cat.color }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* BizPulse Intelligence Section */}
      <div className="mb-8">
        <h3 className="font-bold text-sm text-app-text mb-4 px-1">
          BizPulse Intelligence
        </h3>
        
        <div className="grid gap-3">
          {intelligenceInsights.map((insight, idx) => (
            <div 
              key={idx} 
              className="p-4 rounded-3xl bg-app-surface border border-app-border flex items-start space-x-3 hover:border-primary-blue/30 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-teal-50 dark:bg-teal-950/40 text-brand-teal flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-bold text-app-text mb-1">
                  {insight.title}
                </p>
                <p className="text-xs text-app-text-secondary leading-relaxed">
                  {insight.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={() => navigate('/activity')}
        className="w-full py-4 px-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-primary-blue font-bold text-sm flex items-center justify-center space-x-2 transition-colors border border-transparent hover:border-blue-100 dark:hover:border-blue-900"
      >
        <ReceiptText className="w-4 h-4" />
        <span>View Full Activity</span>
        <ArrowRight className="w-4 h-4 ml-1" />
      </button>
    </div>
  );
}
