import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { calculateInventory } from '../lib/inventory';
import { Package, Search, Plus, Minus, Settings, AlertTriangle, ArrowRight, Receipt, Activity, Filter, Info, ChevronRight, X, Calendar, MapPin } from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function Inventory() {
  const receipts = useStore(state => state.receipts);
  const adjustments = useStore(state => state.inventoryAdjustments);
  const settings = useStore(state => state.inventorySettings);
  
  const addAdjustment = useStore(state => state.addInventoryAdjustment);
  const updateSettings = useStore(state => state.updateInventorySettings);

  const inventory = useMemo(() => calculateInventory(receipts, adjustments, settings), [receipts, adjustments, settings]);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [showAdjustModal, setShowAdjustModal] = useState(false);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [adjustType, setAdjustType] = useState<'add' | 'remove' | 'set'>('add');

  const [showThresholdModal, setShowThresholdModal] = useState(false);
  const [thresholdAmount, setThresholdAmount] = useState('');

  const categories = ['All', ...Array.from(new Set(inventory.map(i => i.category)))].filter(Boolean);

  const filteredInventory = useMemo(() => {
    return inventory.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = filterCategory === 'All' || p.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [inventory, searchQuery, filterCategory]);

  const activeProduct = useMemo(() => {
    return inventory.find(p => p.normalizedName === selectedProduct) || null;
  }, [selectedProduct, inventory]);

  const handleAdjustStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct || !adjustAmount) return;
    
    const amountNum = parseFloat(adjustAmount);
    if (isNaN(amountNum)) return;
    
    let finalAmount = amountNum;
    if (adjustType === 'remove') finalAmount = -amountNum;

    addAdjustment({
      id: crypto.randomUUID(),
      normalizedName: activeProduct.normalizedName,
      amount: finalAmount,
      date: new Date().toISOString(),
      reason: adjustReason,
      isSetOperation: adjustType === 'set'
    });

    setShowAdjustModal(false);
    setAdjustAmount('');
    setAdjustReason('');
  };

  const handleSetThreshold = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) return;
    
    const amountNum = parseFloat(thresholdAmount);
    
    updateSettings(activeProduct.normalizedName, {
      reorderThreshold: isNaN(amountNum) ? undefined : amountNum
    });

    setShowThresholdModal(false);
    setThresholdAmount('');
  };

  const getStatus = (product: any) => {
    if (product.reorderThreshold != null) {
      if (product.estimatedStock <= 0) return { label: 'Out of Stock', color: 'text-rose-700 bg-rose-100', icon: AlertTriangle };
      if (product.estimatedStock <= product.reorderThreshold) return { label: 'Low Stock', color: 'text-amber-700 bg-amber-100', icon: AlertTriangle };
      return { label: 'In Stock', color: 'text-emerald-700 bg-emerald-100', icon: Activity };
    }
    if (!product.unit) return { label: 'Needs Review', color: 'text-app-text-secondary bg-gray-100 dark:bg-gray-800', icon: Info };
    return null;
  };

  const lowStockCount = inventory.filter(p => p.reorderThreshold != null && p.estimatedStock <= p.reorderThreshold).length;
  const reviewCount = inventory.filter(p => !p.unit).length;

  if (inventory.length === 0) {
    return (
      <div className="flex flex-col min-h-full bg-app-bg px-6 pb-8 md:pb-10 pt-12 transition-colors">
        <div className="flex items-center space-x-3 mb-12">
          <div className="bg-primary-blue p-2.5 rounded-full shadow-sm">
            <Package className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold text-app-text">Smart Inventory</span>
        </div>
        
        <div className="flex-1 flex flex-col justify-center items-center text-center max-w-sm mx-auto pb-20">
          <div className="w-24 h-24 bg-app-surface shadow-sm rounded-3xl flex items-center justify-center mb-8 rotate-3 border border-app-border">
            <Package className="w-10 h-10 text-primary-blue" strokeWidth={1.5} />
          </div>
          <h1 className="text-3xl font-bold text-app-text leading-tight mb-4">
            No inventory items yet.
          </h1>
          <p className="text-app-text-secondary text-base font-medium leading-relaxed mb-10">
            Confirm a receipt to start tracking purchased products and estimating stock levels.
          </p>
          <Link 
            to="/scan" 
            className="w-full bg-primary-blue text-white px-8 py-4 rounded-2xl font-bold shadow-md hover:bg-opacity-90 transition-colors flex items-center justify-center space-x-2"
          >
            <Receipt className="w-5 h-5" />
            <span>Scan Receipt</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-app-bg pb-8 md:pb-10 transition-colors">
      {/* Header */}
      <div className="bg-primary-blue text-white pt-10 pb-6 px-6 rounded-b-[32px] shadow-sm shrink-0 relative z-20">
        <div className="flex items-center space-x-4 mb-8">
          <div className="bg-white/20 backdrop-blur-sm p-3 rounded-full shadow-sm">
            <Package className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Smart Inventory</h1>
            <p className="text-white/80 text-[11px] mt-0.5 tracking-wide font-medium uppercase">Track and manage estimated stock</p>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white/10 rounded-2xl p-3 flex flex-col justify-center items-center text-center backdrop-blur-md border border-white/5">
            <span className="text-2xl font-bold mb-0.5">{inventory.length}</span>
            <span className="text-[9px] text-white/80 uppercase tracking-wider font-bold leading-tight">Products<br/>Tracked</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 flex flex-col justify-center items-center text-center backdrop-blur-md border border-white/5">
            <span className="text-2xl font-bold mb-0.5 text-amber-300">{lowStockCount}</span>
            <span className="text-[9px] text-amber-100/80 uppercase tracking-wider font-bold leading-tight">Low Stock<br/>Items</span>
          </div>
          <div className="bg-white/10 rounded-2xl p-3 flex flex-col justify-center items-center text-center backdrop-blur-md border border-white/5">
            <span className="text-2xl font-bold mb-0.5 text-gray-300">{reviewCount}</span>
            <span className="text-[9px] text-white/60 uppercase tracking-wider font-bold leading-tight">Needs<br/>Review</span>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 py-6 space-y-4">
        
        {/* Search & Filters */}
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-app-text-secondary" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-app-surface border border-app-border rounded-2xl pl-11 pr-4 py-3.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent placeholder:text-app-text-secondary/60 text-app-text shadow-sm transition-all"
            />
          </div>
          
          <div className="flex overflow-x-auto space-x-2 pb-1 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={cn(
                  "whitespace-nowrap px-4 py-2 rounded-full text-xs font-bold transition-colors border shadow-sm",
                  filterCategory === cat 
                    ? "bg-primary-blue text-white border-primary-blue" 
                    : "bg-app-surface text-app-text-secondary border-app-border hover:bg-gray-50 dark:hover:bg-gray-800"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product List */}
        <div className="space-y-3 pt-2">
          {filteredInventory.map(product => {
            const status = getStatus(product);
            return (
              <div 
                key={product.normalizedName} 
                onClick={() => setSelectedProduct(product.normalizedName)}
                className="bg-app-surface border border-app-border rounded-3xl p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer flex flex-col group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 pr-3">
                    <h3 className="font-bold text-app-text text-sm line-clamp-1 group-hover:text-primary-blue transition-colors">{product.name}</h3>
                    <p className="text-xs text-app-text-secondary font-medium mt-1">{product.category}</p>
                  </div>
                  {status && (
                    <div className={cn("px-2.5 py-1 rounded-full flex items-center shrink-0 border border-transparent shadow-[0_1px_2px_rgba(0,0,0,0.05)]", status.color, "bg-opacity-50")}>
                      <status.icon className="w-3.5 h-3.5 mr-1" strokeWidth={2.5} />
                      <span className="text-[10px] font-bold uppercase tracking-wider">{status.label}</span>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-between items-end mt-2 pt-3 border-t border-app-border">
                  <div>
                    <span className="text-[10px] text-app-text-secondary font-bold uppercase tracking-wider block mb-0.5">Est. Stock</span>
                    <div className="flex items-baseline text-brand-teal">
                      <span className="text-2xl font-bold tracking-tight">{product.estimatedStock}</span>
                      <span className="text-xs font-bold ml-1.5 opacity-80">{product.unit || '?'}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-app-text-secondary font-bold uppercase tracking-wider block mb-0.5">Last Price</span>
                    <span className="text-sm font-bold text-app-text">
                      {product.lastPurchasePrice ? formatCurrency(product.lastPurchasePrice) : '-'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredInventory.length === 0 && (
            <div className="text-center py-12 text-app-text-secondary font-medium text-sm">
              No products found for your search.
            </div>
          )}
        </div>
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && activeProduct && (
        <div className="absolute inset-0 z-50 bg-app-bg flex flex-col animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-primary-blue text-white pt-10 pb-6 px-6 rounded-b-[32px] shadow-sm shrink-0 flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-white/80 text-[10px] uppercase tracking-widest font-bold mb-1">Product Details</span>
              <h2 className="text-xl font-bold pr-4 leading-tight">{activeProduct.name}</h2>
            </div>
            <button 
              onClick={() => setSelectedProduct(null)}
              className="p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-colors shrink-0 shadow-sm"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6 pb-32">
            
            {/* Status Card */}
            <div className="bg-app-surface rounded-3xl p-6 border border-app-border shadow-sm flex items-center justify-between">
              <div>
                <span className="text-xs text-app-text-secondary font-bold uppercase tracking-wider block mb-1">Estimated Stock</span>
                <div className="flex items-baseline text-app-text">
                  <span className="text-4xl font-bold tracking-tight">{activeProduct.estimatedStock}</span>
                  <span className="text-sm font-bold ml-2 text-app-text-secondary">{activeProduct.unit || 'units'}</span>
                </div>
              </div>
              <div className="text-right space-y-2">
                <button 
                  onClick={() => setShowAdjustModal(true)}
                  className="bg-brand-teal text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm hover:opacity-90 transition-opacity"
                >
                  Adjust Stock
                </button>
              </div>
            </div>

            {/* Quick Info Grid */}
            <div className="grid grid-cols-2 gap-3">
               <div className="bg-app-surface p-5 rounded-2xl border border-app-border shadow-sm">
                <span className="text-[10px] text-app-text-secondary font-bold uppercase tracking-wider block mb-1.5">Total Purchased</span>
                <span className="text-sm font-bold text-app-text">{activeProduct.purchasedQuantity} {activeProduct.unit}</span>
               </div>
               <div className="bg-app-surface p-5 rounded-2xl border border-app-border shadow-sm">
                <span className="text-[10px] text-app-text-secondary font-bold uppercase tracking-wider block mb-1.5">Avg Price</span>
                <span className="text-sm font-bold text-app-text">{formatCurrency(activeProduct.averagePrice)}</span>
               </div>
               <div className="bg-app-surface p-5 rounded-2xl border border-app-border shadow-sm">
                <span className="text-[10px] text-app-text-secondary font-bold uppercase tracking-wider block mb-1.5">Last Purchase</span>
                <span className="text-sm font-bold text-app-text">
                  {activeProduct.lastPurchaseDate ? format(new Date(activeProduct.lastPurchaseDate), 'MMM d, yyyy') : '-'}
                </span>
               </div>
               <div className="bg-app-surface p-5 rounded-2xl border border-app-border shadow-sm flex flex-col justify-between">
                <span className="text-[10px] text-app-text-secondary font-bold uppercase tracking-wider block mb-1.5">Reorder Level</span>
                <div className="flex justify-between items-center">
                  <span className="text-sm font-bold text-app-text">
                    {activeProduct.reorderThreshold != null ? `${activeProduct.reorderThreshold}` : 'None'}
                  </span>
                  <button onClick={() => setShowThresholdModal(true)} className="p-1.5 text-primary-blue hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-full transition-colors">
                    <Settings className="w-4 h-4" />
                  </button>
                </div>
               </div>
            </div>

            {!activeProduct.unit && (
              <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-4 flex items-start space-x-3 text-amber-800 dark:text-amber-400">
                <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-500" />
                <p className="text-xs font-medium leading-relaxed">
                  <strong className="font-bold block mb-0.5">Missing Unit:</strong> This item doesn't have a specific unit (like kg or litres) identified from receipts. Stock is tracked in raw numeric quantities.
                </p>
              </div>
            )}

            {/* Adjustments History */}
            {activeProduct.adjustments.length > 0 && (
              <div className="bg-app-surface rounded-3xl p-5 border border-app-border shadow-sm">
                <h3 className="text-sm font-bold text-app-text mb-4">Manual Adjustments</h3>
                <div className="space-y-3">
                  {[...activeProduct.adjustments].reverse().map(adj => (
                    <div key={adj.id} className="flex justify-between items-center text-sm py-2.5 border-b border-app-border last:border-0 last:pb-0">
                      <div>
                        <p className="font-bold text-app-text text-xs">
                          {adj.isSetOperation ? 'Set stock' : adj.amount > 0 ? 'Added stock' : 'Removed stock'}
                        </p>
                        <p className="text-[11px] font-medium text-app-text-secondary mt-1">{format(new Date(adj.date), 'MMM d, yyyy')} {adj.reason ? `• ${adj.reason}` : ''}</p>
                      </div>
                      <span className={cn("font-bold text-sm", adj.isSetOperation ? "text-primary-blue" : adj.amount > 0 ? "text-emerald-600" : "text-amber-600")}>
                        {adj.isSetOperation ? adj.amount : (adj.amount > 0 ? `+${adj.amount}` : adj.amount)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Adjust Stock Modal */}
      {showAdjustModal && activeProduct && (
        <div className="fixed inset-0 z-[60] bg-gray-900/60 backdrop-blur-sm flex justify-center items-end md:items-center p-0 md:p-4 animate-in fade-in">
          <div className="bg-app-surface w-full max-w-[480px] max-h-[90dvh] overflow-y-auto rounded-t-[32px] md:rounded-[32px] p-6 pb-safe animate-in slide-in-from-bottom-8 md:zoom-in-95 duration-200 shadow-2xl border border-app-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-app-text">Adjust Stock</h2>
              <button onClick={() => setShowAdjustModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-app-text-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleAdjustStock} className="space-y-5">
              <div className="flex space-x-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl">
                {(['add', 'remove', 'set'] as const).map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAdjustType(type)}
                    className={cn(
                      "flex-1 py-2.5 text-xs font-bold rounded-xl capitalize transition-all",
                      adjustType === type ? "bg-app-surface text-app-text shadow-sm" : "text-app-text-secondary hover:text-app-text"
                    )}
                  >
                    {type}
                  </button>
                ))}
              </div>

              <div>
                <label className="block text-[10px] font-bold text-app-text-secondary uppercase tracking-wider mb-2">
                  {adjustType === 'set' ? 'New Estimated Stock' : 'Amount'}
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min={adjustType === 'set' ? 0 : 0.01}
                    required
                    value={adjustAmount}
                    onChange={e => setAdjustAmount(e.target.value)}
                    className="w-full bg-app-bg border border-app-border rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent font-medium text-app-text placeholder:text-app-text-secondary/60 transition-all"
                    placeholder="Enter quantity"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-app-text-secondary text-xs font-bold">
                    {activeProduct.unit || 'units'}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-app-text-secondary uppercase tracking-wider mb-2">
                  Reason (Optional)
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={e => setAdjustReason(e.target.value)}
                  className="w-full bg-app-bg border border-app-border rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent font-medium text-app-text placeholder:text-app-text-secondary/60 transition-all"
                  placeholder="e.g., Physical count, Sold, Damaged"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!adjustAmount || isNaN(parseFloat(adjustAmount))}
                  className="w-full bg-primary-blue text-white py-4 rounded-2xl font-bold shadow-md hover:bg-opacity-90 transition-opacity disabled:opacity-50"
                >
                  Confirm Adjustment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Threshold Modal */}
      {showThresholdModal && activeProduct && (
        <div className="fixed inset-0 z-[60] bg-gray-900/60 backdrop-blur-sm flex justify-center items-end md:items-center p-0 md:p-4 animate-in fade-in">
          <div className="bg-app-surface w-full max-w-[480px] max-h-[90dvh] overflow-y-auto rounded-t-[32px] md:rounded-[32px] p-6 pb-safe animate-in slide-in-from-bottom-8 md:zoom-in-95 duration-200 shadow-2xl border border-app-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-app-text">Set Reorder Threshold</h2>
              <button onClick={() => setShowThresholdModal(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-app-text-secondary transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSetThreshold} className="space-y-5">
              <p className="text-sm font-medium text-app-text-secondary leading-relaxed mb-4">
                You will see a "Low Stock" warning when the estimated stock falls to or below this quantity. Leave blank to disable.
              </p>

              <div>
                <label className="block text-[10px] font-bold text-app-text-secondary uppercase tracking-wider mb-2">
                  Low Stock Threshold
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={thresholdAmount}
                    onChange={e => setThresholdAmount(e.target.value)}
                    className="w-full bg-app-bg border border-app-border rounded-2xl px-4 py-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-blue focus:border-transparent font-medium text-app-text placeholder:text-app-text-secondary/60 transition-all"
                    placeholder="Enter quantity"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-app-text-secondary text-xs font-bold">
                    {activeProduct.unit || 'units'}
                  </span>
                </div>
              </div>

              <div className="pt-2 flex space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setThresholdAmount('');
                    handleSetThreshold({ preventDefault: () => {} } as any);
                  }}
                  className="flex-1 bg-gray-100 dark:bg-gray-800 text-app-text border border-app-border py-4 rounded-2xl font-bold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  Disable
                </button>
                <button
                  type="submit"
                  disabled={!thresholdAmount}
                  className="flex-1 bg-primary-blue text-white py-4 rounded-2xl font-bold shadow-md hover:bg-opacity-90 transition-opacity disabled:opacity-50"
                >
                  Save Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
