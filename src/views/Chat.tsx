import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useStore, isConfirmedReceipt, Receipt } from '../store';
import { useAuthStore } from '../authStore';
import { 
  Send, Loader2, Sparkles, ReceiptText, ArrowRight, Camera, 
  AlertCircle, RefreshCw, X, Image as ImageIcon, CheckCircle2, 
  Store, Calendar, Tag, ChevronRight, ScanLine
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { calculateInventory } from '../lib/inventory';
import { calculateBudgetSpending } from '../lib/budget';
import { calculatePriceIntelligence } from '../lib/intelligence';
import { calculateSupplierIntelligence } from '../lib/supplier';
import { Link } from 'react-router-dom';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  image?: string;
  receipt?: {
    id: string;
    merchant: string;
    total: number;
    currency: string;
    date: string;
    items: Array<{ name: string; qty: number; unit_price: number; unit?: string | null; category?: string }>;
  };
}

const SUGGESTED_QUESTIONS = [
  "What is my total spending?",
  "Which category costs the most?",
  "How much did I spend on packaging?",
  "Show my recent purchases"
];

export default function Chat() {
  const token = useAuthStore(state => state.token);
  const receipts = useStore(state => state.receipts).filter(isConfirmedReceipt);
  const adjustments = useStore(state => state.inventoryAdjustments);
  const settings = useStore(state => state.inventorySettings);
  const budgets = useStore(state => state.budgets);
  const suppliers = useStore(state => state.suppliers);
  const addReceipt = useStore(state => state.addReceipt);

  const inventory = useMemo(() => calculateInventory(receipts, adjustments, settings), [receipts, adjustments, settings]);
  const budgetAnalyses = useMemo(() => calculateBudgetSpending(budgets, receipts), [budgets, receipts]);
  const priceIntelligence = useMemo(() => calculatePriceIntelligence(receipts, suppliers), [receipts, suppliers]);
  const supplierIntelligence = useMemo(() => calculateSupplierIntelligence(receipts, suppliers), [receipts, suppliers]);

  const initialGreeting = useMemo<Message>(() => ({
    id: 'initial-msg',
    role: 'assistant',
    content: receipts.length > 0 
      ? `Hello! I am your BizPulse assistant. I have analyzed your ${receipts.length} verified purchase receipts. You can ask me anything about your costs, inventory, or suppliers—or tap the camera in the message box to scan a new receipt!`
      : 'Hello! I am your BizPulse assistant. You can ask me anything about managing your business finances, or tap the camera icon in the message box below to scan and analyze your first receipt!'
  }), [receipts.length]);

  const [messages, setMessages] = useState<Message[]>([initialGreeting]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scanStatusText, setScanStatusText] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Scanner state inside message box
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [attachedMimeType, setAttachedMimeType] = useState<string>('image/jpeg');
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [showScanMenu, setShowScanMenu] = useState(false);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scanMenuRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scanStatusText, errorMsg]);

  // Adjust textarea height automatically
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // Close scan popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (scanMenuRef.current && !scanMenuRef.current.contains(event.target as Node)) {
        setShowScanMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle receipt image selected from camera or gallery
  const handleImageSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('The selected image exceeds 10 MB. Please choose a smaller photo.');
      e.target.value = '';
      return;
    }

    if (!file.type.startsWith('image/')) {
      setErrorMsg('Please select a valid image file (JPEG, PNG, WebP).');
      e.target.value = '';
      return;
    }

    setAttachedMimeType(file.type);
    setAttachedFileName(file.name);

    const reader = new FileReader();
    reader.onerror = () => {
      setErrorMsg("Could not read image file. Please try another photo.");
    };
    reader.onload = (event) => {
      setAttachedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
    setShowScanMenu(false);
  };

  const clearAttachedImage = () => {
    setAttachedImage(null);
    setAttachedFileName(null);
    if (cameraInputRef.current) cameraInputRef.current.value = '';
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSend = async (textToSend?: string) => {
    const messageText = (textToSend !== undefined ? textToSend : input).trim();
    const hasImage = Boolean(attachedImage);

    if (!messageText && !hasImage) return;
    if (isLoading) return;

    setErrorMsg(null);

    const activeImage = attachedImage;
    const activeMime = attachedMimeType;

    // Reset input fields immediately for snappy UI
    setInput('');
    clearAttachedImage();
    setIsLoading(true);

    // Case 1: An image is attached in the message box -> Process OCR scan & chat
    if (hasImage && activeImage) {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText || 'Scanned and attached a purchase receipt for analysis.',
        image: activeImage
      };
      setMessages(prev => [...prev, userMessage]);
      setScanStatusText('Scanning receipt with Gemini OCR...');

      try {
        const base64Data = activeImage.split(',')[1];
        const extractRes = await fetch('/api/extract', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageBase64: base64Data, mimeType: activeMime })
        });

        if (!extractRes.ok) {
          throw new Error('Receipt scanner was unable to extract data from this image.');
        }

        const data = await extractRes.json();

        // Create verified receipt record
        const newReceipt: Receipt = {
          id: crypto.randomUUID(),
          merchant: data.merchant || 'Retail Merchant',
          supplierId: null,
          date: data.date || new Date().toISOString().split('T')[0],
          total: Number(data.total) || 0,
          currency: data.currency || 'INR',
          items: Array.isArray(data.items) ? data.items.filter(Boolean).map((item: any) => ({
            id: crypto.randomUUID(),
            name: item.name || '',
            qty: Number(item.qty) || 1,
            unit_price: Number(item.unit_price) || 0,
            unit: item.unit ? String(item.unit).trim() : null,
            category: item.category || 'General'
          })) : [],
          captureTimestamp: Date.now(),
          confirmed: true,
          status: 'confirmed'
        };

        // Save to application store
        addReceipt(newReceipt);
        setScanStatusText('Updating ledger & synthesizing insights...');

        // If the user had a specific follow-up question (e.g. "Did this cost more than last month?"):
        let aiInsightText = '';
        if (messageText && messageText !== 'Scanned and attached a purchase receipt for analysis.') {
          // Send inquiry with newly included receipt
          const compactLedgerWithNew = {
            receipts: [...receipts, newReceipt].map(r => ({
              id: r.id,
              merchant: r.merchant,
              date: r.date,
              total: r.total,
              currency: r.currency,
              items: r.items.map(i => ({ name: i.name, qty: i.qty, unit_price: i.unit_price, category: i.category, unit: i.unit }))
            })),
            inventory: inventory.map(i => ({ name: i.name, estimatedStock: i.estimatedStock, unit: i.unit })),
            budgets: budgetAnalyses.map(b => ({ name: b.budget.name, amount: b.budget.amount, spent: b.spent, remaining: b.remaining })),
            priceComparisons: priceIntelligence.comparisons,
            suppliers: supplierIntelligence.analyses
          };

          const chatRes = await fetch('/api/chat', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(token ? { Authorization: `Bearer ${token}` } : {})
            },
            body: JSON.stringify({
              messages: [
                ...messages.filter(m => m.id !== 'initial-msg').map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: `[Scanned Receipt from ${newReceipt.merchant} for  ${formatCurrency(newReceipt.total)}. Items: ${newReceipt.items.map(i => `${i.name} (qty ${i.qty} @ ${formatCurrency(i.unit_price)})`).join(', ')}]. Question: ${messageText}` }
              ],
              ledger: compactLedgerWithNew
            })
          });

          if (chatRes.ok) {
            const chatData = await chatRes.json();
            aiInsightText = chatData.reply;
          }
        }

        if (!aiInsightText) {
          aiInsightText = `Receipt from **${newReceipt.merchant}** dated **${newReceipt.date}** for **${formatCurrency(newReceipt.total)}** has been verified and saved to your Purchase Ledger.\n\n${newReceipt.items.length} line item${newReceipt.items.length !== 1 ? 's were' : ' was'} recorded and inventory quantities have been updated. You can ask me any question about this purchase or compare it to previous invoices.`;
        }

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: aiInsightText,
          receipt: {
            id: newReceipt.id,
            merchant: newReceipt.merchant,
            total: newReceipt.total,
            currency: newReceipt.currency,
            date: newReceipt.date || '',
            items: newReceipt.items
          }
        };

        setMessages(prev => [...prev, assistantMessage]);
      } catch (err: any) {
        setErrorMsg(err.message || 'Receipt scan failed. Please try again with a clearer picture.');
      } finally {
        setIsLoading(false);
        setScanStatusText(null);
      }
      return;
    }

    // Case 2: Regular text message
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);

    const compactLedger = {
      receipts: receipts.map(r => ({
        id: r.id,
        merchant: r.merchant,
        date: r.date,
        total: r.total,
        currency: r.currency,
        items: r.items.map(i => ({
          name: i.name,
          qty: i.qty,
          unit_price: i.unit_price,
          category: i.category,
          unit: i.unit
        }))
      })),
      inventory: inventory.map(i => ({
        name: i.name,
        estimatedStock: i.estimatedStock,
        unit: i.unit,
        purchasedQuantity: i.purchasedQuantity,
        reorderThreshold: i.reorderThreshold
      })),
      budgets: budgetAnalyses.map(b => ({
        name: b.budget.name,
        category: b.budget.category,
        period: b.budget.period,
        startDate: b.budget.startDate,
        endDate: b.budget.endDate,
        amount: b.budget.amount,
        spent: b.spent,
        remaining: b.remaining,
        percentage: b.percentage,
        status: b.status
      })),
      priceComparisons: priceIntelligence.comparisons.map(c => ({
        productName: c.productName,
        status: c.status,
        latestPrice: c.latestPrice,
        previousPrice: c.previousPrice,
        priceDifference: c.priceDifference,
        percentageChange: c.percentageChange,
        latestMerchant: c.latestMerchant,
        previousMerchant: c.previousMerchant,
        latestDate: c.latestDate,
        previousDate: c.previousDate,
        unit: c.unit
      })),
      suppliers: supplierIntelligence.analyses.map(s => ({
        name: s.supplier.name,
        totalSpending: s.totalSpending,
        purchaseCount: s.purchaseCount,
        firstPurchaseDate: s.firstPurchaseDate,
        lastPurchaseDate: s.lastPurchaseDate,
        productsSupplied: s.productsSupplied
      }))
    };

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          messages: [...messages.filter(m => m.id !== 'initial-msg'), userMessage].map(m => ({ role: m.role, content: m.content })),
          ledger: compactLedger
        })
      });

      if (!res.ok) throw new Error('Failed to get response');

      const data = await res.json();
      
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.reply
      }]);
    } catch (err: any) {
      setErrorMsg("I couldn't process your request due to a network issue. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleRetry = () => {
    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      setErrorMsg(null);
      const lastIndex = messages.lastIndexOf(lastUserMsg);
      const newMessages = messages.slice(0, lastIndex);
      setMessages(newMessages);
      handleSend(lastUserMsg.content);
    }
  };

  const renderText = (text: string) => {
    return text.split('\n').map((line, i) => (
      <React.Fragment key={i}>
        {line}
        {i !== text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto min-h-0 bg-app-bg overflow-hidden transition-colors duration-300">
      {/* Top Header */}
      <div className="bg-primary-blue text-white pt-8 pb-5 px-6 rounded-b-[32px] shadow-sm shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-10 blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3.5">
            <div className="bg-white/20 p-2.5 rounded-2xl shadow-sm backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold">Insights Chat</h1>
              <p className="text-white/80 text-[11px] font-medium uppercase tracking-wider">Gemini OCR & Financial AI</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              to="/ledger"
              className="bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm transition-colors flex items-center space-x-1.5"
            >
              <ReceiptText className="w-4 h-4 text-emerald-300" />
              <span>Ledger ({receipts.length})</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-5">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
            <div 
              className={cn(
                "max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 text-sm shadow-sm relative leading-relaxed",
                msg.role === 'user' 
                  ? "bg-primary-blue text-white rounded-br-sm" 
                  : "bg-app-surface text-app-text border border-app-border rounded-bl-sm"
              )}
            >
              {/* If user attached an image, render preview inside the message */}
              {msg.image && (
                <div className="mb-3 overflow-hidden rounded-xl border border-white/20 shadow-sm max-w-xs">
                  <img 
                    src={msg.image} 
                    alt="Receipt Scanned" 
                    className="w-full max-h-56 object-cover bg-black/20" 
                  />
                  <div className="bg-black/40 text-white px-3 py-1.5 text-[11px] font-medium flex items-center space-x-1.5 backdrop-blur-md">
                    <Camera className="w-3.5 h-3.5" />
                    <span>Scanned Document</span>
                  </div>
                </div>
              )}

              {/* Message text */}
              <div className="whitespace-pre-wrap leading-relaxed">{renderText(msg.content)}</div>

              {/* Verified Receipt Card */}
              {msg.receipt && (
                <div className="mt-4 p-3.5 bg-app-bg rounded-2xl border border-app-border text-app-text">
                  <div className="flex items-start justify-between pb-3 mb-3 border-b border-app-border">
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <Store className="w-4 h-4 text-primary-blue" />
                        <span className="font-bold text-xs">{msg.receipt.merchant}</span>
                      </div>
                      <span className="text-[11px] font-medium text-app-text-secondary mt-0.5 block">
                        {msg.receipt.date || 'Today'}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-app-text-secondary uppercase tracking-wider block mb-0.5">Total Amount</span>
                      <span className="font-bold text-sm text-primary-blue">
                        {formatCurrency(msg.receipt.total)}
                      </span>
                    </div>
                  </div>

                  {/* Items list preview */}
                  {msg.receipt.items && msg.receipt.items.length > 0 && (
                    <div className="space-y-1.5 my-3">
                      <p className="text-[10px] font-bold text-app-text-secondary uppercase tracking-wider">Extracted Items ({msg.receipt.items.length})</p>
                      <div className="max-h-32 overflow-y-auto space-y-1 pr-1">
                        {msg.receipt.items.map((item, i) => (
                          <div key={i} className="flex justify-between items-center py-1 text-xs">
                            <span className="truncate pr-2 font-medium text-app-text">
                              {item.name} {item.qty > 1 && <span className="text-app-text-secondary text-[11px] font-normal ml-1">(×{item.qty})</span>}
                            </span>
                            <span className="font-bold shrink-0">{formatCurrency(item.qty * item.unit_price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 border-t border-app-border flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Ledger Updated</span>
                    </div>
                    <Link
                      to="/ledger"
                      className="text-[11px] font-bold text-primary-blue hover:underline flex items-center"
                    >
                      <span>Open Ledger</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex w-full justify-start">
            <div className="bg-app-surface border border-app-border rounded-2xl rounded-bl-sm px-5 py-4 text-app-text-secondary shadow-sm flex items-center space-x-3 animate-in fade-in">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-primary-blue rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-primary-blue rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-primary-blue rounded-full animate-bounce"></div>
              </div>
              <span className="text-sm font-semibold">{scanStatusText || 'Analyzing financial ledger...'}</span>
            </div>
          </div>
        )}

        {/* Error banner */}
        {errorMsg && (
          <div className="flex w-full justify-start">
            <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-2xl rounded-bl-sm px-5 py-4 text-rose-700 dark:text-rose-400 shadow-sm flex flex-col space-y-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                <span className="text-sm font-bold">{errorMsg}</span>
              </div>
              <button 
                onClick={handleRetry}
                className="self-start text-xs font-bold bg-white dark:bg-gray-800 px-4 py-2 rounded-full border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center space-x-1.5 shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Area: Suggested Chips & The Message Box with Scanner */}
      <div className="shrink-0 bg-app-surface/95 backdrop-blur-md border-t border-app-border pt-3 pb-3 px-4 transition-colors">
        {/* Hidden Camera & File Inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleImageSelected}
          className="hidden"
          id="chat-camera-input"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,.pdf"
          onChange={handleImageSelected}
          className="hidden"
          id="chat-gallery-input"
        />

        {/* Suggested Quick Questions or Actions */}
        {messages.length === 1 && !isLoading && (
          <div className="flex overflow-x-auto space-x-2 mb-3 pb-1 scrollbar-hide">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="whitespace-nowrap bg-brand-teal/10 border border-brand-teal/20 text-brand-teal px-4 py-2 rounded-full text-xs font-bold hover:bg-brand-teal/20 transition-colors shadow-sm flex items-center space-x-2"
            >
              <Camera className="w-4 h-4" />
              <span>Scan a receipt</span>
            </button>
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="whitespace-nowrap bg-app-bg border border-app-border text-primary-blue px-4 py-2 rounded-full text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* THE MESSAGE BOX (CONTAINING INTEGRATED SCANNER) */}
        <div className="relative bg-app-bg border border-app-border rounded-[28px] shadow-sm p-2 focus-within:ring-2 focus-within:ring-primary-blue focus-within:border-transparent transition-all">
          {/* Attached Receipt Preview inside the message box */}
          {attachedImage && (
            <div className="flex items-center justify-between p-2.5 mb-2 bg-app-surface rounded-2xl border border-app-border animate-in fade-in">
              <div className="flex items-center space-x-3 overflow-hidden">
                <img 
                  src={attachedImage} 
                  alt="Receipt Preview" 
                  className="w-12 h-12 object-cover rounded-xl border border-app-border shrink-0 shadow-sm" 
                />
                <div className="truncate">
                  <p className="text-xs font-bold text-app-text truncate">
                    {attachedFileName || 'Receipt Photo'}
                  </p>
                  <p className="text-[11px] text-brand-teal font-medium flex items-center space-x-1.5 mt-0.5">
                    <ScanLine className="w-3.5 h-3.5" />
                    <span>Ready to scan • Tap send to analyze</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearAttachedImage}
                className="p-2 text-app-text-secondary hover:text-app-text rounded-full hover:bg-app-bg transition-colors"
                title="Remove attached receipt"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-end space-x-2">
            {/* The Integrated Scanner Button */}
            <div className="relative shrink-0" ref={scanMenuRef}>
              <button
                type="button"
                id="message-box-scanner-button"
                onClick={() => setShowScanMenu(!showScanMenu)}
                className={cn(
                  "p-3 rounded-full transition-all flex items-center justify-center shadow-sm",
                  attachedImage 
                    ? "bg-brand-teal text-white" 
                    : "bg-app-surface text-app-text-secondary hover:text-primary-blue hover:bg-blue-50 dark:hover:bg-blue-950/40"
                )}
                title="Scan Receipt with Camera or Gallery"
              >
                <Camera className="w-5 h-5" />
              </button>

              {/* Scan Options Popover */}
              {showScanMenu && (
                <div className="absolute bottom-14 left-0 w-56 bg-app-surface border border-app-border rounded-2xl shadow-xl p-2.5 z-30 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 mb-1.5 border-b border-app-border">
                    <span className="text-[10px] font-bold text-app-text-secondary uppercase tracking-wider">Receipt Scanner</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowScanMenu(false); cameraInputRef.current?.click(); }}
                    className="w-full text-left px-3 py-3 text-xs font-bold text-app-text hover:bg-app-bg rounded-xl flex items-center space-x-3 transition-colors group"
                  >
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-primary-blue group-hover:bg-primary-blue group-hover:text-white transition-colors">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <p>Take Photo</p>
                      <p className="text-[10px] text-app-text-secondary font-medium">Scan using camera</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowScanMenu(false); fileInputRef.current?.click(); }}
                    className="w-full text-left px-3 py-3 text-xs font-bold text-app-text hover:bg-app-bg rounded-xl flex items-center space-x-3 transition-colors mt-1 group"
                  >
                    <div className="p-2 bg-brand-teal/10 rounded-lg text-brand-teal group-hover:bg-brand-teal group-hover:text-white transition-colors">
                      <ImageIcon className="w-4 h-4" />
                    </div>
                    <div>
                      <p>Choose from Device</p>
                      <p className="text-[10px] text-app-text-secondary font-medium">Upload receipt image</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* The Text Area */}
            <textarea
              ref={inputRef}
              id="chat-message-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={attachedImage ? "Add questions about this receipt..." : "Ask about your spending..."}
              className="flex-1 bg-transparent max-h-32 min-h-[44px] resize-none px-3 py-2.5 text-sm font-medium text-app-text focus:outline-none placeholder:text-app-text-secondary/60"
              rows={1}
            />

            {/* Send Button */}
            <button
              onClick={() => handleSend()}
              disabled={(!input.trim() && !attachedImage) || isLoading}
              id="chat-send-button"
              className={cn(
                "p-3 rounded-full transition-all shadow-sm shrink-0",
                (!input.trim() && !attachedImage) || isLoading
                  ? "bg-app-surface text-app-text-secondary/50 cursor-not-allowed"
                  : "bg-primary-blue text-white hover:opacity-90"
              )}
              title={attachedImage ? "Scan & Analyze Receipt" : "Send message"}
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5 ml-0.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
