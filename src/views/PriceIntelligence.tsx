import React, { useMemo, useState } from 'react';
import { useStore } from '../store';
import { calculatePriceIntelligence, PriceComparison } from '../lib/intelligence';
import { 
  TrendingUp, TrendingDown, Minus, AlertTriangle, 
  Search, Filter, ArrowUpRight, ArrowDownRight, 
  Store, Calendar, Package, ChevronRight, Info
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { format, parseISO } from 'date-fns';

export default function PriceIntelligence() {
  const receipts = useStore(state => state.receipts);
  const suppliers = useStore(state => state.suppliers);
  const { comparisons } = useMemo(() => calculatePriceIntelligence(receipts, suppliers), [receipts, suppliers]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  
  const filteredComparisons = useMemo(() => {
    return comparisons.filter(c => {
      const matchesSearch = c.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            c.category.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = filterStatus === 'All' || c.status === filterStatus;
      
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      // Sort by largest absolute percentage change
      return Math.abs(b.percentageChange) - Math.abs(a.percentageChange);
    });
  }, [comparisons, searchQuery, filterStatus]);

  const increases = comparisons.filter(c => c.status === 'Increased').length;
  const decreases = comparisons.filter(c => c.status === 'Decreased').length;
  const unchanged = comparisons.filter(c => c.status === 'Unchanged').length;
  const needsReview = comparisons.filter(c => c.status === 'Insufficient Data' || c.status === 'Needs Review').length;

  return (
    <div className="min-h-full bg-app-bg pb-8 md:pb-10">
      {/* Header */}
      <div className="bg-[#0B2E33] text-white pt-12 pb-8 px-6 rounded-b-[40px] shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white dark:bg-gray-800 opacity-5 blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 rounded-full bg-[#02C39A] opacity-10 blur-2xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-2xl font-bold mb-2">Price Intelligence</h1>
          <p className="text-[#02C39A] text-sm font-medium">Understand purchasing price changes using your confirmed receipt history.</p>
        </div>
      </div>

      <div className="px-4 -mt-4 relative z-20">
        {/* Summary Stats */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-teal-50 dark:border-gray-700 flex flex-col justify-between">
            <div className="flex items-center text-red-600 mb-2">
              <div className="bg-red-50 p-2 rounded-xl mr-2">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold">Increases</span>
            </div>
            <p className="text-2xl font-bold text-[#0B2E33] dark:text-gray-100">{increases}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-teal-50 dark:border-gray-700 flex flex-col justify-between">
            <div className="flex items-center text-emerald-600 mb-2">
              <div className="bg-emerald-50 p-2 rounded-xl mr-2">
                <TrendingDown className="w-5 h-5" />
              </div>
              <span className="text-sm font-semibold">Decreases</span>
            </div>
            <p className="text-2xl font-bold text-[#0B2E33] dark:text-gray-100">{decreases}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-sm border border-teal-50 dark:border-gray-700 mb-6 space-y-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border-none rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#02C39A] outline-none transition-all"
            />
          </div>
          
          <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
            {['All', 'Increased', 'Decreased', 'Unchanged', 'Insufficient Data'].map(status => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors",
                  filterStatus === status 
                    ? "bg-[#0B2E33] text-white" 
                    : "bg-gray-100 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                )}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        {comparisons.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 text-center flex flex-col items-center border border-teal-50 dark:border-gray-700 shadow-sm mt-8">
            <div className="w-16 h-16 bg-teal-50 dark:bg-[#028090]/20 rounded-full flex items-center justify-center mb-4">
              <TrendingUp className="w-8 h-8 text-[#028090]" />
            </div>
            <h3 className="text-lg font-bold text-[#0B2E33] dark:text-gray-100 mb-2">Build your price history.</h3>
            <p className="text-sm text-[#5C7A7D] dark:text-gray-400 mb-6 max-w-[250px]">
              Scan more confirmed receipts to compare product prices across purchases and merchants.
            </p>
          </div>
        ) : filteredComparisons.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No products match your filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredComparisons.map((comp, idx) => (
              <ComparisonCard key={idx} comparison={comp} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ComparisonCard({ comparison }: { comparison: PriceComparison; key?: React.Key }) {
  const isIncreased = comparison.status === 'Increased';
  const isDecreased = comparison.status === 'Decreased';
  const isUnchanged = comparison.status === 'Unchanged';
  const isInsufficient = comparison.status === 'Insufficient Data' || comparison.status === 'Needs Review';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-teal-50 dark:border-gray-700">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-[#0B2E33] dark:text-gray-100 text-base leading-tight mb-1 pr-2">
            {comparison.productName}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center">
            <Package className="w-3 h-3 mr-1" />
            {comparison.unit ? comparison.unit : 'No unit specified'}
          </p>
        </div>
        
        {!isInsufficient && (
          <div className={cn(
            "px-3 py-1 rounded-full text-xs font-bold flex items-center shrink-0",
            isIncreased ? "bg-red-100 text-red-700" : 
            isDecreased ? "bg-emerald-100 text-emerald-700" : 
            "bg-gray-100 text-gray-600 dark:text-gray-400"
          )}>
            {isIncreased && <ArrowUpRight className="w-3 h-3 mr-1" />}
            {isDecreased && <ArrowDownRight className="w-3 h-3 mr-1" />}
            {isUnchanged && <Minus className="w-3 h-3 mr-1" />}
            {isUnchanged ? 'No Change' : `${Math.abs(comparison.percentageChange).toFixed(1)}%`}
          </div>
        )}
        
        {isInsufficient && (
          <div className="bg-amber-100 text-amber-700 px-3 py-1 rounded-full text-[10px] font-bold flex items-center shrink-0">
            <AlertTriangle className="w-3 h-3 mr-1" />
            Needs Data
          </div>
        )}
      </div>

      <div className="flex items-end justify-between mt-4">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Latest Price</p>
          <p className={cn(
            "text-xl font-bold", 
            isIncreased ? "text-red-600" : isDecreased ? "text-emerald-600" : "text-[#0B2E33] dark:text-gray-100"
          )}>
            {formatCurrency(comparison.latestPrice)}
          </p>
          {comparison.latestDate && (
            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {format(parseISO(comparison.latestDate), 'MMM d, yyyy')}
            </p>
          )}
        </div>
        
        {!isInsufficient ? (
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400 mb-1">Previous Price</p>
            <p className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              {formatCurrency(comparison.previousPrice)}
            </p>
            {comparison.previousDate && (
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 flex items-center justify-end">
                <Calendar className="w-3 h-3 mr-1" />
                {format(parseISO(comparison.previousDate), 'MMM d, yyyy')}
              </p>
            )}
          </div>
        ) : (
          <div className="text-right">
             <p className="text-[10px] text-gray-500 dark:text-gray-400 max-w-[120px]">
               One recorded purchase is available. Scan another comparable receipt.
             </p>
          </div>
        )}
      </div>

      {!isInsufficient && comparison.latestMerchant !== comparison.previousMerchant && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[10px] font-medium text-gray-400">Merchant change</span>
            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 flex items-center mt-1">
              <Store className="w-3 h-3 mr-1 text-[#028090]" />
              {comparison.previousMerchant} <ChevronRight className="w-3 h-3 mx-1 text-gray-300" /> {comparison.latestMerchant}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
