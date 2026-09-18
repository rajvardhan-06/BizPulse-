import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Camera, Image as ImageIcon, CheckCircle2, XCircle, Loader2, RefreshCw, Plus, Trash2, ReceiptText, Store } from 'lucide-react';
import { useStore, Receipt, ReceiptItem } from '../store';
import { formatCurrency } from '../lib/utils';

export default function Scan() {
  const navigate = useNavigate();
  const addReceipt = useStore(state => state.addReceipt);
  const suppliers = useStore(state => state.suppliers);
  
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'preview' | 'processing' | 'review' | 'error' | 'success'>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  
  const [parsedData, setParsedData] = useState<Partial<Receipt> | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [savedReceipt, setSavedReceipt] = useState<Receipt | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      setImagePreview(null);
      setFileName(null);
    };
  }, []);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('The image is too large. Please choose an image under 10 MB.');
      setStatus('error');
      e.target.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMsg('This image format is not supported.');
      setStatus('error');
      e.target.value = '';
      return;
    }

    setMimeType(file.type);
    setFileName(file.name);

    const reader = new FileReader();
    reader.onerror = () => {
      setErrorMsg("We couldn't read this image. Please try another file.");
      setStatus('error');
    };
    reader.onload = (event) => {
      const base64Url = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        setImagePreview(base64Url);
        setStatus('preview');
      };
      img.onerror = () => {
        setErrorMsg("We couldn't read this image. Please try another file.");
        setStatus('error');
      };
      img.src = base64Url;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAnalyze = async () => {
    if (!imagePreview || !mimeType || status === 'processing') return;
    
    setStatus('processing');
    const base64Data = imagePreview.split(',')[1];
    
    abortControllerRef.current = new AbortController();
    const timeoutId = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    }, 60000); 
    
    try {
      const res = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64Data, mimeType }),
        signal: abortControllerRef.current.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!res.ok) {
        let errDetail = 'Receipt analysis service is temporarily unavailable.';
        try {
          const errJson = await res.json();
          if (errJson.error) errDetail = errJson.error;
        } catch {}
        throw new Error(errDetail);
      }
      
      const data = await res.json();
      
      setParsedData({
        id: crypto.randomUUID(),
        merchant: data.merchant || '',
        supplierId: null,
        date: data.date || null,
        total: Number(data.total) || 0,
        currency: data.currency || 'INR',
        items: Array.isArray(data.items) ? data.items.filter(Boolean).map((item: any) => ({
          id: crypto.randomUUID(),
          name: item.name || '',
          qty: Number(item.qty) || 1,
          unit_price: Number(item.unit_price) || 0,
          unit: item.unit ? String(item.unit).trim() : null,
          category: item.category || 'Uncategorized'
        })) : [],
        captureTimestamp: Date.now(),
        confirmed: false,
        status: 'draft'
      });
      
      setStatus('review');
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        if (err.message?.includes('timeout') || err.message === 'The user aborted a request.') {
          setErrorMsg('Receipt analysis is taking too long. Please try again.');
          setStatus('error');
        } else {
          setErrorMsg('Receipt analysis cancelled or timed out.');
          setStatus('error');
        }
      } else {
        setErrorMsg(err.message || "We couldn't read this receipt reliably.");
        setStatus('error');
      }
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleCancelAnalysis = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort('User cancelled');
    }
    setStatus('preview');
  };

  const handleRetake = () => {
    setImagePreview(null);
    setMimeType(null);
    setFileName(null);
    setParsedData(null);
    setStatus('idle');
  };

  const handleItemChange = (index: number, field: keyof ReceiptItem, value: any) => {
    if (!parsedData || !parsedData.items) return;
    const newItems = [...parsedData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setParsedData({ ...parsedData, items: newItems });
  };

  const handleAddItem = () => {
    if (!parsedData) return;
    const newItems = [...(parsedData.items || [])];
    newItems.push({
      id: crypto.randomUUID(),
      name: '',
      qty: 1,
      unit_price: 0,
      unit: '',
      category: 'Uncategorized'
    });
    setParsedData({ ...parsedData, items: newItems });
  };

  const handleRemoveItem = (index: number) => {
    if (!parsedData || !parsedData.items) return;
    const newItems = [...parsedData.items];
    newItems.splice(index, 1);
    setParsedData({ ...parsedData, items: newItems });
  };

  const handleConfirm = () => {
    if (!parsedData || isConfirming) return;
    
    const errors: string[] = [];
    
    if (!parsedData.merchant?.trim()) errors.push('Merchant name is required.');
    if (parsedData.total === undefined || parsedData.total < 0 || isNaN(parsedData.total)) {
      errors.push('Total amount must be a valid non-negative number.');
    }
    if (!parsedData.items || parsedData.items.length === 0) {
      errors.push('At least one item is required.');
    } else {
      parsedData.items.forEach((item, idx) => {
        if (!item.name?.trim()) errors.push(`Item ${idx + 1} name is required.`);
        if (item.qty <= 0 || isNaN(item.qty)) errors.push(`Item ${idx + 1} quantity must be > 0.`);
        if (item.unit_price < 0 || isNaN(item.unit_price)) errors.push(`Item ${idx + 1} price cannot be negative.`);
      });
    }

    if (errors.length > 0) {
      setValidationErrors(errors);
      return;
    }
    
    setIsConfirming(true);
    
    const finalReceipt: Receipt = {
      merchant: parsedData.merchant.trim(),
      supplierId: parsedData.supplierId || null,
      date: parsedData.date || null,
      total: Number(parsedData.total) || 0,
      currency: parsedData.currency || 'INR',
      items: parsedData.items.map(item => ({
        ...item,
        name: item.name.trim(),
        qty: Number(item.qty),
        unit_price: Number(item.unit_price),
        unit: item.unit?.trim() || null,
        category: item.category?.trim() || 'Uncategorized'
      })),
      captureTimestamp: parsedData.captureTimestamp || Date.now(),
      id: parsedData.id || crypto.randomUUID(),
      confirmed: true,
      status: 'confirmed'
    };
    
    addReceipt(finalReceipt);
    setSavedReceipt(finalReceipt);
    setStatus('success');
    setIsConfirming(false);
  };

  return (
    <div className="min-h-full bg-app-bg pb-8 md:pb-10 pt-6 px-4 sm:px-6 max-w-2xl mx-auto w-full transition-colors duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-app-text tracking-tight">Scanner</h1>
          <p className="text-xs text-app-text-secondary mt-1">Digitize your receipts in seconds.</p>
        </div>
      </div>
        
      {/* IDLE STATE */}
      {status === 'idle' && (
        <div className="space-y-4">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="w-full flex flex-col items-center justify-center bg-app-surface border border-app-border rounded-3xl h-48 hover:border-primary-blue hover:shadow-md transition-all group"
          >
            <div className="w-14 h-14 bg-blue-50 dark:bg-blue-950/30 text-primary-blue rounded-full flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
              <Camera className="w-6 h-6" />
            </div>
            <span className="font-bold text-lg text-app-text mb-1">Take a Photo</span>
            <span className="text-sm font-medium text-app-text-secondary">Use camera to capture receipt</span>
          </button>
          <input type="file" accept="image/*" capture="environment" ref={cameraInputRef} className="hidden" onChange={handleFile} />

          <button
            onClick={() => galleryInputRef.current?.click()}
            className="w-full flex items-center justify-between bg-app-surface border border-app-border rounded-2xl p-5 hover:border-gray-400 dark:hover:border-gray-500 transition-all group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-app-bg rounded-full flex items-center justify-center text-app-text-secondary group-hover:text-app-text transition-colors">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="font-bold text-sm text-app-text block">Upload from Gallery</span>
                <span className="text-xs font-medium text-app-text-secondary">Select an existing image</span>
              </div>
            </div>
          </button>
          <input type="file" accept="image/*" ref={galleryInputRef} className="hidden" onChange={handleFile} />
        </div>
      )}

      {/* PREVIEW STATE */}
      {status === 'preview' && imagePreview && (
        <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
          <div className="bg-app-surface p-2 rounded-3xl shadow-sm border border-app-border overflow-hidden relative">
            <div className="aspect-[3/4] w-full rounded-2xl overflow-hidden bg-app-bg relative">
              <img src={imagePreview} alt="Receipt Preview" className="w-full h-full object-contain" />
              {fileName && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-5">
                  <p className="text-white text-sm font-bold truncate text-center">{fileName}</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="flex space-x-3">
            <button onClick={handleRetake} className="flex-1 bg-app-surface text-app-text border border-app-border py-4 rounded-2xl font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm text-sm">
              Retake
            </button>
            <button onClick={handleAnalyze} className="flex-[2] bg-primary-blue text-white py-4 rounded-2xl font-bold shadow-sm hover:bg-blue-600 transition-colors text-sm">
              Process Receipt
            </button>
          </div>
        </div>
      )}

      {/* PROCESSING STATE */}
      {status === 'processing' && (
        <div className="flex flex-col items-center justify-center h-80 bg-app-surface rounded-3xl shadow-sm border border-app-border p-6 text-center animate-in fade-in zoom-in-95 duration-200">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-primary-blue rounded-full animate-ping opacity-20"></div>
            <div className="relative bg-blue-50 dark:bg-blue-950/40 p-5 rounded-full">
              <Loader2 className="w-8 h-8 text-primary-blue animate-spin" />
            </div>
          </div>
          <h2 className="text-lg font-bold text-app-text mb-2">Extracting Details...</h2>
          <p className="text-xs font-medium text-app-text-secondary mb-8">Reading items, prices, and merchant info.</p>
          
          <button onClick={handleCancelAnalysis} className="text-app-text-secondary hover:text-app-text text-sm font-bold transition-colors">
            Cancel
          </button>
        </div>
      )}

      {/* ERROR STATE */}
      {status === 'error' && (
        <div className="flex flex-col items-center justify-center bg-app-surface rounded-3xl p-8 text-center shadow-sm border border-rose-100 dark:border-rose-900/30 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/40 rounded-full flex items-center justify-center mb-4">
            <XCircle className="w-8 h-8 text-rose-500" />
          </div>
          <h2 className="text-lg font-bold text-app-text mb-2">Scan Failed</h2>
          <p className="text-xs font-medium text-app-text-secondary mb-8 max-w-xs">{errorMsg}</p>
          
          <div className="space-y-3 w-full">
            {imagePreview && (
              <button onClick={handleAnalyze} className="w-full bg-primary-blue text-white py-3.5 rounded-2xl font-bold shadow-sm hover:bg-blue-600 transition-colors text-sm">
                Try Again
              </button>
            )}
            <button onClick={handleRetake} className="w-full bg-app-surface text-app-text py-3.5 rounded-2xl font-bold border border-app-border hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-sm">
              {imagePreview ? 'Choose Another' : 'Return to Scan'}
            </button>
          </div>
        </div>
      )}

      {/* REVIEW STATE */}
      {status === 'review' && parsedData && (
        <div className="space-y-5 animate-in fade-in zoom-in-95 duration-200">
          {validationErrors.length > 0 && (
            <div className="bg-rose-50 dark:bg-rose-950/40 border border-rose-100 dark:border-rose-900/50 rounded-2xl p-4 shadow-sm text-sm text-rose-600 dark:text-rose-400">
              <p className="font-bold mb-2 flex items-center">
                <XCircle className="w-4 h-4 mr-2" /> Please fix issues:
              </p>
              <ul className="list-disc pl-6 space-y-1 text-xs">
                {validationErrors.map((err, i) => <li key={i}>{err}</li>)}
              </ul>
            </div>
          )}

          <div className="bg-app-surface p-5 rounded-3xl shadow-sm border border-app-border">
            <h2 className="text-sm font-bold text-app-text mb-4 pb-3 border-b border-app-border">Details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-app-text-secondary uppercase tracking-wider mb-1.5">Merchant</label>
                <input 
                  type="text" 
                  value={parsedData.merchant} 
                  onChange={(e) => setParsedData({ ...parsedData, merchant: e.target.value })}
                  className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm font-medium text-app-text focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-app-text-secondary uppercase tracking-wider mb-1.5 flex items-center">
                  <Store className="w-3 h-3 mr-1" />
                  Supplier Link
                </label>
                <select 
                  value={parsedData.supplierId || ''} 
                  onChange={(e) => setParsedData({ ...parsedData, supplierId: e.target.value || null })}
                  className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm font-medium text-app-text focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue appearance-none"
                >
                  <option value="">Unknown / None</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-app-text-secondary uppercase tracking-wider mb-1.5">Date</label>
                  <input 
                    type="date" 
                    value={parsedData.date || ''} 
                    onChange={(e) => setParsedData({ ...parsedData, date: e.target.value })}
                    className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm font-medium text-app-text focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-app-text-secondary uppercase tracking-wider mb-1.5">Total (₹)</label>
                  <input 
                    type="number" step="0.01" 
                    value={parsedData.total === 0 ? '' : parsedData.total} 
                    onChange={(e) => setParsedData({ ...parsedData, total: Number(e.target.value) })}
                    className="w-full bg-app-bg border border-app-border rounded-xl px-4 py-3 text-sm font-bold text-app-text focus:outline-none focus:border-primary-blue focus:ring-1 focus:ring-primary-blue"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-app-surface p-5 rounded-3xl shadow-sm border border-app-border">
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-app-border">
              <h2 className="text-sm font-bold text-app-text">Items</h2>
              <span className="text-xs font-bold bg-blue-50 dark:bg-blue-900/20 text-primary-blue px-2.5 py-1 rounded-full">
                {parsedData.items?.length || 0}
              </span>
            </div>
            
            <div className="space-y-3">
              {parsedData.items?.map((item, idx) => (
                <div key={item.id} className="border border-app-border rounded-2xl p-4 bg-app-bg relative">
                  <button onClick={() => handleRemoveItem(idx)} className="absolute -top-2 -right-2 bg-app-surface border border-app-border text-app-text-secondary hover:text-rose-500 rounded-full p-1.5 shadow-sm transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  
                  <div className="space-y-3">
                    <input 
                      type="text" value={item.name} onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                      className="w-full bg-app-surface border border-app-border rounded-xl px-3 py-2 text-sm font-bold text-app-text focus:outline-none focus:border-primary-blue focus:ring-1"
                      placeholder="Item Name"
                    />
                    <div className="grid grid-cols-[1fr_1.5fr_1fr] gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-app-text-secondary mb-1">Qty</label>
                        <input 
                          type="number" step="0.01" value={item.qty === 0 ? '' : item.qty} onChange={(e) => handleItemChange(idx, 'qty', Number(e.target.value))}
                          className="w-full bg-app-surface border border-app-border rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-primary-blue focus:ring-1"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-app-text-secondary mb-1">Price (₹)</label>
                        <input 
                          type="number" step="0.01" value={item.unit_price === 0 ? '' : item.unit_price} onChange={(e) => handleItemChange(idx, 'unit_price', Number(e.target.value))}
                          className="w-full bg-app-surface border border-app-border rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-primary-blue focus:ring-1"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-app-text-secondary mb-1">Total</label>
                        <div className="w-full bg-app-surface border border-transparent rounded-xl px-3 py-2 text-sm text-app-text font-bold overflow-hidden text-ellipsis whitespace-nowrap">
                          {formatCurrency((item.qty || 0) * (item.unit_price || 0))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
                
              <button onClick={handleAddItem} className="w-full border-2 border-dashed border-app-border text-app-text-secondary py-3 rounded-2xl text-xs font-bold hover:border-gray-400 dark:hover:border-gray-500 hover:text-app-text transition-colors flex items-center justify-center space-x-1 mt-2">
                <Plus className="w-4 h-4" />
                <span>Add Item</span>
              </button>

              <div className="mt-4 flex justify-between items-center text-xs px-3 py-2.5 bg-app-bg rounded-xl border border-app-border">
                <span className="font-medium text-app-text-secondary">Sum: {formatCurrency(parsedData.items?.reduce((sum, item) => sum + ((item.qty || 0) * (item.unit_price || 0)), 0) || 0)}</span>
                <span className="font-bold text-app-text">Total: {formatCurrency(Number(parsedData.total) || 0)}</span>
              </div>
            </div>
          </div>
          
          <div className="space-y-3 pt-2">
            <button onClick={handleConfirm} disabled={isConfirming} className="w-full bg-primary-blue text-white py-4 rounded-2xl font-bold shadow-md hover:bg-blue-600 transition-colors flex justify-center items-center space-x-2 disabled:opacity-70 text-sm">
              {isConfirming ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /><span>Confirm & Save</span></>}
            </button>
            <button onClick={handleRetake} disabled={isConfirming} className="w-full text-app-text-secondary py-3 rounded-2xl font-bold hover:text-app-text hover:bg-app-surface transition-colors disabled:opacity-50 text-xs">
              Discard
            </button>
          </div>
        </div>
      )}

      {/* SUCCESS STATE */}
      {status === 'success' && savedReceipt && (
        <div className="bg-app-surface rounded-3xl p-8 text-center shadow-sm border border-app-border animate-in fade-in zoom-in-95 duration-200">
          <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-950/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <h2 className="text-xl font-bold text-app-text mb-2">Saved</h2>
          <p className="text-app-text-secondary text-xs font-medium mb-6">Receipt processed and stored.</p>
          
          <div className="bg-app-bg rounded-2xl p-4 mb-8 text-left border border-app-border">
            <p className="font-bold text-app-text truncate text-sm">{savedReceipt.merchant}</p>
            <div className="flex justify-between items-end mt-1">
              <p className="text-xs font-medium text-app-text-secondary">{savedReceipt.items.length} items</p>
              <p className="font-bold text-app-text">{formatCurrency(savedReceipt.total || 0)}</p>
            </div>
          </div>

          <div className="space-y-3">
            <Link to="/activity" className="w-full bg-app-text text-app-surface py-3.5 rounded-2xl font-bold shadow-sm transition-colors flex items-center justify-center space-x-2 text-sm">
              <ReceiptText className="w-4 h-4" />
              <span>View Activity</span>
            </Link>
            
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleRetake} className="bg-app-surface border border-app-border text-app-text py-3.5 rounded-2xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                Scan Another
              </button>
              <Link to="/" className="bg-app-surface border border-app-border text-app-text py-3.5 rounded-2xl text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center">
                Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

