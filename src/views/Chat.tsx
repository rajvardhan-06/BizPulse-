import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useStore, isConfirmedReceipt, Receipt } from '../store';
import { useAuthStore } from '../authStore';
import { 
  Send, Loader2, Sparkles, ReceiptText, Camera, 
  AlertCircle, RefreshCw, X, Image as ImageIcon, CheckCircle2, 
  Store, ChevronRight, ScanLine, RotateCcw, ShieldAlert
} from 'lucide-react';
import { cn, formatCurrency } from '../lib/utils';
import { computeConfirmedFinancialSummary, buildRelevantContext } from '../lib/chatContext';
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

/**
 * Safe markdown parser to render bold, italics, lists, and headings
 * without dangerous innerHTML or crash risks on null/undefined.
 */
function parseInlineMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className="font-bold text-inherit">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

function SafeMarkdownContent({ content }: { content: string | undefined | null }) {
  if (!content || typeof content !== 'string') {
    return <span className="text-app-text-secondary italic">No response content available.</span>;
  }

  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let currentList: React.ReactNode[] = [];
  let isNumberedList = false;

  const flushList = () => {
    if (currentList.length > 0) {
      if (isNumberedList) {
        elements.push(
          <ol key={`ol-${elements.length}`} className="list-decimal pl-5 my-1.5 space-y-1 text-sm">
            {currentList}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="list-disc pl-5 my-1.5 space-y-1 text-sm">
            {currentList}
          </ul>
        );
      }
      currentList = [];
    }
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      elements.push(<div key={`space-${idx}`} className="h-1.5" />);
      return;
    }

    if (line.startsWith('### ') || line.startsWith('#### ')) {
      flushList();
      const headingText = line.replace(/^#{3,4}\s+/, '');
      elements.push(
        <h4 key={`h-${idx}`} className="text-sm font-bold mt-2.5 mb-1 text-inherit">
          {parseInlineMarkdown(headingText)}
        </h4>
      );
      return;
    }

    if (line.startsWith('* ') || line.startsWith('- ')) {
      if (isNumberedList) flushList();
      isNumberedList = false;
      const bulletText = line.slice(2);
      currentList.push(
        <li key={`li-${idx}`} className="text-sm leading-relaxed">
          {parseInlineMarkdown(bulletText)}
        </li>
      );
      return;
    }

    const numMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numMatch) {
      if (!isNumberedList) flushList();
      isNumberedList = true;
      currentList.push(
        <li key={`li-num-${idx}`} className="text-sm leading-relaxed">
          {parseInlineMarkdown(numMatch[2])}
        </li>
      );
      return;
    }

    flushList();
    elements.push(
      <p key={`p-${idx}`} className="text-sm leading-relaxed my-0.5">
        {parseInlineMarkdown(line)}
      </p>
    );
  });

  flushList();
  return <div className="space-y-1 break-words overflow-hidden">{elements}</div>;
}

export default function Chat() {
  const token = useAuthStore(state => state.token);
  const user = useAuthStore(state => state.user);
  const receipts = useStore(state => state.receipts).filter(isConfirmedReceipt);
  const adjustments = useStore(state => state.inventoryAdjustments);
  const settings = useStore(state => state.inventorySettings);
  const budgets = useStore(state => state.budgets);
  const suppliers = useStore(state => state.suppliers);
  const addReceipt = useStore(state => state.addReceipt);

  // Compute deterministic confirmed summary metrics
  const financialSummary = useMemo(() => {
    return computeConfirmedFinancialSummary(receipts, budgets, suppliers, adjustments, settings);
  }, [receipts, budgets, suppliers, adjustments, settings]);

  const initialGreeting = useMemo<Message>(() => ({
    id: 'initial-msg',
    role: 'assistant',
    content: financialSummary.hasData 
      ? `Hello! I am your BizPulse Financial AI for **${user?.businessProfile?.businessName || 'your business'}**.\n\nI have verified **${financialSummary.confirmedReceiptsCount}** confirmed transactions totaling **${financialSummary.totalSpendingFormatted}**. Ask me anything about your costs, category spending, supplier prices, or stock alerts!`
      : `Hello! I am your BizPulse Financial AI. You have not logged any confirmed receipts yet. You can ask me how BizPulse tracks expenses, or tap the **Camera** icon below to scan and analyze your first purchase receipt!`
  }), [financialSummary.hasData, financialSummary.confirmedReceiptsCount, financialSummary.totalSpendingFormatted, user?.businessProfile?.businessName]);

  const [messages, setMessages] = useState<Message[]>([initialGreeting]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scanStatusText, setScanStatusText] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);

  // Preserve user message on failure for easy retry
  const lastFailedMessageRef = useRef<string | null>(null);

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

  // Adjust textarea height automatically up to max height
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

  // Starter questions tailored to available confirmed business data
  const starterQuestions = useMemo(() => {
    if (financialSummary.hasData) {
      return [
        "How much did I spend in total?",
        "What are my most frequent categories?",
        "Summarize my recent transactions",
        "What is my current budget status?"
      ];
    }
    return [
      "How do I scan my first receipt?",
      "How does BizPulse calculate budget tracking?",
      "What reports can I generate in BizPulse?"
    ];
  }, [financialSummary.hasData]);

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
    setErrorMsg(null);

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

  const handleResetChat = () => {
    setMessages([initialGreeting]);
    setErrorMsg(null);
    setIsAuthError(false);
    clearAttachedImage();
    setInput('');
    lastFailedMessageRef.current = null;
  };

  const handleSend = async (textToSend?: string) => {
    const messageText = (textToSend !== undefined ? textToSend : input).trim();
    const hasImage = Boolean(attachedImage);

    // Guard: Prevent empty submissions
    if (!messageText && !hasImage) return;

    // Guard: Prevent duplicate submissions while already loading
    if (isLoading) return;

    setErrorMsg(null);
    setIsAuthError(false);

    const activeImage = attachedImage;
    const activeMime = attachedMimeType;

    // Reset input fields immediately for responsive UI
    setInput('');
    clearAttachedImage();
    setIsLoading(true);

    const currentAuthToken = token || useAuthStore.getState().token;

    // Case 1: Receipt image attached -> Perform OCR extraction then chat analysis
    if (hasImage && activeImage) {
      const userMessage: Message = {
        id: crypto.randomUUID(),
        role: 'user',
        content: messageText || 'Scanned and attached a purchase receipt for verification.',
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
          let errDetail = 'Receipt scan failed. Please try again with a clearer photo.';
          try {
            const errJson = await extractRes.json();
            if (errJson.error) errDetail = errJson.error;
          } catch {
            // Ignore non-json body
          }
          throw new Error(errDetail);
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

        // Recompute summary with newly added receipt for prompt context
        const updatedSummary = computeConfirmedFinancialSummary(
          [...receipts, newReceipt],
          budgets,
          suppliers,
          adjustments,
          settings
        );
        const contextData = buildRelevantContext(messageText, updatedSummary);

        let aiInsightText = '';
        if (messageText && messageText !== 'Scanned and attached a purchase receipt for verification.') {
          const chatRes = await fetch('/api/chat', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(currentAuthToken ? { Authorization: `Bearer ${currentAuthToken}` } : {})
            },
            body: JSON.stringify({
              messages: [
                ...messages.filter(m => m.id !== 'initial-msg').map(m => ({ role: m.role, content: m.content })),
                { role: 'user', content: `[Scanned Receipt from ${newReceipt.merchant} for ${formatCurrency(newReceipt.total || 0)}. Items: ${newReceipt.items.map(i => `${i.name} (qty ${i.qty} @ ${formatCurrency(i.unit_price)})`).join(', ')}]. Question: ${messageText}` }
              ],
              context: contextData,
              businessName: user?.businessProfile?.businessName || 'Your Business',
              currency: user?.businessProfile?.currency || 'INR'
            })
          });

          if (chatRes.ok) {
            const chatData = await chatRes.json();
            aiInsightText = chatData.reply;
          }
        }

        if (!aiInsightText) {
          aiInsightText = `Receipt from **${newReceipt.merchant}** dated **${newReceipt.date}** for **${formatCurrency(newReceipt.total || 0)}** has been confirmed and saved to your Purchase Ledger.\n\n${newReceipt.items.length} line item${newReceipt.items.length !== 1 ? 's were' : ' was'} verified and your financial totals have been updated.`;
        }

        const assistantMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: aiInsightText,
          receipt: {
            id: newReceipt.id,
            merchant: newReceipt.merchant,
            total: newReceipt.total || 0,
            currency: newReceipt.currency,
            date: newReceipt.date || '',
            items: newReceipt.items
          }
        };

        setMessages(prev => [...prev, assistantMessage]);
      } catch (err: any) {
        lastFailedMessageRef.current = messageText;
        setErrorMsg(err.message || 'Receipt scan failed. Please try again with a clearer picture.');
      } finally {
        setIsLoading(false);
        setScanStatusText(null);
      }
      return;
    }

    // Case 2: Regular conversational financial inquiry
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);

    // Build targeted context using deterministic calculations
    const relevantContext = buildRelevantContext(messageText, financialSummary);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(currentAuthToken ? { Authorization: `Bearer ${currentAuthToken}` } : {})
        },
        body: JSON.stringify({
          messages: [...messages.filter(m => m.id !== 'initial-msg'), userMessage].map(m => ({ role: m.role, content: m.content })),
          context: relevantContext,
          businessName: user?.businessProfile?.businessName || 'Your Business',
          currency: user?.businessProfile?.currency || 'INR'
        })
      });

      if (!res.ok) {
        let serverError = '';
        let serverCode = '';
        try {
          const errData = await res.json();
          serverError = errData?.error || '';
          serverCode = errData?.code || '';
        } catch {
          // Non-JSON response
        }

        if (res.status === 401 || serverCode === 'AUTH_REQUIRED' || serverCode === 'SESSION_EXPIRED') {
          setIsAuthError(true);
          throw new Error('Please sign in again to continue.');
        } else if (res.status === 429 || serverCode === 'RATE_LIMIT') {
          throw new Error('Too many requests. Please wait a moment and try again.');
        } else if (res.status === 503 || serverCode === 'API_KEY_MISSING') {
          throw new Error(serverError || 'The Gemini AI service is temporarily unavailable. Please verify your GEMINI_API_KEY in Settings.');
        } else if (res.status === 504 || serverCode === 'TIMEOUT') {
          throw new Error('The request timed out. Please try again.');
        } else {
          throw new Error(serverError || 'Something went wrong. Please try again.');
        }
      }

      const data = await res.json();
      const replyContent = data.reply || "I don't have enough confirmed business data to answer that yet.";
      
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: replyContent
      }]);
      lastFailedMessageRef.current = null;
    } catch (err: any) {
      lastFailedMessageRef.current = messageText;
      if (!window.navigator.onLine) {
        setErrorMsg('Connection failed. Check your internet connection and try again.');
      } else if (err?.message && typeof err.message === 'string') {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Something went wrong. Please try again.');
      }
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
    if (lastFailedMessageRef.current) {
      const text = lastFailedMessageRef.current;
      setErrorMsg(null);
      setIsAuthError(false);
      handleSend(text);
      return;
    }

    const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
    if (lastUserMsg) {
      setErrorMsg(null);
      setIsAuthError(false);
      const lastIndex = messages.lastIndexOf(lastUserMsg);
      const newMessages = messages.slice(0, lastIndex);
      setMessages(newMessages);
      handleSend(lastUserMsg.content);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto min-h-0 bg-app-bg overflow-hidden transition-colors duration-300">
      {/* Top Header - BizPulse Navy Theme */}
      <header className="bg-primary text-white pt-6 pb-4 px-5 rounded-b-3xl shadow-sm shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary-blue/30 p-2.5 rounded-2xl shadow-sm border border-white/10">
              <Sparkles className="w-5 h-5 text-brand-green" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white tracking-tight flex items-center space-x-2">
                <span>BizPulse AI Advisor</span>
              </h1>
              <p className="text-white/70 text-[11px] font-medium">
                {financialSummary.hasData 
                  ? `${financialSummary.confirmedReceiptsCount} receipts verified • Total: ${financialSummary.totalSpendingFormatted}`
                  : 'Grounded in your confirmed receipts'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleResetChat}
              className="bg-white/10 hover:bg-white/20 text-white/90 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm transition-colors flex items-center space-x-1.5"
              title="Start a new chat conversation"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>
            <Link
              to="/ledger"
              className="bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm transition-colors flex items-center space-x-1.5"
            >
              <ReceiptText className="w-4 h-4 text-brand-green" />
              <span>Ledger ({receipts.length})</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
            <div 
              className={cn(
                "max-w-[90%] sm:max-w-[80%] rounded-2xl p-4 text-sm shadow-sm relative leading-relaxed overflow-hidden",
                msg.role === 'user' 
                  ? "bg-primary-blue text-white rounded-br-sm" 
                  : "bg-app-surface text-app-text border border-app-border rounded-bl-sm"
              )}
            >
              {/* Scanned Receipt Photo preview inside message bubble */}
              {msg.image && (
                <div className="mb-3 overflow-hidden rounded-xl border border-white/20 shadow-sm max-w-xs">
                  <img 
                    src={msg.image} 
                    alt="Receipt Scanned" 
                    className="w-full max-h-56 object-cover bg-black/20" 
                  />
                  <div className="bg-black/50 text-white px-3 py-1.5 text-[11px] font-medium flex items-center space-x-1.5 backdrop-blur-md">
                    <Camera className="w-3.5 h-3.5 text-brand-green" />
                    <span>Scanned Document</span>
                  </div>
                </div>
              )}

              {/* Message text with safe markdown parser */}
              <SafeMarkdownContent content={msg.content} />

              {/* Verified Receipt Card */}
              {msg.receipt && (
                <div className="mt-3.5 p-3.5 bg-app-bg rounded-xl border border-app-border text-app-text">
                  <div className="flex items-start justify-between pb-2.5 mb-2.5 border-b border-app-border">
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
                      <span className="text-[10px] font-bold text-app-text-secondary uppercase tracking-wider block mb-0.5">Total</span>
                      <span className="font-bold text-sm text-primary-blue">
                        {formatCurrency(msg.receipt.total)}
                      </span>
                    </div>
                  </div>

                  {/* Items list preview */}
                  {msg.receipt.items && msg.receipt.items.length > 0 && (
                    <div className="space-y-1 my-2.5">
                      <p className="text-[10px] font-bold text-app-text-secondary uppercase tracking-wider">
                        Extracted Items ({msg.receipt.items.length})
                      </p>
                      <div className="max-h-28 overflow-y-auto space-y-1 pr-1">
                        {msg.receipt.items.map((item, i) => (
                          <div key={i} className="flex justify-between items-center py-0.5 text-xs">
                            <span className="truncate pr-2 font-medium text-app-text">
                              {item.name} {item.qty > 1 && <span className="text-app-text-secondary text-[11px] font-normal ml-1">(×{item.qty})</span>}
                            </span>
                            <span className="font-bold shrink-0">{formatCurrency(item.qty * item.unit_price)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-2.5 border-t border-app-border flex items-center justify-between">
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
            <div className="bg-app-surface border border-app-border rounded-2xl rounded-bl-sm px-5 py-3.5 text-app-text-secondary shadow-sm flex items-center space-x-3 animate-in fade-in">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-primary-blue rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-brand-teal rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-brand-green rounded-full animate-bounce"></div>
              </div>
              <span className="text-sm font-semibold">{scanStatusText || 'Analyzing confirmed ledger...'}</span>
            </div>
          </div>
        )}

        {/* Error Banner with Retry & Sign-In Support */}
        {errorMsg && (
          <div className="flex w-full justify-start">
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl rounded-bl-sm px-5 py-4 text-rose-700 dark:text-rose-300 shadow-sm flex flex-col space-y-3 max-w-[90%] sm:max-w-[80%]">
              <div className="flex items-start space-x-2.5">
                <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
                <span className="text-sm font-medium leading-snug">{errorMsg}</span>
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <button 
                  onClick={handleRetry}
                  className="text-xs font-bold bg-white dark:bg-gray-800 px-4 py-2 rounded-full border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center space-x-1.5 shadow-sm"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Retry</span>
                </button>
                {isAuthError && (
                  <Link
                    to="/login"
                    className="text-xs font-bold bg-primary-blue text-white px-4 py-2 rounded-full hover:opacity-90 transition-opacity shadow-sm flex items-center space-x-1"
                  >
                    <span>Sign In</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Bottom Area: Suggested Chips & The Message Box with Scanner */}
      <div className="shrink-0 bg-app-surface/95 backdrop-blur-md border-t border-app-border pt-3 pb-4 px-4 transition-colors">
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
          accept="image/*"
          onChange={handleImageSelected}
          className="hidden"
          id="chat-gallery-input"
        />

        {/* Suggested Quick Questions or Actions */}
        {messages.length === 1 && !isLoading && (
          <div className="flex overflow-x-auto space-x-2 mb-3 pb-1 scrollbar-hide">
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="whitespace-nowrap bg-brand-teal/10 border border-brand-teal/20 text-brand-teal px-3.5 py-1.5 rounded-full text-xs font-bold hover:bg-brand-teal/20 transition-colors shadow-sm flex items-center space-x-1.5"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Scan receipt</span>
            </button>
            {starterQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="whitespace-nowrap bg-app-bg border border-app-border text-app-text px-3.5 py-1.5 rounded-full text-xs font-semibold hover:border-primary-blue hover:text-primary-blue transition-colors shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* The Message Box */}
        <div className="relative bg-app-bg border border-app-border rounded-3xl shadow-sm p-2 focus-within:ring-2 focus-within:ring-primary-blue focus-within:border-transparent transition-all">
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
                    <span>Ready to scan • Tap send to verify</span>
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
                  "p-2.5 rounded-full transition-all flex items-center justify-center shadow-sm",
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
                <div className="absolute bottom-14 left-0 w-56 bg-app-surface border border-app-border rounded-2xl shadow-xl p-2 z-30 animate-in fade-in zoom-in-95">
                  <div className="px-3 py-1.5 mb-1 border-b border-app-border">
                    <span className="text-[10px] font-bold text-app-text-secondary uppercase tracking-wider">Receipt Scanner</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowScanMenu(false); cameraInputRef.current?.click(); }}
                    className="w-full text-left px-3 py-2.5 text-xs font-bold text-app-text hover:bg-app-bg rounded-xl flex items-center space-x-3 transition-colors group"
                  >
                    <div className="p-2 bg-blue-50 dark:bg-blue-950/40 rounded-lg text-primary-blue group-hover:bg-primary-blue group-hover:text-white transition-colors">
                      <Camera className="w-4 h-4" />
                    </div>
                    <div>
                      <p>Take Photo</p>
                      <p className="text-[10px] text-app-text-secondary font-medium">Scan with camera</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowScanMenu(false); fileInputRef.current?.click(); }}
                    className="w-full text-left px-3 py-2.5 text-xs font-bold text-app-text hover:bg-app-bg rounded-xl flex items-center space-x-3 transition-colors mt-1 group"
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
              placeholder={attachedImage ? "Add a note or question about this receipt..." : "Ask BizPulse about spending, inventory, or suppliers..."}
              className="flex-1 bg-transparent max-h-32 min-h-[44px] resize-none px-3 py-2.5 text-sm font-medium text-app-text focus:outline-none placeholder:text-app-text-secondary/60"
              rows={1}
            />

            {/* Send Button */}
            <button
              onClick={() => handleSend()}
              disabled={(!input.trim() && !attachedImage) || isLoading}
              id="chat-send-button"
              className={cn(
                "p-2.5 rounded-full transition-all shadow-sm shrink-0 flex items-center justify-center",
                (!input.trim() && !attachedImage) || isLoading
                  ? "bg-app-surface text-app-text-secondary/40 cursor-not-allowed"
                  : "bg-primary-blue text-white hover:opacity-90 active:scale-95"
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
