import { Receipt, Supplier, isConfirmedReceipt } from '../store';
import { format, parseISO } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export type AccountingFormat = 'standard' | 'quickbooks' | 'tally';

export interface BusinessProfileMeta {
  businessName?: string;
  gstNumber?: string;
  address?: string;
  cityState?: string;
  currency?: string;
  ownerName?: string;
}

/**
 * Escapes CSV values and prevents spreadsheet formula injection.
 */
function escapeCsvValue(val: any): string {
  if (val === null || val === undefined) return '""';
  let str = String(val).trim();
  // Prevent spreadsheet formula injection (=, +, -, @, tab, CR)
  if (/^[=+\-@\t\r]/.test(str)) {
    str = `'${str}`;
  }
  return `"${str.replace(/"/g, '""')}"`;
}

/**
 * Exports processed receipts into CSV formatted specifically for accounting software.
 */
export function exportReceiptsToAccountingCSV(
  receipts: Receipt[],
  suppliers: Supplier[],
  formatType: AccountingFormat = 'standard',
  profile?: BusinessProfileMeta
) {
  const confirmed = receipts.filter(isConfirmedReceipt);
  if (confirmed.length === 0) {
    throw new Error('No confirmed receipt records available to export.');
  }

  const getSupplierName = (id?: string | null) => {
    if (!id) return '';
    return suppliers.find(s => s.id === id)?.name || '';
  };

  let headers: string[] = [];
  let rows: string[][] = [];
  const filenameDate = format(new Date(), 'yyyy-MM-dd');
  let filename = `Accounting_Ledger_${filenameDate}.csv`;

  if (formatType === 'quickbooks') {
    filename = `QuickBooks_Expenses_${filenameDate}.csv`;
    headers = [
      'Date',
      'Transaction Type',
      'Ref Number',
      'Payee',
      'Expense Account',
      'Item Description',
      'Quantity',
      'Unit Price',
      'Amount',
      'Currency',
      'Memo'
    ];

    confirmed.forEach(r => {
      const dateStr = r.date ? format(parseISO(r.date), 'MM/dd/yyyy') : format(new Date(r.captureTimestamp || Date.now()), 'MM/dd/yyyy');
      const voucherNo = r.id.substring(0, 8).toUpperCase();
      const payee = r.merchant || 'Vendor';

      r.items.forEach(item => {
        const itemTotal = (item.qty || 1) * (item.unit_price || 0);
        rows.push([
          dateStr,
          'Expense',
          voucherNo,
          payee,
          item.category || 'General Expense',
          item.name || 'Unspecified Item',
          String(item.qty || 1),
          String(item.unit_price || 0),
          itemTotal.toFixed(2),
          r.currency || 'INR',
          `Scanned via BizPulse: ${voucherNo}`
        ]);
      });
    });
  } else if (formatType === 'tally') {
    filename = `Tally_Purchase_Register_${filenameDate}.csv`;
    headers = [
      'Vch Date',
      'Vch No',
      'Voucher Type',
      'Party A/c Name',
      'Purchase Ledger Account',
      'Stock Item Name',
      'Billed Qty',
      'Unit',
      'Rate',
      'Amount',
      'Narration'
    ];

    confirmed.forEach(r => {
      const dateStr = r.date ? format(parseISO(r.date), 'dd-MM-yyyy') : format(new Date(r.captureTimestamp || Date.now()), 'dd-MM-yyyy');
      const vchNo = `BP-${r.id.substring(0, 8).toUpperCase()}`;
      const party = r.merchant || 'Cash Purchase';

      r.items.forEach(item => {
        const itemTotal = (item.qty || 1) * (item.unit_price || 0);
        rows.push([
          dateStr,
          vchNo,
          'Purchase',
          party,
          `${item.category || 'Trading'} Account`,
          item.name || 'General Item',
          String(item.qty || 1),
          item.unit || 'Nos',
          String(item.unit_price || 0),
          itemTotal.toFixed(2),
          `Supplier: ${getSupplierName(r.supplierId) || party} | BizPulse Record`
        ]);
      });
    });
  } else {
    // Standard Universal Accounting CSV (Xero, Zoho Books, Wave, ERP)
    filename = `Accounting_Expense_Register_${filenameDate}.csv`;
    headers = [
      'Transaction Date',
      'Voucher / Receipt ID',
      'Vendor / Merchant',
      'Linked Supplier',
      'Account / Category',
      'Line Item Description',
      'Quantity',
      'Unit',
      'Unit Rate',
      'Line Debit Amount',
      'Receipt Total',
      'Currency',
      'Audit Status'
    ];

    confirmed.forEach(r => {
      const dateStr = r.date ? format(parseISO(r.date), 'yyyy-MM-dd') : format(new Date(r.captureTimestamp || Date.now()), 'yyyy-MM-dd');
      const voucherNo = r.id;
      const merchant = r.merchant || 'Vendor';
      const supplierName = getSupplierName(r.supplierId);

      r.items.forEach(item => {
        const itemTotal = (item.qty || 1) * (item.unit_price || 0);
        rows.push([
          dateStr,
          voucherNo,
          merchant,
          supplierName || '-',
          item.category || 'General Purchases',
          item.name || 'Item',
          String(item.qty || 1),
          item.unit || '-',
          Number(item.unit_price || 0).toFixed(2),
          itemTotal.toFixed(2),
          Number(r.total || 0).toFixed(2),
          r.currency || 'INR',
          'Processed & Verified'
        ]);
      });
    });
  }

  const csvContent = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map(row => row.map(escapeCsvValue).join(','))
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
}

/**
 * Generates an audit-ready Accounting Voucher & Expense Register in PDF format.
 */
export async function exportReceiptsToAccountingPDF(
  receipts: Receipt[],
  suppliers: Supplier[],
  profile?: BusinessProfileMeta,
  filterDescription: string = 'All Confirmed Vouchers'
) {
  const confirmed = receipts.filter(isConfirmedReceipt);
  if (confirmed.length === 0) {
    throw new Error('No confirmed receipt records available to export.');
  }

  const getSupplierName = (id?: string | null) => {
    if (!id) return '-';
    return suppliers.find(s => s.id === id)?.name || '-';
  };

  const businessName = profile?.businessName || 'Business Enterprise';
  const gstNo = profile?.gstNumber ? `GSTIN: ${profile.gstNumber}` : 'Unregistered / Retail';
  const address = profile?.address || '';
  const city = profile?.cityState || '';
  const currencySymbol = '₹';

  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  try {
    const fontBytesNormal = await fetch('https://fonts.gstatic.com/s/roboto/v30/KFOmCnqEu92Fr1Me5WZLCzYlKw.ttf').then(res => res.arrayBuffer());
    let binaryNormal = '';
    const bytesNormal = new Uint8Array(fontBytesNormal);
    for (let i = 0; i < bytesNormal.byteLength; i++) {
      binaryNormal += String.fromCharCode(bytesNormal[i]);
    }
    doc.addFileToVFS('Roboto-Regular.ttf', btoa(binaryNormal));
    doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');

    const fontBytesBold = await fetch('https://fonts.gstatic.com/s/roboto/v30/KFOlCnqEu92Fr1MmWUlfBBc4AMP6lQ.ttf').then(res => res.arrayBuffer());
    let binaryBold = '';
    const bytesBold = new Uint8Array(fontBytesBold);
    for (let i = 0; i < bytesBold.byteLength; i++) {
      binaryBold += String.fromCharCode(bytesBold[i]);
    }
    doc.addFileToVFS('Roboto-Bold.ttf', btoa(binaryBold));
    doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

    doc.setFont('Roboto');
  } catch (e) {
    console.warn('Failed to load Roboto font, fallback to standard font.', e);
    doc.setFont('Roboto', 'normal');
  }

  // Top Accent Stripe
  doc.setFillColor(11, 46, 51); // #0B2E33
  doc.rect(0, 0, pageWidth, 5, 'F');

  // Business Header Section
  doc.setFontSize(16);
  doc.setTextColor(11, 46, 51);
  doc.text(businessName, 14, 16);

  doc.setFont('Roboto', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(92, 122, 125);
  let subHeaderY = 21;
  if (address || city) {
    doc.text([address, city].filter(Boolean).join(', '), 14, subHeaderY);
    subHeaderY += 4.5;
  }
  doc.text(gstNo, 14, subHeaderY);

  // Document Title & Metadata on Right Side
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(2, 128, 144); // #028090
  doc.text('ACCOUNTING EXPENSE REGISTER', pageWidth - 14, 16, { align: 'right' });

  doc.setFont('Roboto', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 100, 100);
  doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy, HH:mm')}`, pageWidth - 14, 21, { align: 'right' });
  doc.text(`Scope: ${filterDescription}`, pageWidth - 14, 25.5, { align: 'right' });

  // Divider line
  doc.setDrawColor(220, 235, 235);
  doc.setLineWidth(0.5);
  doc.line(14, 30, pageWidth - 14, 30);

  // Calculate Totals & Category Summaries
  let grandTotal = 0;
  let totalLineItems = 0;
  const categoryTotals: Record<string, number> = {};

  confirmed.forEach(r => {
    r.items.forEach(item => {
      const lineTotal = (item.qty || 1) * (item.unit_price || 0);
      grandTotal += lineTotal;
      totalLineItems++;
      const cat = item.category || 'General';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + lineTotal;
    });
  });

  // Summary Metrics Banner
  const summaryBoxY = 34;
  doc.setFillColor(244, 250, 249); // #F4FAF9
  doc.roundedRect(14, summaryBoxY, pageWidth - 28, 16, 2, 2, 'F');
  doc.setDrawColor(200, 230, 230);
  doc.roundedRect(14, summaryBoxY, pageWidth - 28, 16, 2, 2, 'S');

  // Metric 1: Vouchers
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(92, 122, 125);
  doc.text('TOTAL VOUCHERS', 20, summaryBoxY + 5.5);
  doc.setFontSize(11);
  doc.setTextColor(11, 46, 51);
  doc.text(`${confirmed.length} Receipts (${totalLineItems} Items)`, 20, summaryBoxY + 12);

  // Metric 2: Gross Debit
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(92, 122, 125);
  doc.text('GROSS DEBIT VALUE', 95, summaryBoxY + 5.5);
  doc.setFontSize(11);
  doc.setTextColor(2, 128, 144);
  doc.text(`${currencySymbol} ${grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 95, summaryBoxY + 12);

  // Metric 3: Accounting Status
  doc.setFont('Roboto', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(92, 122, 125);
  doc.text('COMPLIANCE & AUDIT STATUS', 170, summaryBoxY + 5.5);
  doc.setFontSize(9);
  doc.setTextColor(2, 195, 154); // #02C39A
  doc.text('Verified OCR Receipts / Ready for Bookkeeping', 170, summaryBoxY + 11.5);

  // Table Body Rows
  const tableRows: any[][] = [];
  confirmed.forEach(r => {
    const vchDate = r.date ? format(parseISO(r.date), 'dd-MMM-yyyy') : '-';
    const vchNo = r.id.substring(0, 8).toUpperCase();
    const vendor = r.merchant || 'Vendor';
    const supp = getSupplierName(r.supplierId);

    r.items.forEach(item => {
      const lineTotal = (item.qty || 1) * (item.unit_price || 0);
      tableRows.push([
        vchDate,
        vchNo,
        vendor,
        supp !== '-' ? supp : vendor,
        item.category || 'General',
        item.name || '-',
        `${item.qty || 1} ${item.unit || ''}`.trim(),
        Number(item.unit_price || 0).toFixed(2),
        lineTotal.toFixed(2)
      ]);
    });
  });

  autoTable(doc, {
    head: [[
      'Date',
      'Voucher #',
      'Vendor / Merchant',
      'Supplier Account',
      'Expense Ledger',
      'Item Description',
      'Qty',
      `Rate (${currencySymbol})`,
      `Debit (${currencySymbol})`
    ]],
    body: tableRows,
    startY: 54,
    theme: 'grid',
    styles: { font: 'Roboto',
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.2
    },
    headStyles: {
      fillColor: [11, 46, 51],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'left'
    },
    alternateRowStyles: {
      fillColor: [250, 253, 252]
    },
    columnStyles: {
      0: { cellWidth: 24 },
      1: { cellWidth: 20 },
      2: { cellWidth: 34 },
      3: { cellWidth: 32 },
      4: { cellWidth: 28 },
      5: { cellWidth: 'auto' },
      6: { cellWidth: 16, halign: 'right' },
      7: { cellWidth: 22, halign: 'right' },
      8: { cellWidth: 26, halign: 'right', fontStyle: 'bold' }
    },
    didDrawPage: (data) => {
      // Footer
      const str = `Page ${doc.getNumberOfPages()} | BizPulse Accounting Intelligence`;
      doc.setFontSize(8);
      doc.setTextColor(140);
      const pageHeight = doc.internal.pageSize.getHeight();
      doc.text(str, 14, pageHeight - 8);
      doc.text('Authorised Signatory / Accountant Signature: _______________________', pageWidth - 14, pageHeight - 8, { align: 'right' });
    }
  });

  const filenameDate = format(new Date(), 'yyyy-MM-dd');
  doc.save(`Accounting_Register_${filenameDate}.pdf`);
}
