import React, { useState, useMemo } from 'react';
import { formatCurrency } from "../lib/utils";
import { useStore, Supplier } from '../store';
import { calculateSupplierIntelligence, SupplierAnalysis } from '../lib/supplier';
import { 
  Users, Plus, Store, Calendar, ExternalLink, 
  Search, Package, TrendingUp, X, MapPin, Phone, Mail
} from 'lucide-react';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';

export default function Suppliers() {
  const receipts = useStore(state => state.receipts);
  const suppliers = useStore(state => state.suppliers);
  const addSupplier = useStore(state => state.addSupplier);
  const updateSupplier = useStore(state => state.updateSupplier);
  const deleteSupplier = useStore(state => state.deleteSupplier);
  
  const { analyses, unlinkedReceiptsCount } = useMemo(() => 
    calculateSupplierIntelligence(receipts, suppliers), 
    [receipts, suppliers]
  );

  const [showModal, setShowModal] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [editId, setEditId] = useState<string | null>(null);

  const openAddModal = () => {
    setEditId(null);
    setName('');
    setPhone('');
    setEmail('');
    setAddress('');
    setNotes('');
    setShowModal(true);
  };

  const openEditModal = (s: Supplier) => {
    setEditId(s.id);
    setName(s.name);
    setPhone(s.phone || '');
    setEmail(s.email || '');
    setAddress(s.address || '');
    setNotes(s.notes || '');
    setShowModal(true);
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editId) {
      updateSupplier(editId, {
        name: name.trim(),
        normalizedName: name.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
      });
    } else {
      addSupplier({
        id: crypto.randomUUID(),
        name: name.trim(),
        normalizedName: name.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        email: email.trim() || undefined,
        address: address.trim() || undefined,
        notes: notes.trim() || undefined,
        createdAt: new Date().toISOString()
      });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Are you sure you want to delete this supplier? Associated receipts will not be deleted but will lose their supplier link.")) {
      deleteSupplier(id);
      if (selectedSupplierId === id) setSelectedSupplierId(null);
    }
  };

  const filteredAnalyses = analyses.filter(a => 
    a.supplier.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedAnalysis = analyses.find(a => a.supplier.id === selectedSupplierId);

  return (
    <div className="min-h-full bg-app-bg pb-8 md:pb-10 flex flex-col md:flex-row">
      
      {/* Main List */}
      <div className={cn("flex-1", selectedSupplierId ? "hidden md:block md:w-1/2 lg:w-1/3 border-r border-teal-100" : "")}>
        <div className="bg-[#0B2E33] text-white pt-12 pb-8 px-6 md:rounded-br-[40px] shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white dark:bg-gray-800 opacity-5 blur-3xl pointer-events-none"></div>
          <div className="relative z-10 flex justify-between items-end">
            <div>
              <h1 className="text-2xl font-bold mb-2">Suppliers</h1>
              <p className="text-[#02C39A] text-sm font-medium">Track your sourcing relationships.</p>
            </div>
            <button 
              onClick={openAddModal}
              className="bg-[#02C39A] hover:bg-[#02a885] text-[#0B2E33] dark:text-gray-100 p-3 rounded-full transition-colors shadow-lg"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="relative mb-6">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search suppliers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 border border-teal-50 dark:border-gray-700 shadow-sm rounded-2xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-[#02C39A] outline-none transition-all"
            />
          </div>

          {suppliers.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-8 text-center flex flex-col items-center border border-teal-50 dark:border-gray-700 shadow-sm mt-8">
              <div className="w-16 h-16 bg-teal-50 dark:bg-[#028090]/20 rounded-full flex items-center justify-center mb-4">
                <Store className="w-8 h-8 text-[#028090]" />
              </div>
              <h3 className="text-lg font-bold text-[#0B2E33] dark:text-gray-100 mb-2">Build your supplier network.</h3>
              <p className="text-sm text-[#5C7A7D] dark:text-gray-400 mb-6 max-w-[250px]">
                Confirm supplier details on your purchases to understand sourcing and price history.
              </p>
              <Link 
                to="/ledger" 
                className="bg-[#0B2E33] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#028090] transition-colors"
              >
                Review Ledger
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAnalyses.map(analysis => (
                <div 
                  key={analysis.supplier.id}
                  onClick={() => setSelectedSupplierId(analysis.supplier.id)}
                  className={cn(
                    "bg-white dark:bg-gray-800 p-4 rounded-2xl border cursor-pointer transition-all",
                    selectedSupplierId === analysis.supplier.id 
                      ? "border-[#02C39A] shadow-md ring-1 ring-[#02C39A]" 
                      : "border-teal-50 dark:border-gray-700 shadow-sm hover:border-teal-200"
                  )}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-[#0B2E33] dark:text-gray-100 truncate pr-2">{analysis.supplier.name}</h3>
                    <span className="text-[#028090] font-bold text-sm shrink-0">
                      {formatCurrency(analysis.totalSpending)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center">
                      <Store className="w-3 h-3 mr-1" />
                      {analysis.purchaseCount} {analysis.purchaseCount === 1 ? 'purchase' : 'purchases'}
                    </span>
                    <span className="flex items-center">
                      <Package className="w-3 h-3 mr-1" />
                      {analysis.productsSupplied.length} products
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details Pane */}
      {selectedSupplierId && selectedAnalysis && (
        <div className="flex-1 bg-[#F4FAF9] dark:bg-gray-900 md:h-screen md:overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 p-6 shadow-sm border-b border-teal-50 dark:border-gray-700 sticky top-0 z-10 flex items-center justify-between">
            <div className="flex items-center">
              <button 
                onClick={() => setSelectedSupplierId(null)}
                className="md:hidden mr-4 p-2 -ml-2 rounded-full hover:bg-gray-100"
              >
                <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </button>
              <h2 className="text-xl font-bold text-[#0B2E33] dark:text-gray-100">{selectedAnalysis.supplier.name}</h2>
            </div>
            <div className="flex space-x-2">
              <button 
                onClick={() => openEditModal(selectedAnalysis.supplier)}
                className="text-[#028090] hover:bg-teal-50 dark:bg-[#028090]/20 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors"
              >
                Edit
              </button>
            </div>
          </div>

          <div className="p-6 max-w-3xl mx-auto space-y-6">
            
            {/* Contact Info */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-teal-50 dark:border-gray-700">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4">Contact Details</h3>
              <div className="space-y-3">
                {selectedAnalysis.supplier.phone ? (
                  <div className="flex items-center text-gray-700 dark:text-gray-300 text-sm">
                    <Phone className="w-4 h-4 mr-3 text-teal-600" />
                    {selectedAnalysis.supplier.phone}
                  </div>
                ) : null}
                {selectedAnalysis.supplier.email ? (
                  <div className="flex items-center text-gray-700 dark:text-gray-300 text-sm">
                    <Mail className="w-4 h-4 mr-3 text-teal-600" />
                    {selectedAnalysis.supplier.email}
                  </div>
                ) : null}
                {selectedAnalysis.supplier.address ? (
                  <div className="flex items-start text-gray-700 dark:text-gray-300 text-sm">
                    <MapPin className="w-4 h-4 mr-3 text-teal-600 shrink-0 mt-0.5" />
                    {selectedAnalysis.supplier.address}
                  </div>
                ) : null}
                {!selectedAnalysis.supplier.phone && !selectedAnalysis.supplier.email && !selectedAnalysis.supplier.address && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 italic">No contact information provided.</p>
                )}
                {selectedAnalysis.supplier.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 whitespace-pre-wrap">{selectedAnalysis.supplier.notes}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-teal-50 dark:border-gray-700">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Total Spent</p>
                <p className="text-2xl font-bold text-[#0B2E33] dark:text-gray-100">
                  {formatCurrency(selectedAnalysis.totalSpending)}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-teal-50 dark:border-gray-700">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Purchases</p>
                <p className="text-2xl font-bold text-[#0B2E33] dark:text-gray-100">{selectedAnalysis.purchaseCount}</p>
              </div>
            </div>

            {/* Purchase History */}
            <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-sm border border-teal-50 dark:border-gray-700 overflow-hidden">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Purchase History</h3>
              </div>
              
              {selectedAnalysis.purchases.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-4 text-center">No purchases recorded yet.</p>
              ) : (
                <div className="overflow-x-auto -mx-5 px-5">
                  <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase bg-gray-50 dark:bg-gray-900/50">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Date</th>
                        <th className="px-4 py-3 font-semibold">Product</th>
                        <th className="px-4 py-3 font-semibold text-right">Price</th>
                        <th className="px-4 py-3 font-semibold text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {selectedAnalysis.purchases.sort((a,b) => {
                        const dateA = a.purchaseDate ? new Date(a.purchaseDate).getTime() : 0;
                        const dateB = b.purchaseDate ? new Date(b.purchaseDate).getTime() : 0;
                        return dateB - dateA;
                      }).map((p, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:bg-gray-900/50 transition-colors">
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {p.purchaseDate ? format(parseISO(p.purchaseDate), 'MMM d, yyyy') : 'Unknown'}
                          </td>
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                            {p.productName}
                            {p.qty && <span className="text-gray-400 ml-2 font-normal">x{p.qty} {p.unit}</span>}
                          </td>
                          <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-400">
                            {formatCurrency(p.unitPrice)}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-[#0B2E33] dark:text-gray-100">
                            {formatCurrency(p.totalPrice)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            
            <div className="flex justify-end pb-8">
              <button 
                onClick={() => handleDelete(selectedAnalysis.supplier.id)}
                className="text-red-500 hover:text-red-700 text-sm font-medium px-4 py-2 rounded-lg transition-colors hover:bg-red-50"
              >
                Delete Supplier
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-white dark:bg-gray-800 rounded-t-3xl sm:rounded-3xl w-full max-w-md max-h-[90dvh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95 pb-safe">
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700">
              <h2 className="text-xl font-bold text-[#0B2E33] dark:text-gray-100">
                {editId ? 'Edit Supplier' : 'Add Supplier'}
              </h2>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 dark:text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveSupplier} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Supplier Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#02C39A] focus:border-transparent outline-none transition-all"
                  placeholder="e.g. Acme Corp"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#02C39A] focus:border-transparent outline-none transition-all"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#02C39A] focus:border-transparent outline-none transition-all"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#02C39A] focus:border-transparent outline-none transition-all"
                  placeholder="Optional"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">Notes</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-[#02C39A] focus:border-transparent outline-none transition-all resize-none"
                  placeholder="Optional notes about this supplier..."
                />
              </div>
              
              <div className="pt-4 flex space-x-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-100 text-gray-700 dark:text-gray-300 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#0B2E33] text-white py-3 rounded-xl font-semibold hover:bg-[#028090] transition-colors"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
