import { Receipt, InventoryAdjustment, InventorySettings, isConfirmedReceipt } from '../store';

export interface InventoryProduct {
  name: string;
  normalizedName: string;
  category: string;
  unit: string | null;
  purchasedQuantity: number;
  estimatedStock: number;
  reorderThreshold?: number;
  lastPurchaseDate?: string;
  lastPurchasePrice?: number;
  averagePrice: number;
  merchants: string[];
  adjustments: InventoryAdjustment[];
}

export function normalizeProductName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, ' ');
}

export function calculateInventory(
  receipts: Receipt[],
  adjustments: InventoryAdjustment[],
  settings: Record<string, InventorySettings>
): InventoryProduct[] {
  const confirmedReceipts = receipts.filter(isConfirmedReceipt);
  const productsMap = new Map<string, InventoryProduct>();

  // Process purchases
  for (const receipt of confirmedReceipts) {
    for (const item of receipt.items) {
      if (!item.name || item.qty == null || item.qty <= 0) continue;

      const normalizedName = normalizeProductName(item.name);
      const existing = productsMap.get(normalizedName);

      if (existing) {
        existing.purchasedQuantity += item.qty;
        existing.estimatedStock += item.qty;
        // Update to newer details if receipt date is newer or existing has no date
        const isNewer = receipt.date && (!existing.lastPurchaseDate || new Date(receipt.date) >= new Date(existing.lastPurchaseDate));
        if (isNewer || (!existing.lastPurchaseDate && receipt.date)) {
          existing.name = item.name;
          existing.category = item.category || existing.category;
          existing.unit = item.unit || existing.unit;
          existing.lastPurchaseDate = receipt.date || existing.lastPurchaseDate;
          existing.lastPurchasePrice = item.unit_price;
        }
        
        if (existing.purchasedQuantity > 0 && item.unit_price != null) {
          const prevTotal = existing.averagePrice * (existing.purchasedQuantity - item.qty);
          const currentTotal = item.unit_price * item.qty;
          existing.averagePrice = (prevTotal + currentTotal) / existing.purchasedQuantity;
        }
          
        if (receipt.merchant && !existing.merchants.includes(receipt.merchant)) {
          existing.merchants.push(receipt.merchant);
        }
      } else {
        productsMap.set(normalizedName, {
          name: item.name,
          normalizedName,
          category: item.category || 'Uncategorized',
          unit: item.unit || null,
          purchasedQuantity: item.qty,
          estimatedStock: item.qty,
          lastPurchaseDate: receipt.date || undefined,
          lastPurchasePrice: item.unit_price,
          averagePrice: item.unit_price || 0,
          merchants: receipt.merchant ? [receipt.merchant] : [],
          adjustments: [],
          reorderThreshold: settings[normalizedName]?.reorderThreshold,
        });
      }
    }
  }

  // Sort adjustments chronologically (though map application order doesn't matter for pure add/remove, it matters for 'set')
  const sortedAdjustments = [...adjustments].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Process manual adjustments
  for (const adj of sortedAdjustments) {
    const existing = productsMap.get(adj.normalizedName);
    if (!existing) {
      // If adjustment exists for a product with no purchases, we skip or add it. Let's add it.
      productsMap.set(adj.normalizedName, {
        name: adj.normalizedName,
        normalizedName: adj.normalizedName,
        category: 'Uncategorized',
        unit: null,
        purchasedQuantity: 0,
        estimatedStock: adj.isSetOperation ? adj.amount : adj.amount,
        averagePrice: 0,
        merchants: [],
        adjustments: [adj],
        reorderThreshold: settings[adj.normalizedName]?.reorderThreshold,
      });
      continue;
    }

    if (adj.isSetOperation) {
      existing.estimatedStock = adj.amount;
    } else {
      existing.estimatedStock += adj.amount;
    }
    existing.adjustments.push(adj);
  }

  return Array.from(productsMap.values());
}
