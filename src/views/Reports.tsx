import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { useAuthStore } from '../authStore';
import { ReportFilters, ReportType, generateReportData } from '../lib/reports';
import { exportReceiptsToAccountingCSV, exportReceiptsToAccountingPDF, AccountingFormat } from '../lib/accountingExport';
import { formatCurrency } from '../lib/utils';
import { 
  FileText, Download, FileSpreadsheet, File, FileCode, Filter, Search, Calendar, ChevronDown, X, ShieldCheck, Check
} from 'lucide-react';
import { cn } from '../lib/utils';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const REPORT_TYPES: { id: ReportType; label: string; desc: string }[] = [
  { id: 'purchase_history', label: 'Purchase History', desc: 'Itemized list of all confirmed purchases.' },
  { id: 'expense_summary', label: 'Expense Summary', desc: 'Total spending categorized by product groups.' },
  { id: 'supplier_purchases', label: 'Supplier Purchases', desc: 'Spending and purchase counts by supplier.' },
  { id: 'price_intelligence', label: 'Price Intelligence', desc: 'Price changes across comparable purchases.' },
  { id: 'budget_performance', label: 'Budget Performance', desc: 'Actual spending vs defined budget limits.' },
  { id: 'inventory_purchases', label: 'Inventory Purchases', desc: 'Total quantities purchased vs estimated stock.' },
];

export default function Reports() {
  const { receipts, suppliers, budgets, inventoryAdjustments, inventorySettings } = useStore();
  
  const [filters, setFilters] = useState<ReportFilters>({
    type: 'purchase_history',
    startDate: '',
    endDate: '',
    category: '',
    supplierId: '',
    merchant: '',
    product: ''
  });

  const [isExporting, setIsExporting] = useState(false);
  const [showAccountingModal, setShowAccountingModal] = useState(false);
  const [accountingFeedback, setAccountingFeedback] = useState<string | null>(null);
  const user = useAuthStore(state => state.user);

  const reportData = useMemo(() => 
    generateReportData(filters, receipts, suppliers, budgets, inventoryAdjustments, inventorySettings), 
    [filters, receipts, suppliers, budgets, inventoryAdjustments, inventorySettings]
  );

  const handleExportCSV = () => {
    if (reportData.data.length === 0) return;
    setIsExporting(true);
    try {
      const headers = reportData.columns.join(',');
      const rows = reportData.data.map(row => 
        reportData.columns.map(col => {
          let val = row[col];
          if (val === null || val === undefined) val = '';
          // Escape quotes and wrap in quotes if contains comma
          const strVal = String(val).replace(/"/g, '""');
          // Prevent spreadsheet formula injection
          if (strVal.match(/^[=+\-@]/)) {
            return `"'${strVal}"`;
          }
          if (strVal.includes(',') || strVal.includes('"') || strVal.includes('\n')) {
            return `"${strVal}"`;
          }
          return strVal;
        }).join(',')
      ).join('\n');

      const csv = `${headers}\n${rows}`;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `RIN_Report_${filters.type}_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    if (reportData.data.length === 0) return;
    setIsExporting(true);
    try {
      const wb = XLSX.utils.book_new();
      
      // Summary Sheet
      const summaryData = [
        ['BizPulse - Report'],
        ['Report Type', REPORT_TYPES.find(r => r.id === filters.type)?.label || ''],
        ['Generated On', new Date().toLocaleString()],
        [],
        ['Filters Applied'],
        ['Start Date', filters.startDate || 'All Time'],
        ['End Date', filters.endDate || 'All Time'],
        ['Supplier', filters.supplierId ? suppliers.find(s => s.id === filters.supplierId)?.name || 'Unknown' : 'All'],
        ['Category', filters.category || 'All'],
        [],
        ['Summary Metrics'],
        ...Object.entries(reportData.summary).map(([k, v]) => [k, String(v)])
      ];
      
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryData);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary');

      // Data Sheet
      const wsData = XLSX.utils.json_to_sheet(reportData.data, { header: reportData.columns });
      XLSX.utils.book_append_sheet(wb, wsData, 'Data');

      XLSX.writeFile(wb, `RIN_Report_${filters.type}_${new Date().toISOString().split('T')[0]}.xlsx`);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = () => {
    if (reportData.data.length === 0) return;
    setIsExporting(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      
      doc.setFontSize(16);
      doc.text('BizPulse', 14, 15);
      
      doc.setFontSize(12);
      const title = REPORT_TYPES.find(r => r.id === filters.type)?.label || 'Business Report';
      doc.text(title, 14, 23);
      
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 30);
      
      let startY = 40;
      
      // Summary Metrics
      doc.setFontSize(11);
      doc.setTextColor(0);
      doc.text('Summary Metrics:', 14, startY);
      startY += 6;
      doc.setFontSize(10);
      doc.setTextColor(80);
      Object.entries(reportData.summary).forEach(([k, v]) => {
        doc.text(`${k}: ${v}`, 14, startY);
        startY += 5;
      });
      
      startY += 5;

      const body = reportData.data.map(row => 
        reportData.columns.map(col => {
          const val = row[col];
          if (typeof val === 'number') {
            // Check if it should be currency. A bit hacky but works for UI
            if (col.toLowerCase().includes('price') || col.toLowerCase().includes('total') || col.toLowerCase().includes('amount') || col.toLowerCase().includes('spent') || col.toLowerCase().includes('difference')) {
              return formatCurrency(val);
            }
            return val.toString();
          }
          return val ? val.toString() : '-';
        })
      );

      autoTable(doc, {
        head: [reportData.columns],
        body: body,
        startY: startY,
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: { fillColor: [11, 46, 51], textColor: [255, 255, 255] },
        alternateRowStyles: { fillColor: [244, 250, 249] },
        didDrawPage: function (data) {
          // Footer with page number
          const str = `Page ${(doc.internal as any).getCurrentPageInfo().pageNumber}`;
          doc.setFontSize(8);
          doc.setTextColor(150);
          const pageSize = doc.internal.pageSize;
          const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
          doc.text(str, data.settings.margin.left, pageHeight - 10);
        }
      });

      doc.save(`RIN_Report_${filters.type}_${new Date().toISOString().split('T')[0]}.pdf`);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="min-h-full bg-app-bg pb-8 md:pb-10 flex flex-col md:flex-row">
      {/* Sidebar / Configuration */}
      <div className="w-full md:w-80 lg:w-96 bg-white dark:bg-gray-800 border-r border-teal-100 dark:border-gray-700 flex flex-col shadow-sm z-10 shrink-0">
        <div className="bg-[#0B2E33] text-white p-6 md:rounded-br-[40px] shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white dark:bg-gray-800 opacity-5 blur-3xl pointer-events-none"></div>
          <div className="relative z-10">
            <h1 className="text-2xl font-bold mb-2 flex items-center">
              <FileText className="w-6 h-6 mr-2" />
              Business Reports
            </h1>
            <p className="text-[#02C39A] text-sm font-medium">Export organized records.</p>
          </div>
        </div>

        <div className="p-5 space-y-6">
          
          <div>
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Report Type</label>
            <div className="space-y-2">
              {REPORT_TYPES.map(type => (
                <button
                  key={type.id}
                  onClick={() => setFilters({ ...filters, type: type.id })}
                  className={cn(
                    "w-full text-left p-3 rounded-xl border transition-all flex flex-col",
                    filters.type === type.id 
                      ? "bg-teal-50 dark:bg-[#028090]/20 border-[#028090] shadow-sm ring-1 ring-[#028090]" 
                      : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 hover:border-teal-200"
                  )}
                >
                  <span className={cn("text-sm font-bold", filters.type === type.id ? "text-[#0B2E33] dark:text-gray-100" : "text-gray-700 dark:text-gray-300")}>
                    {type.label}
                  </span>
                  <span className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{type.desc}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 flex items-center">
              <Filter className="w-4 h-4 mr-1" /> Filters
            </label>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Start Date</label>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={e => setFilters({ ...filters, startDate: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#02C39A] outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">End Date</label>
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={e => setFilters({ ...filters, endDate: e.target.value })}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#02C39A] outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Supplier</label>
              <select
                value={filters.supplierId}
                onChange={e => setFilters({ ...filters, supplierId: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#02C39A] outline-none"
              >
                <option value="">All Suppliers</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Category</label>
              <input
                type="text"
                placeholder="e.g. Groceries"
                value={filters.category}
                onChange={e => setFilters({ ...filters, category: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#02C39A] outline-none"
              />
            </div>
            
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Product Search</label>
              <input
                type="text"
                placeholder="Search products..."
                value={filters.product}
                onChange={e => setFilters({ ...filters, product: e.target.value })}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#02C39A] outline-none"
              />
            </div>

          </div>
        </div>
      </div>

      {/* Preview & Export */}
      <div className="flex-1 p-4 md:p-6 lg:p-8 flex flex-col">
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
          <div>
            <h2 className="text-xl font-bold text-[#0B2E33] dark:text-gray-100">Report Preview</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {REPORT_TYPES.find(r => r.id === filters.type)?.label} 
              {reportData.data.length > 0 ? ` • ${reportData.data.length} records` : ''}
            </p>
          </div>
          
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            <button
              onClick={handleExportCSV}
              disabled={reportData.data.length === 0 || isExporting}
              className="flex-1 sm:flex-none flex items-center justify-center px-3.5 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:bg-gray-900 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
            >
              <FileCode className="w-3.5 h-3.5 mr-1.5" />
              CSV
            </button>
            <button
              onClick={handleExportExcel}
              disabled={reportData.data.length === 0 || isExporting}
              className="flex-1 sm:flex-none flex items-center justify-center px-3.5 py-2 bg-[#028090] text-white rounded-xl text-xs font-semibold hover:bg-[#026c7a] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-1.5" />
              Excel
            </button>
            <button
              onClick={handleExportPDF}
              disabled={reportData.data.length === 0 || isExporting}
              className="flex-1 sm:flex-none flex items-center justify-center px-3.5 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
            >
              <File className="w-3.5 h-3.5 mr-1.5" />
              PDF
            </button>
            <button
              onClick={() => setShowAccountingModal(true)}
              disabled={receipts.length === 0}
              className="flex-1 sm:flex-none flex items-center justify-center px-3.5 py-2 bg-[#0B2E33] text-white rounded-xl text-xs font-semibold hover:bg-[#028090] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition-colors"
              title="Accounting software compatibility: QuickBooks, Tally, Universal CSV & PDF"
            >
              <Download className="w-3.5 h-3.5 mr-1.5 text-[#02C39A]" />
              Accounting Export
            </button>
          </div>
        </div>

        {/* Summary Metric Cards */}
        {Object.keys(reportData.summary).length > 0 && reportData.data.length > 0 && (
          <div className="flex space-x-4 mb-6 overflow-x-auto pb-2 scrollbar-hide">
            {Object.entries(reportData.summary).map(([key, val]) => (
              <div key={key} className="bg-white dark:bg-gray-800 px-5 py-3 rounded-2xl shadow-sm border border-teal-50 dark:border-gray-700 shrink-0 min-w-[150px]">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{key}</p>
                <p className="text-lg font-bold text-[#0B2E33] dark:text-gray-100">{val}</p>
              </div>
            ))}
          </div>
        )}

        {/* Data Table */}
        <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-sm border border-teal-50 dark:border-gray-700 overflow-hidden flex flex-col">
          {reportData.data.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 bg-teal-50 dark:bg-[#028090]/20 rounded-full flex items-center justify-center mb-4">
                <Search className="w-8 h-8 text-[#028090]" />
              </div>
              <h3 className="text-lg font-bold text-[#0B2E33] dark:text-gray-100 mb-2">No records found for this report.</h3>
              <p className="text-sm text-[#5C7A7D] dark:text-gray-400 max-w-sm">
                Try changing your date range or filters, or confirm a receipt to add data.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900/80 sticky top-0 z-10 backdrop-blur-sm">
                  <tr>
                    {reportData.columns.map((col, i) => (
                      <th key={i} className="px-5 py-3 font-semibold whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {reportData.data.map((row, i) => (
                    <tr key={i} className="hover:bg-gray-50 dark:bg-gray-900/50 transition-colors">
                      {reportData.columns.map((col, j) => {
                        const val = row[col];
                        const isNumber = typeof val === 'number';
                        const isCurrency = isNumber && (col.toLowerCase().includes('price') || col.toLowerCase().includes('total') || col.toLowerCase().includes('amount') || col.toLowerCase().includes('spent') || col.toLowerCase().includes('difference'));
                        
                        return (
                          <td key={j} className={cn(
                            "px-5 py-3 text-gray-700 dark:text-gray-300 whitespace-nowrap",
                            isNumber && !isCurrency ? "font-medium" : "",
                            isCurrency ? "font-semibold text-[#0B2E33] dark:text-gray-100" : ""
                          )}>
                            {isCurrency ? formatCurrency(val as number) : val}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        {reportData.data.length > 0 && (
          <p className="text-center text-[10px] text-gray-400 mt-4">
            Report preview limited to actual confirmed ledger data.
          </p>
        )}
      </div>

      {/* Accounting Export Modal */}
      {showAccountingModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-teal-50 dark:border-gray-700 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            <div className="bg-[#0B2E33] text-white p-5 flex justify-between items-center shrink-0">
              <div className="flex items-center space-x-3">
                <div className="bg-[#028090] p-2 rounded-xl text-white">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-medium">Export for Accounting Software</h3>
                  <p className="text-teal-100/70 text-xs">Formatted for QuickBooks, Tally Prime, Xero & ERPs</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAccountingModal(false)}
                className="p-1 rounded-full text-teal-100/80 hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              {accountingFeedback && (
                <div className="bg-teal-50 dark:bg-teal-900/30 border border-teal-200 dark:border-teal-700/50 rounded-2xl p-3.5 text-sm text-[#028090] dark:text-[#02C39A] flex items-center space-x-2">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span className="font-medium">{accountingFeedback}</span>
                </div>
              )}

              <p className="text-xs text-[#5C7A7D] dark:text-gray-400">
                Exports all <strong>{receipts.length} verified receipts</strong> with double-entry debits, vendor ledger names, and tax categorization.
              </p>

              {/* 1. Universal Standard */}
              <div className="p-4 rounded-2xl border border-teal-100/70 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-xs transition-shadow">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-[#0B2E33] dark:text-gray-100">Universal Accounting CSV</span>
                  <span className="text-[10px] bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 font-medium px-2 py-0.5 rounded-full">Standard</span>
                </div>
                <p className="text-xs text-[#5C7A7D] dark:text-gray-400 mb-3">
                  Debit voucher format with Voucher Ref, Ledger Account, Quantity, Rate, and Net Amount.
                </p>
                <button
                  onClick={() => {
                    exportReceiptsToAccountingCSV(receipts, suppliers, 'standard', user?.businessProfile);
                    setAccountingFeedback('Standard Accounting CSV exported successfully!');
                    setTimeout(() => setAccountingFeedback(null), 3000);
                  }}
                  className="w-full bg-[#028090] hover:bg-[#00A896] text-white py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Universal CSV</span>
                </button>
              </div>

              {/* 2. QuickBooks */}
              <div className="p-4 rounded-2xl border border-teal-100/70 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-xs transition-shadow">
                <span className="text-sm font-semibold text-[#0B2E33] dark:text-gray-100 block mb-1.5">QuickBooks Online / Desktop CSV</span>
                <p className="text-xs text-[#5C7A7D] dark:text-gray-400 mb-3">
                  Formatted specifically for QuickBooks batch expense imports with Transaction Types and Expense Accounts.
                </p>
                <button
                  onClick={() => {
                    exportReceiptsToAccountingCSV(receipts, suppliers, 'quickbooks', user?.businessProfile);
                    setAccountingFeedback('QuickBooks CSV exported successfully!');
                    setTimeout(() => setAccountingFeedback(null), 3000);
                  }}
                  className="w-full bg-[#F4FAF9] dark:bg-gray-900 hover:bg-teal-50 dark:hover:bg-gray-700 text-[#028090] dark:text-[#02C39A] border border-teal-200 dark:border-gray-600 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download QuickBooks CSV</span>
                </button>
              </div>

              {/* 3. Tally */}
              <div className="p-4 rounded-2xl border border-teal-100/70 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-xs transition-shadow">
                <span className="text-sm font-semibold text-[#0B2E33] dark:text-gray-100 block mb-1.5">Tally Prime Compatible CSV</span>
                <p className="text-xs text-[#5C7A7D] dark:text-gray-400 mb-3">
                  Matches Tally Purchase Register format with Voucher Date (DD-MM-YYYY), Party Ledger, and Stock details.
                </p>
                <button
                  onClick={() => {
                    exportReceiptsToAccountingCSV(receipts, suppliers, 'tally', user?.businessProfile);
                    setAccountingFeedback('Tally Prime CSV exported successfully!');
                    setTimeout(() => setAccountingFeedback(null), 3000);
                  }}
                  className="w-full bg-[#F4FAF9] dark:bg-gray-900 hover:bg-teal-50 dark:hover:bg-gray-700 text-[#028090] dark:text-[#02C39A] border border-teal-200 dark:border-gray-600 py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-center space-x-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Tally CSV</span>
                </button>
              </div>

              {/* 4. Audit-Ready Accounting PDF */}
              <div className="p-4 rounded-2xl border border-teal-100/70 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-xs transition-shadow">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold text-[#0B2E33] dark:text-gray-100">Audit-Ready Accounting PDF</span>
                  <span className="text-[10px] bg-red-100 dark:bg-red-900/60 text-red-700 dark:text-red-300 font-medium px-2 py-0.5 rounded-full">CA / Audit</span>
                </div>
                <p className="text-xs text-[#5C7A7D] dark:text-gray-400 mb-3">
                  Official expense register with business profile, tax registration, page numbers, and sign-off block.
                </p>
                <button
                  onClick={() => {
                    exportReceiptsToAccountingPDF(receipts, suppliers, user?.businessProfile, `Business Reports Export (${receipts.length} records)`);
                    setAccountingFeedback('Accounting PDF Register downloaded!');
                    setTimeout(() => setAccountingFeedback(null), 3000);
                  }}
                  className="w-full bg-[#0B2E33] hover:bg-[#028090] text-white py-2 rounded-xl text-xs font-medium transition-colors flex items-center justify-center space-x-1.5 shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Official PDF Register</span>
                </button>
              </div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 p-4 border-t border-teal-50 dark:border-gray-700 flex justify-end shrink-0">
              <button
                onClick={() => setShowAccountingModal(false)}
                className="px-4 py-2 bg-white dark:bg-gray-800 border border-teal-100 dark:border-gray-700 rounded-xl text-xs font-medium text-[#5C7A7D] dark:text-gray-400 hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
