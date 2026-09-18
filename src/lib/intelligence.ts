import { Receipt, Supplier, isConfirmedReceipt } from '../store';

export interface PriceRecord {
  id: string;
  productName: string;
  normalizedName: string;
  originalItemName: string;
  category: string;
  qty: number;
  unit: string | null;
  unitPrice: number;
  totalPrice: number | null;
  merchant: string;
  supplier: string | null;
  receiptId: string;
  purchaseDate: string | null;
  currency: string;
  confirmed: boolean;
}

export interface PriceComparison {
  normalizedName: string;
  productName: string;
  category: string;
  unit: string | null;
  latestPrice: number;
  previousPrice: number;
  priceDifference: number;
  percentageChange: number;
  latestDate: string | null;
  previousDate: string | null;
  latestMerchant: string;
  previousMerchant: string;
  history: PriceRecord[];
  status: 'Increased' | 'Decreased' | 'Unchanged' | 'Needs Review' | 'Insufficient Data';
}

export function normalizeProductName(name: string): string {
  // Normalize capitalization, leading/trailing whitespace, repeated spaces, basic punctuation
  return name
    .toLowerCase()
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function calculatePriceIntelligence(
  receipts: Receipt[],
  suppliers: Supplier[] = []
): {
  records: PriceRecord[];
  comparisons: PriceComparison[];
} {
  const confirmedReceipts = receipts.filter(isConfirmedReceipt);
  const supplierMap = new Map(suppliers.map(s => [s.id, s.name]));
  const records: PriceRecord[] = [];

  for (const receipt of confirmedReceipts) {
    receipt.items.forEach((item, index) => {
      if (!item.name || item.unit_price == null || item.qty == null) return;
      
      const assignedSupplierName = receipt.supplierId ? (supplierMap.get(receipt.supplierId) || null) : null;

      records.push({
        id: `${receipt.id}-${index}`,
        productName: item.name,
        normalizedName: normalizeProductName(item.name),
        originalItemName: item.name,
        category: item.category || 'Uncategorized',
        qty: item.qty,
        unit: item.unit || null,
        unitPrice: item.unit_price,
        totalPrice: item.qty * item.unit_price,
        merchant: receipt.merchant || 'Unknown Merchant',
        supplier: assignedSupplierName,
        receiptId: receipt.id,
        purchaseDate: receipt.date || null,
        currency: receipt.currency || 'INR',
        confirmed: true
      });
    });
  }

  // Group records by normalizedName + unit
  const grouped = new Map<string, PriceRecord[]>();
  for (const record of records) {
    const key = `${record.normalizedName}::${record.unit || 'NO_UNIT'}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(record);
  }

  const comparisons: PriceComparison[] = [];

  for (const [, groupRecords] of Array.from(grouped.entries())) {
    // Sort by date descending. If missing date, fallback to captureTimestamp order from record id or position
    const sorted = [...groupRecords].sort((a, b) => {
      const timeA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
      const timeB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
      return timeB - timeA;
    });

    const latest = sorted[0];
    
    // Find the most recent record that has a different receipt
    let previous: PriceRecord | null = null;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].receiptId !== latest.receiptId) {
        previous = sorted[i];
        break;
      }
    }

    if (!previous) {
      comparisons.push({
        normalizedName: latest.normalizedName,
        productName: latest.productName,
        category: latest.category,
        unit: latest.unit,
        latestPrice: latest.unitPrice,
        previousPrice: 0,
        priceDifference: 0,
        percentageChange: 0,
        latestDate: latest.purchaseDate,
        previousDate: null,
        latestMerchant: latest.merchant,
        previousMerchant: 'N/A',
        history: sorted,
        status: 'Insufficient Data'
      });
      continue;
    }

    const priceDifference = latest.unitPrice - previous.unitPrice;
    let percentageChange = 0;
    if (previous.unitPrice > 0) {
      percentageChange = (priceDifference / previous.unitPrice) * 100;
    }

    let status: PriceComparison['status'] = 'Unchanged';
    if (priceDifference > 0) status = 'Increased';
    else if (priceDifference < 0) status = 'Decreased';

    comparisons.push({
      normalizedName: latest.normalizedName,
      productName: latest.productName,
      category: latest.category,
      unit: latest.unit,
      latestPrice: latest.unitPrice,
      previousPrice: previous.unitPrice,
      priceDifference: priceDifference,
      percentageChange: percentageChange,
      latestDate: latest.purchaseDate,
      previousDate: previous.purchaseDate,
      latestMerchant: latest.merchant,
      previousMerchant: previous.merchant,
      history: sorted,
      status: status
    });
  }

  return { records, comparisons };
}

