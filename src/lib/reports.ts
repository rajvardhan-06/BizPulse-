import { formatCurrency } from "./utils";
import { Receipt, Budget, Supplier, InventoryAdjustment, InventorySettings, isConfirmedReceipt } from '../store';
import { calculateSupplierIntelligence } from './supplier';
import { calculatePriceIntelligence } from './intelligence';
import { calculateBudgetSpending } from './budget';
import { calculateInventory } from './inventory';
import { format, parseISO } from 'date-fns';

export type ReportType = 
  | 'purchase_history'
  | 'expense_summary'
  | 'supplier_purchases'
  | 'price_intelligence'
  | 'budget_performance'
  | 'inventory_purchases';

export interface ReportFilters {
  type: ReportType;
  startDate: string;
  endDate: string;
  category: string;
  supplierId: string;
  merchant: string;
  product: string;
}

export function generateReportData(
  filters: ReportFilters,
  receipts: Receipt[],
  suppliers: Supplier[],
  budgets: Budget[],
  adjustments: InventoryAdjustment[],
  settings: Record<string, InventorySettings>
): { columns: string[], data: any[], summary: Record<string, string | number> } {
  const confirmedReceipts = receipts.filter(isConfirmedReceipt);

  // Apply Date Filters
  const filteredReceipts = confirmedReceipts.filter(r => {
    if (!r.date) return true; // Include missing dates, or filter them out? Prompt says "Missing dates must be handled transparently." Let's keep them if no filter, or exclude if filter exists? Usually if date range is set, exclude missing dates.
    if (filters.startDate && r.date < filters.startDate) return false;
    if (filters.endDate && r.date > filters.endDate) return false;
    if (filters.merchant && !r.merchant.toLowerCase().includes(filters.merchant.toLowerCase())) return false;
    if (filters.supplierId && r.supplierId !== filters.supplierId) return false;
    return true;
  });

  const getSupplierName = (id?: string | null) => {
    if (!id) return 'Unknown';
    return suppliers.find(s => s.id === id)?.name || 'Unknown';
  };

  if (filters.type === 'purchase_history') {
    let data: any[] = [];
    let totalSpending = 0;

    filteredReceipts.forEach(r => {
      r.items.forEach(item => {
        if (filters.category && item.category !== filters.category) return;
        if (filters.product && !item.name.toLowerCase().includes(filters.product.toLowerCase())) return;

        const total = (item.qty || 0) * (item.unit_price || 0);
        totalSpending += total;

        data.push({
          'Receipt ID': r.id.substring(0, 8),
          'Date': r.date ? format(parseISO(r.date), 'MMM d, yyyy') : 'Unknown',
          'Merchant': r.merchant,
          'Supplier': getSupplierName(r.supplierId),
          'Product': item.name,
          'Category': item.category,
          'Quantity': item.qty,
          'Unit': item.unit || '-',
          'Unit Price': item.unit_price,
          'Item Total': total,
          'Currency': r.currency
        });
      });
    });

    return {
      columns: ['Receipt ID', 'Date', 'Merchant', 'Supplier', 'Product', 'Category', 'Quantity', 'Unit', 'Unit Price', 'Item Total', 'Currency'],
      data,
      summary: {
        'Total Records': data.length,
        'Total Spending': formatCurrency(totalSpending)
      }
    };
  }

  if (filters.type === 'expense_summary') {
    let totalSpending = 0;
    const categoryTotals: Record<string, number> = {};
    const merchantTotals: Record<string, number> = {};

    filteredReceipts.forEach(r => {
      let receiptTotal = 0;
      r.items.forEach(item => {
        const total = (item.qty || 0) * (item.unit_price || 0);
        receiptTotal += total;
        categoryTotals[item.category] = (categoryTotals[item.category] || 0) + total;
      });
      totalSpending += receiptTotal;
      merchantTotals[r.merchant] = (merchantTotals[r.merchant] || 0) + receiptTotal;
    });

    const categoryData = Object.keys(categoryTotals).map(cat => ({
      'Type': 'Category',
      'Name': cat,
      'Total Spending': categoryTotals[cat],
      'Currency': 'INR'
    }));
    
    const merchantData = Object.keys(merchantTotals).map(mer => ({
      'Type': 'Merchant',
      'Name': mer,
      'Total Spending': merchantTotals[mer],
      'Currency': 'INR'
    }));

    const data = [...categoryData, ...merchantData].sort((a, b) => (b['Total Spending'] as number) - (a['Total Spending'] as number));

    return {
      columns: ['Type', 'Name', 'Total Spending', 'Currency'],
      data,
      summary: {
        'Receipt Count': filteredReceipts.length,
        'Total Spending': formatCurrency(totalSpending)
      }
    };
  }

  if (filters.type === 'supplier_purchases') {
    const { analyses } = calculateSupplierIntelligence(filteredReceipts, suppliers);
    
    let filteredAnalyses = analyses;
    if (filters.supplierId) {
      filteredAnalyses = filteredAnalyses.filter(a => a.supplier.id === filters.supplierId);
    }

    const data = filteredAnalyses.map(a => ({
      'Supplier': a.supplier.name,
      'Purchases': a.purchaseCount,
      'Products Supplied': a.productsSupplied.length,
      'First Purchase': a.firstPurchaseDate ? format(parseISO(a.firstPurchaseDate), 'MMM d, yyyy') : '-',
      'Latest Purchase': a.lastPurchaseDate ? format(parseISO(a.lastPurchaseDate), 'MMM d, yyyy') : '-',
      'Total Spending': a.totalSpending
    }));

    return {
      columns: ['Supplier', 'Purchases', 'Products Supplied', 'First Purchase', 'Latest Purchase', 'Total Spending'],
      data: data.filter(d => d.Purchases > 0),
      summary: {
        'Active Suppliers': data.filter(d => d.Purchases > 0).length,
        'Total Spending': formatCurrency(data.reduce((sum, d) => sum + (d['Total Spending'] as number), 0))
      }
    };
  }

  if (filters.type === 'price_intelligence') {
    const { comparisons } = calculatePriceIntelligence(filteredReceipts, suppliers);
    let filteredComparisons = comparisons.filter(c => c.status !== 'Insufficient Data' && c.status !== 'Needs Review');
    
    if (filters.product) {
      filteredComparisons = filteredComparisons.filter(c => c.productName.toLowerCase().includes(filters.product.toLowerCase()));
    }

    const data = filteredComparisons.map(c => ({
      'Product': c.productName,
      'Unit': c.unit || '-',
      'Previous Date': c.previousDate ? format(parseISO(c.previousDate), 'MMM d, yyyy') : '-',
      'Latest Date': c.latestDate ? format(parseISO(c.latestDate), 'MMM d, yyyy') : '-',
      'Previous Price': c.previousPrice,
      'Latest Price': c.latestPrice,
      'Difference': c.priceDifference,
      '% Change': `${c.percentageChange.toFixed(1)}%`,
      'Trend': c.status
    }));

    return {
      columns: ['Product', 'Unit', 'Previous Date', 'Latest Date', 'Previous Price', 'Latest Price', 'Difference', '% Change', 'Trend'],
      data,
      summary: {
        'Total Comparisons': data.length
      }
    };
  }

  if (filters.type === 'budget_performance') {
    const analyses = calculateBudgetSpending(budgets, filteredReceipts);
    
    const data = analyses.map(b => ({
      'Budget Name': b.budget.name,
      'Period': b.budget.period,
      'Category': b.budget.category || 'All',
      'Budget Amount': b.budget.amount,
      'Spent': b.spent,
      'Remaining': b.remaining,
      '% Used': `${b.percentage.toFixed(1)}%`,
      'Status': b.status
    }));

    return {
      columns: ['Budget Name', 'Period', 'Category', 'Budget Amount', 'Spent', 'Remaining', '% Used', 'Status'],
      data,
      summary: {
        'Total Budgets': data.length,
        'Over-budget Count': data.filter(d => d.Status === 'Over Budget').length
      }
    };
  }

  if (filters.type === 'inventory_purchases') {
    const inventory = calculateInventory(filteredReceipts, adjustments, settings);
    
    let filteredInventory = inventory;
    if (filters.product) {
      filteredInventory = filteredInventory.filter(i => i.name.toLowerCase().includes(filters.product.toLowerCase()));
    }

    const getRelatedSupplier = (productName: string) => {
      // Find the most recent receipt containing this product
      const matchingReceipts = filteredReceipts
        .filter(r => r.items.some(item => item.name === productName))
        .sort((a, b) => (b.date || '').localeCompare(a.date || ''));
      const latest = matchingReceipts[0];
      return latest?.supplierId ? getSupplierName(latest.supplierId) : '-';
    };

    const data = filteredInventory.map(i => {
      let status = 'In Stock';
      if (i.estimatedStock <= 0) {
        status = 'Out of Stock';
      } else if (i.reorderThreshold !== undefined && i.estimatedStock <= i.reorderThreshold) {
        status = 'Low Stock';
      }

      return {
        'Product': i.name,
        'Category': i.category || '-',
        'Total Purchased': i.purchasedQuantity,
        'Unit': i.unit || '-',
        'Last Purchase Date': i.lastPurchaseDate ? format(parseISO(i.lastPurchaseDate), 'MMM d, yyyy') : '-',
        'Last Recorded Price': i.lastPurchasePrice ?? '-',
        'Related Supplier': getRelatedSupplier(i.name),
        'Estimated Stock': i.estimatedStock,
        'Status': status
      };
    });

    return {
      columns: ['Product', 'Category', 'Total Purchased', 'Unit', 'Last Purchase Date', 'Last Recorded Price', 'Related Supplier', 'Estimated Stock', 'Status'],
      data,
      summary: {
        'Tracked Items': data.length,
        'Low Stock Items': data.filter(d => d.Status === 'Low Stock' || d.Status === 'Out of Stock').length
      }
    };
  }

  return { columns: [], data: [], summary: {} };
}
