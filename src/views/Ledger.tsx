import React, { useState, useMemo } from 'react';
import { useStore, Receipt, ReceiptItem, isConfirmedReceipt } from '../store';
import { useAuthStore } from '../authStore';
import { format, parseISO, isValid } from 'date-fns';
import { formatCurrency } from '../lib/utils';
import { 
  ReceiptText, Search, ChevronDown, ChevronUp, 
  ArrowUpRight, ArrowDownLeft, X, Trash2, Edit2, Store, CheckCircle2
} from 'lucide-react';
import { Link } from 'react-router-dom';

function EditReceiptForm({ 
  receipt, 
  onSave, 
  onCancel 
}: { 
  receipt: Receipt; 
  onSave: (id: string, updates: Partial<Receipt>) => void; 
  onCancel: () => void 
}) {
  const suppliers = useStore(state => state.suppliers);
  const [editData, setEditData] = useState<Receipt>({ ...receipt, items: [...receipt.items.map(i => ({...i}))] });
  const [errors, setErrors] = useState<string[]>([]);

  const handleItemChange = (index: number, field: keyof ReceiptItem, value: any) => {
    const newItems = [...editData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setEditData({ ...editData, items: newItems });
  };

  const handleRemoveItem = (index: number) => {
    const newItems = [...editData.items];
    newItems.splice(index, 1);
    setEditData({ ...editData, items: newItems });
  };

  const handleSave = () => {
    const validationErrors: string[] = [];
    
    if (!editData.merchant?.trim()) validationErrors.push('Merchant name is required.');
    if (editData.total === undefined || editData.total === null || editData.total < 0 || isNaN(editData.total)) {
      validationErrors.push('Total amount must be a valid non-negative number.');
    }
    
    if (!editData.items || editData.items.length === 0) {
      validationErrors.push('At least one item is required.');
    } else {
      editData.items.forEach((item, idx) => {
        if (!item.name?.trim()) validationErrors.push(`Item ${idx + 1} name is required.`);
        if (item.qty <= 0 || isNaN(item.qty)) validationErrors.push(`Item ${idx + 1} quantity must be > 0.`);
        if (item.unit_price < 0 || isNaN(item.unit_price)) validationErrors.push(`Item ${idx + 1} price cannot be negative.`);
      });
    }

    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    onSave(receipt.id, {
      merchant: editData.merchant.trim(),
      supplierId: editData.supplierId || null,
      date: editData.date || null,
      total: Number(editData.total),
      items: editData.items.map(item => ({
        ...item,
        name: item.name.trim(),
        qty: Number(item.qty),
        unit_price: Number(item.unit_price),
        unit: item.unit?.trim() || null,
        category: item.category?.trim() || 'Uncategorized'
      }))
    });
  };

  return (
    <div className="bg-app-surface rounded-2xl p-4 mt-4 animate-in fade-in zoom-in-95 duration-200 border border-app-border">
      <div className="flex justify-between items-center mb-4 pb-3 border-b border-app-border">
        <h3 className="font-bold text-app-text flex items-center text-sm">
          <Edit2 className="w-4 h-4 mr-2 text-primary-blue" />
          Edit Receipt
        </h3>
        <button onClick={onCancel} className="p-1 rounded-full text-app-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {errors.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 p-3 rounded-xl text-xs mb-4">
          <ul className="list-disc pl-4 space-y-1">
            {errors.map((err, i) => (
              <li key={i}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-[10px] font-bold text-app-text-secondary uppercase tracking-wider mb-1">Merchant Name</label>
          <input 
            type="text" 
            value={editData.merchant} 
            onChange={(e) => setEditData({ ...editData, merchant: e.target.value })}
            className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-sm text-app-text focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-app-text-secondary uppercase tracking-wider mb-1">Date</label>
            <input 
              type="date" 
              value={editData.date || ''} 
              onChange={(e) => setEditData({ ...editData, date: e.target.value })}
              className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-sm text-app-text focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-app-text-secondary uppercase tracking-wider mb-1">Total ($)</label>
            <input 
              type="number"
              step="0.01" 
              value={editData.total === 0 ? '' : (editData.total || '')} 
              onChange={(e) => setEditData({ ...editData, total: Number(e.target.value) })}
              className="w-full bg-app-bg border border-app-border rounded-xl px-3 py-2 text-sm font-bold text-app-text focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue"
            />
          </div>
        </div>
      </div>

      <div className="flex space-x-3 mt-5">
        <button 
          onClick={onCancel}
          className="flex-1 border border-app-border text-app-text py-2.5 rounded-xl font-bold hover:bg-app-bg transition-colors text-xs"
        >
          Cancel
        </button>
        <button 
          onClick={handleSave}
          className="flex-1 bg-primary-blue text-white py-2.5 rounded-xl font-bold hover:bg-blue-600 transition-colors text-xs shadow-sm"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}

export default function Ledger() {
  const receipts = useStore((state) => state.receipts).filter(isConfirmedReceipt);
  const walletTransactions = useStore((state) => state.walletTransactions);
  const updateReceipt = useStore((state) => state.updateReceipt);
  const deleteReceipt = useStore((state) => state.deleteReceipt);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'receipts' | 'transfers'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [receiptToDelete, setReceiptToDelete] = useState<Receipt | null>(null);

  const allActivity = useMemo(() => {
    const items = [];
    
    receipts.forEach(r => {
      items.push({
        id: `receipt-${r.id}`,
        originalId: r.id,
        type: 'receipt',
        title: r.merchant,
        subtitle: `${r.items.length} items verified`,
        date: r.date || 'Recent',
        amount: -(r.total || 0),
        isPositive: false,
        details: r
      });
    });

    walletTransactions.forEach(t => {
      items.push({
        id: `tx-${t.id}`,
        originalId: t.id,
        type: 'transfer',
        title: t.title,
        subtitle: t.note || 'Wallet transaction',
        date: t.date,
        amount: t.amount,
        isPositive: t.amount > 0,
        details: null
      });
    });

    return items;
  }, [receipts, walletTransactions]);

  const filteredActivity = useMemo(() => {
    let result = allActivity;

    if (filterType === 'receipts') {
      result = result.filter(a => a.type === 'receipt');
    } else if (filterType === 'transfers') {
      result = result.filter(a => a.type === 'transfer');
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(a => 
        a.title.toLowerCase().includes(q) || 
        a.subtitle.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allActivity, searchQuery, filterType]);

  const handleEditSave = (id: string, updates: Partial<Receipt>) => {
    updateReceipt(id, updates);
    setEditingId(null);
  };

  const handleConfirmDelete = () => {
    if (receiptToDelete) {
      deleteReceipt(receiptToDelete.id);
      setReceiptToDelete(null);
      if (expandedId === `receipt-${receiptToDelete.id}`) {
        setExpandedId(null);
      }
      if (editingId === receiptToDelete.id) {
        setEditingId(null);
      }
    }
  };

  return (
    <div className="min-h-full bg-app-bg pb-8 md:pb-10 pt-6 px-5 max-w-2xl mx-auto w-full transition-colors duration-300">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-app-text tracking-tight">Activity</h1>
          <p className="text-xs font-medium text-app-text-secondary mt-1">Transactions and receipts</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Search */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-app-text-secondary" />
          </div>
          <input
            type="text"
            placeholder="Search activity..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-app-surface border border-app-border rounded-2xl pl-11 pr-10 py-3.5 text-sm font-medium text-app-text shadow-sm focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-app-text-secondary hover:text-app-text"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        
        {/* Filter Chips */}
        <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
          {(['all', 'receipts', 'transfers'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setFilterType(filter)}
              className={`whitespace-nowrap px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                filterType === filter 
                  ? 'bg-app-text text-app-surface shadow-sm' 
                  : 'bg-app-surface text-app-text-secondary border border-app-border hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              {filter === 'all' && 'All'}
              {filter === 'receipts' && 'Receipts'}
              {filter === 'transfers' && 'Transfers'}
            </button>
          ))}
        </div>

        {/* Results Summary */}
        <div className="text-xs font-semibold text-app-text-secondary px-1 pb-1">
          Showing {filteredActivity.length} result{filteredActivity.length !== 1 ? 's' : ''}
        </div>

        {/* List */}
        {filteredActivity.length === 0 ? (
          <div className="bg-app-surface rounded-3xl p-8 text-center shadow-sm border border-app-border mt-4">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <ReceiptText className="w-8 h-8 text-gray-300 dark:text-gray-600" />
            </div>
            <h3 className="text-sm font-bold text-app-text mb-1">No activity found</h3>
            <p className="text-xs font-medium text-app-text-secondary mb-6">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActivity.map(item => (
              <div 
                key={item.id}
                className={`bg-app-surface rounded-3xl shadow-sm border transition-all ${
                  expandedId === item.id ? 'border-primary-blue/30 shadow-md' : 'border-app-border hover:border-gray-300 dark:hover:border-gray-600'
                }`}
              >
                {/* Compact Row */}
                <button 
                  onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center space-x-3 overflow-hidden">
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
                      <p className="font-bold text-app-text text-sm truncate">{item.title}</p>
                      <p className="text-[11px] font-medium text-app-text-secondary mt-0.5 truncate">
                        {item.date} • {item.subtitle}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 pl-3 shrink-0">
                    <p className={`font-bold text-sm ${item.isPositive ? 'text-success' : 'text-app-text'}`}>
                      {item.isPositive ? '+' : ''}{formatCurrency(Math.abs(item.amount))}
                    </p>
                    <div className="text-gray-400 dark:text-gray-500">
                      {expandedId === item.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </button>

                {/* Expanded Details */}
                {expandedId === item.id && item.type === 'receipt' && item.details && (
                  <div className="px-4 pb-4 pt-1 border-t border-app-border animate-in fade-in slide-in-from-top-2 duration-200">
                    
                    {editingId === item.originalId ? (
                      <EditReceiptForm 
                        receipt={item.details} 
                        onSave={handleEditSave} 
                        onCancel={() => setEditingId(null)} 
                      />
                    ) : (
                      <>
                        <div className="mb-4">
                          <h4 className="text-[10px] font-bold text-app-text-secondary uppercase tracking-wider mb-2 mt-2">Item Breakdown</h4>
                          <div className="space-y-2.5">
                            {item.details.items.map((rItem: any, idx: number) => (
                              <div key={idx} className="flex justify-between items-start text-xs">
                                <div className="flex-1 pr-2">
                                  <span className="font-semibold text-app-text block">{rItem.name}</span>
                                  <span className="text-app-text-secondary font-medium text-[10px] mt-0.5 block">{rItem.category} • {rItem.qty} x {formatCurrency(rItem.unit_price || 0)}</span>
                                </div>
                                <div className="text-app-text font-bold pt-0.5 shrink-0">
                                  {formatCurrency((rItem.qty || 0) * (rItem.unit_price || 0))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex justify-end pt-3 border-t border-app-border space-x-2">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(item.originalId);
                            }}
                            className="p-2 text-primary-blue hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl transition-colors font-bold text-xs flex items-center"
                            title="Edit Receipt"
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setReceiptToDelete(item.details);
                            }}
                            className="p-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-colors font-bold text-xs flex items-center"
                            title="Delete Receipt"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {receiptToDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gray-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-app-surface rounded-3xl w-full max-w-xs p-6 shadow-2xl animate-in zoom-in-95 duration-200 text-center border border-app-border">
            <div className="w-14 h-14 rounded-full bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-rose-500" />
            </div>
            <h3 className="text-lg font-bold text-app-text mb-2">Delete Receipt?</h3>
            <p className="text-xs font-medium text-app-text-secondary mb-6">
              Are you sure you want to delete this receipt? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setReceiptToDelete(null)}
                className="flex-1 py-2.5 rounded-xl font-bold text-app-text bg-app-bg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-app-border"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 transition-colors shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
