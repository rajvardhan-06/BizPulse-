import { Receipt, Supplier, isConfirmedReceipt } from '../store';
import { normalizeProductName } from './intelligence';

export interface SupplierPurchase {
  receiptId: string;
  supplierId: string;
  merchantName: string;
  productName: string;
  normalizedProductName: string;
  qty: number;
  unit: string | null;
  unitPrice: number;
  totalPrice: number;
  purchaseDate: string | null;
  currency: string;
}

export interface SupplierAnalysis {
  supplier: Supplier;
  totalSpending: number;
  purchaseCount: number;
  firstPurchaseDate: string | null;
  lastPurchaseDate: string | null;
  productsSupplied: string[];
  purchases: SupplierPurchase[];
}

export function calculateSupplierIntelligence(
  receipts: Receipt[],
  suppliers: Supplier[]
): {
  analyses: SupplierAnalysis[];
  unlinkedReceiptsCount: number;
  totalTrackedSpending: number;
} {
  const confirmedReceipts = receipts.filter(isConfirmedReceipt);
  const supplierMap = new Map<string, SupplierAnalysis>();

  for (const supplier of suppliers) {
    supplierMap.set(supplier.id, {
      supplier,
      totalSpending: 0,
      purchaseCount: 0,
      firstPurchaseDate: null,
      lastPurchaseDate: null,
      productsSupplied: [],
      purchases: []
    });
  }

  let unlinkedReceiptsCount = 0;
  let totalTrackedSpending = 0;

  for (const receipt of confirmedReceipts) {
    if (!receipt.supplierId || !supplierMap.has(receipt.supplierId)) {
      unlinkedReceiptsCount++;
      continue;
    }

    const analysis = supplierMap.get(receipt.supplierId)!;
    analysis.purchaseCount++;

    const receiptDate = receipt.date;
    if (receiptDate) {
      if (!analysis.firstPurchaseDate || new Date(receiptDate) < new Date(analysis.firstPurchaseDate)) {
        analysis.firstPurchaseDate = receiptDate;
      }
      if (!analysis.lastPurchaseDate || new Date(receiptDate) > new Date(analysis.lastPurchaseDate)) {
        analysis.lastPurchaseDate = receiptDate;
      }
    }

    const uniqueProducts = new Set(analysis.productsSupplied);

    for (const item of receipt.items) {
      if (!item.name || item.unit_price == null || item.qty == null) continue;

      const totalPrice = item.qty * item.unit_price;
      analysis.totalSpending += totalPrice;
      totalTrackedSpending += totalPrice;

      const normalizedName = normalizeProductName(item.name);
      uniqueProducts.add(normalizedName);

      analysis.purchases.push({
        receiptId: receipt.id,
        supplierId: receipt.supplierId,
        merchantName: receipt.merchant,
        productName: item.name,
        normalizedProductName: normalizedName,
        qty: item.qty,
        unit: item.unit || null,
        unitPrice: item.unit_price,
        totalPrice,
        purchaseDate: receipt.date || null,
        currency: receipt.currency || 'INR'
      });
    }

    analysis.productsSupplied = Array.from(uniqueProducts);
  }

  return {
    analyses: Array.from(supplierMap.values()).sort((a, b) => b.totalSpending - a.totalSpending),
    unlinkedReceiptsCount,
    totalTrackedSpending
  };
}
