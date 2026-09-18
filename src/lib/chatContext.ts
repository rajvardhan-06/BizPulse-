import { Receipt, Budget, Supplier, InventoryAdjustment, InventorySettings } from '../store';
import { calculateInventory, InventoryProduct } from './inventory';
import { calculateBudgetSpending, BudgetAnalysis } from './budget';
import { calculatePriceIntelligence } from './intelligence';
import { calculateSupplierIntelligence } from './supplier';
import { formatCurrency } from './utils';

export interface ConfirmedFinancialSummary {
  hasData: boolean;
  totalSpending: number;
  totalSpendingFormatted: string;
  confirmedReceiptsCount: number;
  averageTransactionValue: number;
  averageTransactionValueFormatted: string;
  earliestDate: string | null;
  latestDate: string | null;
  categoryBreakdown: Array<{
    category: string;
    total: number;
    formatted: string;
    percentage: number;
    transactionCount: number;
  }>;
  topMerchants: Array<{
    merchant: string;
    total: number;
    formatted: string;
    transactionCount: number;
  }>;
  recentTransactions: Array<{
    date: string;
    merchant: string;
    total: number;
    formatted: string;
    itemsSummary: string;
  }>;
  budgetOverview: Array<{
    name: string;
    allocated: string;
    spent: string;
    remaining: string;
    percentUsed: number;
    status: string;
  }>;
  inventoryAlerts: Array<{
    name: string;
    estimatedStock: number;
    unit: string | null;
    reorderThreshold?: number;
    status: 'low_stock' | 'out_of_stock' | 'normal';
  }>;
  supplierHighlights: Array<{
    name: string;
    totalSpendingFormatted: string;
    purchaseCount: number;
  }>;
}

export function computeConfirmedFinancialSummary(
  receipts: Receipt[],
  budgets: Budget[],
  suppliers: Supplier[],
  inventoryAdjustments: InventoryAdjustment[],
  inventorySettings: Record<string, InventorySettings> | InventorySettings
): ConfirmedFinancialSummary {
  const confirmed = receipts.filter(r => r.confirmed && r.status !== 'deleted');

  if (confirmed.length === 0) {
    return {
      hasData: false,
      totalSpending: 0,
      totalSpendingFormatted: formatCurrency(0),
      confirmedReceiptsCount: 0,
      averageTransactionValue: 0,
      averageTransactionValueFormatted: formatCurrency(0),
      earliestDate: null,
      latestDate: null,
      categoryBreakdown: [],
      topMerchants: [],
      recentTransactions: [],
      budgetOverview: [],
      inventoryAlerts: [],
      supplierHighlights: []
    };
  }

  // 1. Total Spending & Averages
  let totalSpending = 0;
  const dates: string[] = [];
  const categoryMap = new Map<string, { total: number; count: number }>();
  const merchantMap = new Map<string, { total: number; count: number }>();

  // Sort chronologically descending
  const sortedReceipts = [...confirmed].sort((a, b) => {
    const timeA = a.date ? new Date(a.date).getTime() : a.captureTimestamp;
    const timeB = b.date ? new Date(b.date).getTime() : b.captureTimestamp;
    return timeB - timeA;
  });

  for (const r of sortedReceipts) {
    const amt = Number(r.total) || 0;
    totalSpending += amt;
    if (r.date) dates.push(r.date);

    // Merchant grouping
    const mName = (r.merchant || 'Unknown Merchant').trim();
    const mCur = merchantMap.get(mName) || { total: 0, count: 0 };
    mCur.total += amt;
    mCur.count += 1;
    merchantMap.set(mName, mCur);

    // Category breakdown from items
    if (Array.isArray(r.items) && r.items.length > 0) {
      for (const it of r.items) {
        const cat = (it.category || 'General').trim();
        const itTotal = (Number(it.qty) || 1) * (Number(it.unit_price) || 0);
        const cCur = categoryMap.get(cat) || { total: 0, count: 0 };
        cCur.total += itTotal;
        cCur.count += 1;
        categoryMap.set(cat, cCur);
      }
    } else {
      const cat = 'General Purchases';
      const cCur = categoryMap.get(cat) || { total: 0, count: 0 };
      cCur.total += amt;
      cCur.count += 1;
      categoryMap.set(cat, cCur);
    }
  }

  const confirmedReceiptsCount = confirmed.length;
  const averageTransactionValue = confirmedReceiptsCount > 0 ? totalSpending / confirmedReceiptsCount : 0;

  // Category array sorted by highest spending
  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      total: Math.round(data.total * 100) / 100,
      formatted: formatCurrency(data.total),
      percentage: totalSpending > 0 ? Math.round((data.total / totalSpending) * 1000) / 10 : 0,
      transactionCount: data.count
    }))
    .sort((a, b) => b.total - a.total);

  // Top Merchants sorted by spending
  const topMerchants = Array.from(merchantMap.entries())
    .map(([merchant, data]) => ({
      merchant,
      total: Math.round(data.total * 100) / 100,
      formatted: formatCurrency(data.total),
      transactionCount: data.count
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Recent 10 transactions
  const recentTransactions = sortedReceipts.slice(0, 10).map(r => {
    const itemNames = (r.items || []).map(i => `${i.name} (${i.qty})`).slice(0, 4).join(', ');
    const itemsSummary = itemNames + (r.items && r.items.length > 4 ? ` +${r.items.length - 4} more` : '');
    return {
      date: r.date || 'Undated',
      merchant: r.merchant || 'Merchant',
      total: Number(r.total) || 0,
      formatted: formatCurrency(Number(r.total) || 0),
      itemsSummary: itemsSummary || 'Standard purchase'
    };
  });

  // 2. Budget Spending Deterministic Analysis
  const budgetSpending: BudgetAnalysis[] = calculateBudgetSpending(budgets, confirmed);
  const budgetOverview = budgetSpending.map(b => ({
    name: b.budget.name,
    allocated: formatCurrency(b.budget.amount),
    spent: formatCurrency(b.spent),
    remaining: formatCurrency(b.remaining),
    percentUsed: Math.round(b.percentage * 10) / 10,
    status: b.status
  }));

  // 3. Inventory Stock Alerts
  const safeSettings: Record<string, InventorySettings> = 
    inventorySettings && typeof inventorySettings === 'object' && !('reorderThreshold' in inventorySettings)
      ? (inventorySettings as Record<string, InventorySettings>)
      : {};

  const inventory: InventoryProduct[] = calculateInventory(confirmed, inventoryAdjustments, safeSettings);
  const inventoryAlerts = inventory
    .filter(item => {
      const threshold = item.reorderThreshold ?? 5;
      return item.estimatedStock <= threshold || item.estimatedStock <= 0;
    })
    .slice(0, 8)
    .map(i => ({
      name: i.name,
      estimatedStock: i.estimatedStock,
      unit: i.unit,
      reorderThreshold: i.reorderThreshold,
      status: (i.estimatedStock <= 0 ? 'out_of_stock' : 'low_stock') as 'low_stock' | 'out_of_stock' | 'normal'
    }));

  // 4. Supplier Intelligence
  const supplierIntel = calculateSupplierIntelligence(confirmed, suppliers);
  const supplierHighlights = supplierIntel.analyses.slice(0, 5).map(s => ({
    name: s.supplier.name,
    totalSpendingFormatted: formatCurrency(s.totalSpending),
    purchaseCount: s.purchaseCount
  }));

  const sortedDates = dates.sort();

  return {
    hasData: true,
    totalSpending: Math.round(totalSpending * 100) / 100,
    totalSpendingFormatted: formatCurrency(totalSpending),
    confirmedReceiptsCount,
    averageTransactionValue: Math.round(averageTransactionValue * 100) / 100,
    averageTransactionValueFormatted: formatCurrency(averageTransactionValue),
    earliestDate: sortedDates[0] || null,
    latestDate: sortedDates[sortedDates.length - 1] || null,
    categoryBreakdown,
    topMerchants,
    recentTransactions,
    budgetOverview,
    inventoryAlerts,
    supplierHighlights
  };
}

/**
 * Filter context compactly based on user intent to keep tokens minimal and highly targeted
 */
export function buildRelevantContext(
  userQuery: string,
  summary: ConfirmedFinancialSummary
): Record<string, any> {
  const query = (userQuery || '').toLowerCase();

  // Baseline verified metrics that are always relevant
  const baseContext: Record<string, any> = {
    verifiedOverview: {
      totalSpending: summary.totalSpendingFormatted,
      confirmedReceiptsCount: summary.confirmedReceiptsCount,
      averageTransactionValue: summary.averageTransactionValueFormatted,
      dateRange: summary.earliestDate && summary.latestDate ? `${summary.earliestDate} to ${summary.latestDate}` : 'Recent',
      currency: 'INR (₹)'
    }
  };

  // If asking about categories or spending breakdown
  if (
    query.includes('category') ||
    query.includes('spend') ||
    query.includes('cost') ||
    query.includes('expense') ||
    query.includes('most') ||
    query.includes('highest') ||
    query.includes('frequent')
  ) {
    baseContext.categoryBreakdown = summary.categoryBreakdown.slice(0, 6);
    baseContext.topSuppliersOrMerchants = summary.topMerchants.slice(0, 5);
  }

  // If asking about budgets
  if (query.includes('budget') || query.includes('limit') || query.includes('cap') || query.includes('target')) {
    baseContext.budgetStatus = summary.budgetOverview;
  }

  // If asking about stock, inventory, reorder
  if (
    query.includes('stock') ||
    query.includes('inventory') ||
    query.includes('reorder') ||
    query.includes('item') ||
    query.includes('product')
  ) {
    baseContext.inventoryAlerts = summary.inventoryAlerts;
  }

  // If asking about transactions, history, receipts, or recent purchases
  if (
    query.includes('recent') ||
    query.includes('transaction') ||
    query.includes('receipt') ||
    query.includes('purchase') ||
    query.includes('history') ||
    query.includes('yesterday') ||
    query.includes('today') ||
    query.includes('week') ||
    query.includes('month')
  ) {
    baseContext.recentTransactions = summary.recentTransactions.slice(0, 8);
  }

  // If asking about suppliers
  if (query.includes('supplier') || query.includes('vendor') || query.includes('wholesale')) {
    baseContext.supplierHighlights = summary.supplierHighlights;
  }

  return baseContext;
}
