import React, { useState, useMemo } from 'react';
import { useStore, Budget, isConfirmedReceipt } from '../store';
import { calculateBudgetSpending, BudgetAnalysis } from '../lib/budget';
import { Target, Plus, AlertTriangle, TrendingUp, X, Calendar, Activity, Info, TrendingDown, Receipt } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { Link } from 'react-router-dom';
import { format, addMonths, addWeeks, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isValid, parseISO } from 'date-fns';

export default function BudgetView() {
  const receipts = useStore(state => state.receipts);
  const budgets = useStore(state => state.budgets);
  const addBudget = useStore(state => state.addBudget);
  const deleteBudget = useStore(state => state.deleteBudget);
  
  const budgetAnalyses = useMemo(() => calculateBudgetSpending(budgets, receipts), [budgets, receipts]);
  
  const categories = useMemo(() => {
     const cats = new Set<string>();
     receipts.filter(isConfirmedReceipt).forEach(r => r.items.forEach(i => {
       if (i.category) cats.add(i.category);
     }));
     return Array.from(cats).sort();
  }, [receipts]);

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [period, setPeriod] = useState<'weekly' | 'monthly' | 'custom'>('monthly');
  const [budgetType, setBudgetType] = useState<'overall' | 'category'>('overall');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [alertThreshold, setAlertThreshold] = useState('80');

  // Total stats
  const totalBudgeted = budgets.reduce((sum, b) => sum + b.amount, 0);
  const totalSpent = budgetAnalyses.reduce((sum, b) => sum + b.spent, 0);
  const overBudgetCount = budgetAnalyses.filter(b => b.status === 'Over Budget').length;

  const handlePeriodChange = (newPeriod: 'weekly' | 'monthly' | 'custom') => {
    setPeriod(newPeriod);
    const now = new Date();
    if (newPeriod === 'weekly') {
      setStartDate(format(startOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
      setEndDate(format(endOfWeek(now, { weekStartsOn: 1 }), 'yyyy-MM-dd'));
    } else if (newPeriod === 'monthly') {
      setStartDate(format(startOfMonth(now), 'yyyy-MM-dd'));
      setEndDate(format(endOfMonth(now), 'yyyy-MM-dd'));
    }
  };

  const handleSaveBudget = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) return;
    
    const start = parseISO(startDate);
    const end = parseISO(endDate);
    if (!isValid(start) || !isValid(end) || start > end) return;

    addBudget({
      id: crypto.randomUUID(),
      name: name || (budgetType === 'category' ? `${category} Budget` : 'New Budget'),
      amount: amountNum,
      currency: 'INR',
      period,
      startDate,
      endDate,
      category: budgetType === 'category' ? category : undefined,
      alertThreshold: parseFloat(alertThreshold) || undefined,
      createdAt: new Date().toISOString()
    });

    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setName('');
    setAmount('');
    setBudgetType('overall');
    setCategory('');
    handlePeriodChange('monthly');
    setAlertThreshold('80');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      deleteBudget(id);
    }
  };

  if (budgets.length === 0) {
    return (
      <div className="flex flex-col min-h-full bg-app-bg px-6 pb-8 md:pb-10 pt-12 transition-colors">
        <div className="flex items-center space-x-3 mb-12">
          <div className="bg-primary-blue p-2.5 rounded-full shadow-sm">
            <Target className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-app-text">Budgets</span>
        </div>
        
        <div className="flex-1 flex flex-col justify-center items-center text-center max-w-sm mx-auto pb-20">
          <div className="w-24 h-24 bg-app-surface shadow-sm rounded-3xl flex items-center justify-center mb-8 rotate-3 border border-app-border">
            <Target className="w-10 h-10 text-primary-blue" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold text-app-text leading-tight mb-4">
            Set your first spending limit.
          </h1>
          <p className="text-app-text-secondary text-base font-medium leading-relaxed mb-10">
            Create a budget to understand your expenses and keep purchasing decisions organized.
          </p>
          <button 
            onClick={() => setShowModal(true)}
            className="w-full bg-primary-blue text-white px-8 py-4 rounded-2xl font-bold shadow-md hover:bg-opacity-90 transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Budget</span>
          </button>
        </div>
        {showModal && <BudgetModal />}
      </div>
    );
  }

  return (
    <div className="min-h-full bg-app-bg pb-8 md:pb-10 transition-colors">
      {/* Header */}
      <div className="bg-primary-blue text-white pt-10 pb-6 px-6 rounded-b-[32px] shadow-sm shrink-0 relative z-20">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full shadow-sm">
              <Target className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">Budget & Spending</h1>
              <p className="text-white/80 text-[11px] mt-0.5 tracking-wide font-medium uppercase">Monitor expense progress</p>
            </div>
          </div>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-white/10 p-2.5 rounded-full hover:bg-white/20 transition-colors backdrop-blur-sm shadow-sm"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-2xl p-3 flex flex-col justify-center items-center text-center backdrop-blur-md border border-white/5">
            <span className="text-2xl font-bold mb-0.5">{budgets.length}</span>
            <span className="text-[9px] text-white/80 uppercase tracking-wider font-bold leading-tight">Active<br/>Budgets</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 flex flex-col justify-center items-center text-center backdrop-blur-md border border-white/5">
            <span className="text-xl font-bold mb-0.5 truncate w-full px-1">
              {formatCurrency(totalBudgeted)}
            </span>
            <span className="text-[9px] text-white/80 uppercase tracking-wider font-bold leading-tight">Total<br/>Budgeted</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 flex flex-col justify-center items-center text-center backdrop-blur-md border border-white/5">
            <span className={cn("text-2xl font-bold mb-0.5", overBudgetCount > 0 ? "text-rose-300" : "text-emerald-300")}>{overBudgetCount}</span>
            <span className="text-[9px] text-white/80 uppercase tracking-wider font-bold leading-tight">Over<br/>Limit</span>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 space-y-4">
        {budgetAnalyses.map(analysis => {
          const { budget, spent, remaining, percentage, status } = analysis;
          return (
            <div key={budget.id} className="bg-app-surface border border-app-border rounded-3xl p-5 shadow-sm relative overflow-hidden group">
              
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1 pr-4">
                  <div className="flex items-center space-x-2 mb-1.5">
                    <h3 className="font-bold text-app-text text-sm">{budget.name}</h3>
                    {budget.category && (
                       <span className="text-[10px] bg-brand-teal/10 text-brand-teal px-2 py-0.5 rounded-full font-bold">
                         {budget.category}
                       </span>
                    )}
                  </div>
                  <p className="text-[11px] text-app-text-secondary font-medium flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    {format(parseISO(budget.startDate), 'MMM d')} - {format(parseISO(budget.endDate), 'MMM d')}
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <button onClick={() => handleDelete(budget.id)} className="p-1 text-app-text-secondary hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">
                    <X className="w-4 h-4" />
                  </button>
                  <div className={cn("px-2.5 py-1 rounded-full flex items-center border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.05)]", 
                    status === 'Over Budget' ? 'bg-rose-100 text-rose-700' :
                    status === 'Near Limit' ? 'bg-amber-100 text-amber-700' :
                    status === 'No Data' ? 'bg-gray-100 text-gray-700 dark:text-gray-300' :
                    'bg-emerald-100 text-emerald-700'
                  )}>
                    {status === 'Over Budget' && <TrendingDown className="w-3 h-3 mr-1" />}
                    {status === 'Near Limit' && <AlertTriangle className="w-3 h-3 mr-1" />}
                    <span className="text-[10px] font-bold uppercase tracking-wider">{status}</span>
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-4">
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-baseline text-app-text">
                    <span className="text-2xl font-bold tracking-tight">{formatCurrency(spent)}</span>
                    <span className="text-xs font-bold ml-1.5 opacity-60">spent</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-app-text-secondary font-bold uppercase tracking-wider block mb-0.5">Total Budget</span>
                    <span className="text-sm font-bold text-app-text">{formatCurrency(budget.amount)}</span>
                  </div>
                </div>
                
                <div className="h-3 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex relative">
                   <div 
                     className={cn("h-full transition-all duration-500", 
                        percentage >= 100 ? "bg-rose-500" :
                        budget.alertThreshold && percentage >= budget.alertThreshold ? "bg-amber-400" :
                        "bg-brand-teal"
                     )}
                     style={{ width: `${Math.min(percentage, 100)}%` }}
                   />
                   {budget.alertThreshold && (
                     <div 
                       className="absolute top-0 bottom-0 border-l-2 border-black/20"
                       style={{ left: `${budget.alertThreshold}%` }}
                     />
                   )}
                </div>
              </div>
              
              <div className={cn("text-xs font-bold px-3 py-2 rounded-xl flex items-center justify-between",
                  percentage >= 100 ? "bg-rose-50 text-rose-700" : "bg-brand-teal/10 text-brand-teal"
              )}>
                <span>
                  {percentage >= 100 
                    ? `Over budget by ${formatCurrency(Math.abs(remaining))}`
                    : `${formatCurrency(remaining)} remaining`
                  }
                </span>
                <span>{percentage.toFixed(0)}% used</span>
              </div>
            </div>
          );
        })}
      </div>
      
      {showModal && <BudgetModal />}
    </div>
  );

  function BudgetModal() {
    return (
      <div className="fixed inset-0 z-[60] bg-gray-900/60 backdrop-blur-sm flex justify-center items-end md:items-center p-0 md:p-4 animate-in fade-in">
        <div className="bg-app-surface w-full max-w-[480px] max-h-[90dvh] flex flex-col rounded-t-[32px] md:rounded-[32px] overflow-hidden animate-in slide-in-from-bottom-8 md:zoom-in-95 duration-200 shadow-2xl border border-app-border">
          
          <div className="flex justify-between items-center p-6 pb-4 border-b border-app-border shrink-0">
            <h2 className="text-lg font-bold text-app-text">Create Budget</h2>
            <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-app-text-secondary transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            <form id="budget-form" onSubmit={handleSaveBudget} className="space-y-5">
              
              <div className="flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setBudgetType('overall')}
                  className={cn(
                    "flex-1 py-2.5 text-xs font-bold rounded-xl capitalize transition-all",
                    budgetType === 'overall' ? "bg-app-surface text-app-text shadow-sm" : "text-app-text-secondary hover:text-app-text"
                  )}
                >
                  Overall
                </button>
                <button
                  type="button"
                  onClick={() => setBudgetType('category')}
                  className={cn(
                    "flex-1 py-2.5 text-xs font-bold rounded-xl capitalize transition-all",
                    budgetType === 'category' ? "bg-app-surface text-app-text shadow-sm" : "text-app-text-secondary hover:text-app-text"
                  )}
                >
                  Category
                </button>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-app-text-secondary uppercase tracking-wider mb-2">Budget Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-app-bg border border-app-border rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent font-medium text-app-text placeholder:text-app-text-secondary/60 transition-all"
                  placeholder="e.g. Monthly Operations"
                />
              </div>

              {budgetType === 'category' && (
                <div>
                  <label className="block text-[10px] font-bold text-app-text-secondary uppercase tracking-wider mb-2">Category</label>
                  <select
                    required
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full bg-app-bg border border-app-border rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent font-medium text-app-text transition-all"
                  >
                    <option value="" disabled>Select a category</option>
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  {categories.length === 0 && (
                    <p className="text-xs font-medium text-amber-600 mt-2 flex items-center">
                      <AlertTriangle className="w-3.5 h-3.5 mr-1.5" />
                      No categories found in confirmed receipts.
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-app-text-secondary uppercase tracking-wider mb-2">Amount (₹)</label>
                <input
                  type="number"
                  required
                  min="1"
                  step="1"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="w-full bg-app-bg border border-app-border rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent font-medium text-app-text placeholder:text-app-text-secondary/60 transition-all"
                  placeholder="0.00"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 flex bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl mb-1">
                  {(['weekly', 'monthly', 'custom'] as const).map(p => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => handlePeriodChange(p)}
                      className={cn(
                        "flex-1 py-2 text-xs font-bold rounded-xl capitalize transition-all",
                        period === p ? "bg-app-surface text-app-text shadow-sm" : "text-app-text-secondary hover:text-app-text"
                      )}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-app-text-secondary uppercase tracking-wider mb-1.5">Start Date</label>
                  <input
                    type="date"
                    required
                    disabled={period !== 'custom'}
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-blue disabled:opacity-50 font-medium text-app-text transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-app-text-secondary uppercase tracking-wider mb-1.5">End Date</label>
                  <input
                    type="date"
                    required
                    disabled={period !== 'custom'}
                    value={endDate}
                    min={startDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-primary-blue disabled:opacity-50 font-medium text-app-text transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-app-text-secondary uppercase tracking-wider mb-2">Alert Threshold (%)</label>
                <div className="flex items-center space-x-4">
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={alertThreshold}
                    onChange={e => setAlertThreshold(e.target.value)}
                    className="flex-1 accent-primary-blue"
                  />
                  <span className="font-bold text-app-text w-12 text-right">{alertThreshold}%</span>
                </div>
                <p className="text-[11px] font-medium text-app-text-secondary mt-1.5">Warn me when spending reaches this percentage.</p>
              </div>

            </form>
          </div>
          
          <div className="p-6 pt-4 border-t border-app-border bg-app-surface shrink-0">
             <button
                type="submit"
                form="budget-form"
                disabled={!amount || (budgetType === 'category' && !category)}
                className="w-full bg-primary-blue text-white py-4 rounded-2xl font-bold shadow-md hover:bg-opacity-90 transition-colors disabled:opacity-50"
              >
                Save Budget
             </button>
          </div>
          
        </div>
      </div>
    );
  }
}
