import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useStore, isConfirmedReceipt, Receipt } from '../store';
import { useAuthStore } from '../authStore';
import { 
  Send, Loader2, Sparkles, ReceiptText, Camera, 
  AlertCircle, RefreshCw, X, Image as ImageIcon, CheckCircle2, 
  Store, ChevronRight, ScanLine, RotateCcw, TrendingUp,
  PieChart, Target, ArrowRight, ShieldCheck
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
 * Safe inline markdown parser for bold, italics, code
 */
function parseInlineMarkdown(text: string): React.ReactNode[] {
  if (!text) return [];
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={index} className="font-semibold text-inherit">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={index}>{part}</span>;
  });
}

/**
 * Safe markdown renderer for assistant responses
 */
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

  // Compute deterministic confirmed summary metrics from ledger
  const financialSummary = useMemo(() => {
    return computeConfirmedFinancialSummary(receipts, budgets, suppliers, adjustments, settings);
  }, [receipts, budgets, suppliers, adjustments, settings]);

  const initialGreeting = useMemo<Message>(() => ({
    id: 'initial-msg',
    role: 'assistant',
    content: financialSummary.hasData 
      ? `Hello! I am your BizPulse Financial AI for **${user?.businessProfile?.businessName || 'your business'}**.\n\nI have verified **${financialSummary.confirmedReceiptsCount}** confirmed transaction${financialSummary.confirmedReceiptsCount === 1 ? '' : 's'} totaling **${financialSummary.totalSpendingFormatted}**. Ask me anything about your costs, category spending, supplier prices, or stock alerts!`
      : `Hello! I am your BizPulse Financial AI. You have not logged any confirmed receipts yet. You can ask me how BizPulse tracks expenses, or tap **Scan Receipt** below to capture and analyze your first purchase!`
  }), [financialSummary.hasData, financialSummary.confirmedReceiptsCount, financialSummary.totalSpendingFormatted, user?.businessProfile?.businessName]);

  const [messages, setMessages] = useState<Message[]>([initialGreeting]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [scanStatusText, setScanStatusText] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAuthError, setIsAuthError] = useState(false);

  // References to strictly prevent duplicate submissions
  const isSubmittingRef = useRef(false);
  const lastSubmitTimeRef = useRef(0);
  // Store the exact ID and content of the user message that failed
  const failedMessageRef = useRef<{ id: string; content: string; image?: string; mimeType?: string } | null>(null);

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

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scanStatusText, errorMsg, scrollToBottom]);

  // Adjust textarea height automatically up to 120px
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

  // Starter prompts categorized for fintech clarity
  const starterPrompts = useMemo(() => {
    if (financialSummary.hasData) {
      return [
        {
          title: "Total Spending",
          desc: "How much did I spend in total?",
          query: "How much did I spend in total across all confirmed receipts?",
          icon: TrendingUp,
          badge: financialSummary.totalSpendingFormatted
        },
        {
          title: "Top Categories",
          desc: "Where is my money going?",
          query: "What are my highest spending categories?",
          icon: PieChart,
          badge: `${financialSummary.categoryBreakdown.length} categories`
        },
        {
          title: "Budget Usage",
          desc: "Check budget limits & remaining",
          query: "What is my current budget status and how much do I have left?",
          icon: Target,
          badge: `${budgets.length} budgets`
        },
        {
          title: "Recent Transactions",
          desc: "Summarize latest purchases",
          query: "Summarize my most recent purchase transactions.",
          icon: ReceiptText,
          badge: `${financialSummary.confirmedReceiptsCount} receipts`
        }
      ];
    }
    return [
      {
        title: "Track Expenses",
        desc: "How does BizPulse work?",
        query: "How does BizPulse track and verify business expenses?",
        icon: TrendingUp,
        badge: "Guide"
      },
      {
        title: "Budget Planning",
        desc: "How do budgets work?",
        query: "How do I set up spending targets and budgets in BizPulse?",
        icon: Target,
        badge: "Guide"
      },
      {
        title: "Export Reports",
        desc: "Generating business reports",
        query: "What reports can I generate and export in BizPulse?",
        icon: ReceiptText,
        badge: "Guide"
      }
    ];
  }, [financialSummary, budgets.length]);

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
    if (isLoading || isSubmittingRef.current) return;
    setMessages([initialGreeting]);
    setErrorMsg(null);
    setIsAuthError(false);
    clearAttachedImage();
    setInput('');
    failedMessageRef.current = null;
  };

  /**
   * Safe submission handler:
   * - Prevents rapid double clicks or concurrent requests
   * - Appends user message ONCE
   * - Calls API with timeout and error resilience
   */
  const handleSend = async (textToSend?: string) => {
    const now = Date.now();
    // Guard against rapid duplicate clicks within 400ms or concurrent submissions
    if (isSubmittingRef.current || isLoading || now - lastSubmitTimeRef.current < 400) {
      return;
    }

    const messageText = (textToSend !== undefined ? textToSend : input).trim();
    const hasImage = Boolean(attachedImage);

    // Guard: Prevent empty submissions
    if (!messageText && !hasImage) return;

    isSubmittingRef.current = true;
    lastSubmitTimeRef.current = now;
    setIsLoading(true);
    setErrorMsg(null);
    setIsAuthError(false);

    const activeImage = attachedImage;
    const activeMime = attachedMimeType;

    // Reset input fields immediately for clean responsive UX
    setInput('');
    clearAttachedImage();

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
      failedMessageRef.current = {
        id: userMessage.id,
        content: userMessage.content,
        image: activeImage,
        mimeType: activeMime
      };

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
            const errText = await extractRes.text();
            const errJson = JSON.parse(errText);
            if (errJson.error) errDetail = errJson.error;
          } catch {
            if (extractRes.status === 504) errDetail = 'Receipt scanning timed out. Please try again.';
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
        failedMessageRef.current = null;
      } catch (err: any) {
        setErrorMsg(err.message || 'Receipt scan failed. Please try again with a clearer picture.');
      } finally {
        isSubmittingRef.current = false;
        setIsLoading(false);
        setScanStatusText(null);
      }
      return;
    }

    // Case 2: Regular conversational financial inquiry
    const userMessage: Message = { id: crypto.randomUUID(), role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    failedMessageRef.current = { id: userMessage.id, content: messageText };

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
          const rawText = await res.text();
          try {
            const errData = JSON.parse(rawText);
            serverError = errData?.error || '';
            serverCode = errData?.code || '';
          } catch {
            if (res.status === 504 || rawText.includes('FUNCTION_INVOCATION_TIMEOUT')) {
              serverError = 'Request timed out on the server. Please try again.';
              serverCode = 'TIMEOUT';
            } else if (res.status === 502 || res.status === 503) {
              serverError = 'The AI service is temporarily busy. Please try again shortly.';
              serverCode = 'SERVICE_BUSY';
            }
          }
        } catch {
          // Non-readable body
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

      let data: any;
      try {
        data = await res.json();
      } catch {
        throw new Error('Received an invalid response format from the server. Please try again.');
      }

      const replyContent = (typeof data?.reply === 'string' && data.reply.trim().length > 0)
        ? data.reply.trim()
        : "I couldn't find enough confirmed business data to answer that accurately. Please check your confirmed transactions or ask about your spending totals.";
      
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: replyContent
      }]);
      // Clear failed message reference upon success
      failedMessageRef.current = null;
    } catch (err: any) {
      if (!window.navigator.onLine) {
        setErrorMsg('Connection failed. Please check your internet connection and try again.');
      } else if (err?.message && typeof err.message === 'string') {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Something went wrong. Please try again.');
      }
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  /**
   * Safe Retry Handler:
   * Re-sends the request for the existing user message WITHOUT adding a duplicate!
   */
  const handleRetry = async () => {
    if (isSubmittingRef.current || isLoading) return;

    // Identify the user message to retry
    const targetUserMsg = failedMessageRef.current
      ? messages.find(m => m.id === failedMessageRef.current?.id)
      : [...messages].reverse().find(m => m.role === 'user');

    if (!targetUserMsg) {
      setErrorMsg(null);
      return;
    }

    isSubmittingRef.current = true;
    setIsLoading(true);
    setErrorMsg(null);
    setIsAuthError(false);

    const currentAuthToken = token || useAuthStore.getState().token;
    const relevantContext = buildRelevantContext(targetUserMsg.content, financialSummary);

    // Filter conversation history up to and including the failed user message
    const msgIndex = messages.findIndex(m => m.id === targetUserMsg.id);
    const conversationHistory = (msgIndex >= 0 ? messages.slice(0, msgIndex + 1) : messages)
      .filter(m => m.id !== 'initial-msg')
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(currentAuthToken ? { Authorization: `Bearer ${currentAuthToken}` } : {})
        },
        body: JSON.stringify({
          messages: conversationHistory,
          context: relevantContext,
          businessName: user?.businessProfile?.businessName || 'Your Business',
          currency: user?.businessProfile?.currency || 'INR'
        })
      });

      if (!res.ok) {
        let serverError = '';
        let serverCode = '';
        try {
          const rawText = await res.text();
          try {
            const errData = JSON.parse(rawText);
            serverError = errData?.error || '';
            serverCode = errData?.code || '';
          } catch {
            if (res.status === 504 || rawText.includes('FUNCTION_INVOCATION_TIMEOUT')) {
              serverError = 'Request timed out on the server. Please try again.';
              serverCode = 'TIMEOUT';
            } else if (res.status === 502 || res.status === 503) {
              serverError = 'The AI service is temporarily busy. Please try again shortly.';
              serverCode = 'SERVICE_BUSY';
            }
          }
        } catch {
          // Non-readable body
        }

        if (res.status === 401 || serverCode === 'AUTH_REQUIRED' || serverCode === 'SESSION_EXPIRED') {
          setIsAuthError(true);
          throw new Error('Please sign in again to continue.');
        } else if (res.status === 429 || serverCode === 'RATE_LIMIT') {
          throw new Error('Too many requests. Please wait a moment and try again.');
        } else if (res.status === 503 || serverCode === 'API_KEY_MISSING') {
          throw new Error(serverError || 'The Gemini AI service is temporarily unavailable. Please check GEMINI_API_KEY.');
        } else if (res.status === 504 || serverCode === 'TIMEOUT') {
          throw new Error('The request timed out. Please try again.');
        } else {
          throw new Error(serverError || 'Something went wrong. Please try again.');
        }
      }

      const data = await res.json();
      const replyContent = (typeof data?.reply === 'string' && data.reply.trim().length > 0)
        ? data.reply.trim()
        : "I couldn't find enough confirmed business data to answer that accurately.";

      // Append assistant reply to the existing user message (No duplicate user message!)
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: replyContent
      }]);
      failedMessageRef.current = null;
    } catch (err: any) {
      if (!window.navigator.onLine) {
        setErrorMsg('Connection failed. Please check your internet connection and try again.');
      } else if (err?.message && typeof err.message === 'string') {
        setErrorMsg(err.message);
      } else {
        setErrorMsg('Something went wrong. Please try again.');
      }
    } finally {
      isSubmittingRef.current = false;
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if (e.nativeEvent.isComposing) return;
      e.preventDefault();
      if (!isLoading && !isSubmittingRef.current) {
        handleSend();
      }
    }
  };

  const hasActiveConversation = messages.length > 1;

  return (
    <div className="flex flex-col h-full w-full max-w-3xl mx-auto min-h-0 bg-app-bg transition-colors duration-300">
      {/* Top Header - BizPulse Navy Theme */}
      <header className="bg-primary text-white pt-4 pb-3.5 px-4 sm:px-6 rounded-b-2xl shadow-xs shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white/5 blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-primary-blue/30 border border-white/10 flex items-center justify-center shrink-0 shadow-xs">
              <Sparkles className="w-5 h-5 text-brand-green" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight flex items-center space-x-2 truncate">
                <span>BizPulse Financial AI</span>
              </h1>
              <p className="text-white/70 text-[11px] font-medium truncate">
                {financialSummary.hasData 
                  ? `${financialSummary.confirmedReceiptsCount} verified • ${financialSummary.totalSpendingFormatted} ledger total`
                  : 'Grounded in verified receipts'}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5 shrink-0">
            {hasActiveConversation && (
              <button
                onClick={handleResetChat}
                disabled={isLoading}
                className="bg-white/10 hover:bg-white/20 text-white/90 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm transition-colors flex items-center space-x-1.5 disabled:opacity-50"
                title="Start a new chat conversation"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">New Chat</span>
              </button>
            )}
            <Link
              to="/ledger"
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm transition-colors flex items-center space-x-1.5"
            >
              <ReceiptText className="w-3.5 h-3.5 text-brand-green" />
              <span>Ledger ({receipts.length})</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Messages Scroll Area */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 sm:px-6 py-4 space-y-3.5">
        
        {/* Welcome Hero / Starter State (Shown when no conversation turns yet) */}
        {!hasActiveConversation && (
          <div className="py-2 sm:py-4 space-y-4 max-w-xl mx-auto animate-in fade-in duration-300">
            {/* Assistant Welcome Card */}
            <div className="bg-app-surface border border-app-border rounded-2xl p-4 sm:p-5 shadow-xs">
              <div className="flex items-start space-x-3.5">
                <div className="w-10 h-10 rounded-xl bg-primary-blue/10 border border-primary-blue/20 flex items-center justify-center shrink-0 mt-0.5 text-primary-blue">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div className="space-y-1.5 min-w-0">
                  <h3 className="text-sm font-bold text-app-text">
                    BizPulse AI Advisor
                  </h3>
                  <p className="text-xs text-app-text-secondary leading-relaxed">
                    {financialSummary.hasData ? (
                      <>
                        Grounded in <strong className="text-app-text">{financialSummary.confirmedReceiptsCount} verified receipts</strong> totaling <strong className="text-primary-blue">{financialSummary.totalSpendingFormatted}</strong>. Ask about spending, categories, stock levels, or supplier costs.
                      </>
                    ) : (
                      <>
                        Ask business questions or tap <strong>Scan Receipt</strong> below to capture your first invoice or receipt for instant verification.
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Verified Ledger Badge */}
              <div className="mt-3.5 pt-3 border-t border-app-border flex items-center justify-between text-[11px] text-app-text-secondary">
                <span className="flex items-center space-x-1 font-medium text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Strictly grounded in ledger</span>
                </span>
                <span className="font-semibold text-app-text">
                  Currency: INR (₹)
                </span>
              </div>
            </div>

            {/* Quick Starter Cards */}
            <div>
              <p className="text-[11px] font-bold text-app-text-secondary uppercase tracking-wider mb-2 px-1">
                Suggested Inquiries
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {starterPrompts.map((item, idx) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSend(item.query)}
                      disabled={isLoading}
                      className="text-left p-3 rounded-xl bg-app-surface border border-app-border hover:border-primary-blue/50 hover:bg-blue-50/50 dark:hover:bg-blue-950/20 transition-all group flex items-start space-x-3 shadow-xs"
                    >
                      <div className="p-2 rounded-lg bg-app-bg text-primary-blue group-hover:bg-primary-blue group-hover:text-white transition-colors shrink-0">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-app-text group-hover:text-primary-blue transition-colors">
                            {item.title}
                          </span>
                          <span className="text-[10px] font-semibold text-app-text-secondary bg-app-bg px-1.5 py-0.5 rounded-md border border-app-border">
                            {item.badge}
                          </span>
                        </div>
                        <p className="text-[11px] text-app-text-secondary line-clamp-1 mt-0.5">
                          {item.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Message Stream (Rendered in chronological order) */}
        {hasActiveConversation && messages.map((msg) => (
          <div key={msg.id} className={cn("flex w-full", msg.role === 'user' ? "justify-end" : "justify-start")}>
            <div 
              className={cn(
                "rounded-2xl px-4 py-3 text-sm shadow-xs relative leading-relaxed overflow-hidden",
                msg.role === 'user' 
                  ? "max-w-[85%] sm:max-w-[75%] bg-primary-blue text-white rounded-tr-xs" 
                  : "max-w-[88%] sm:max-w-[80%] bg-app-surface text-app-text border border-app-border rounded-tl-xs"
              )}
            >
              {/* Scanned Receipt Photo preview */}
              {msg.image && (
                <div className="mb-2.5 overflow-hidden rounded-xl border border-white/20 shadow-xs max-w-xs">
                  <img 
                    src={msg.image} 
                    alt="Scanned Receipt" 
                    className="w-full max-h-52 object-cover bg-black/20" 
                  />
                  <div className="bg-black/60 text-white px-2.5 py-1 text-[11px] font-medium flex items-center space-x-1.5 backdrop-blur-xs">
                    <Camera className="w-3.5 h-3.5 text-brand-green" />
                    <span>Scanned Document</span>
                  </div>
                </div>
              )}

              {/* Message text with safe markdown parser */}
              <SafeMarkdownContent content={msg.content} />

              {/* Verified Receipt Card */}
              {msg.receipt && (
                <div className="mt-3 p-3 bg-app-bg rounded-xl border border-app-border text-app-text shadow-xs">
                  <div className="flex items-start justify-between pb-2 mb-2 border-b border-app-border">
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
                      <span className="text-[10px] font-bold text-app-text-secondary uppercase tracking-wider block">Total</span>
                      <span className="font-bold text-sm text-primary-blue">
                        {formatCurrency(msg.receipt.total)}
                      </span>
                    </div>
                  </div>

                  {/* Items list preview */}
                  {msg.receipt.items && msg.receipt.items.length > 0 && (
                    <div className="space-y-1 my-2">
                      <p className="text-[10px] font-bold text-app-text-secondary uppercase tracking-wider">
                        Verified Items ({msg.receipt.items.length})
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

                  <div className="pt-2 border-t border-app-border flex items-center justify-between">
                    <div className="flex items-center space-x-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ledger Updated</span>
                    </div>
                    <Link
                      to="/ledger"
                      className="text-[11px] font-bold text-primary-blue hover:underline flex items-center"
                    >
                      <span>View Ledger</span>
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
          <div className="flex w-full justify-start animate-in fade-in duration-200">
            <div className="bg-app-surface border border-app-border rounded-2xl rounded-tl-xs px-4 py-3 text-app-text-secondary shadow-xs flex items-center space-x-3">
              <div className="flex space-x-1.5">
                <div className="w-2 h-2 bg-primary-blue rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                <div className="w-2 h-2 bg-brand-teal rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                <div className="w-2 h-2 bg-brand-green rounded-full animate-bounce"></div>
              </div>
              <span className="text-xs font-semibold">{scanStatusText || 'Analyzing confirmed ledger...'}</span>
            </div>
          </div>
        )}

        {/* Error Component with Safe Retry */}
        {errorMsg && (
          <div className="flex w-full justify-start animate-in fade-in duration-200">
            <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-2xl rounded-tl-xs px-4 py-3.5 text-rose-700 dark:text-rose-300 shadow-xs flex flex-col space-y-2.5 max-w-[90%] sm:max-w-[80%]">
              <div className="flex items-start space-x-2.5">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span className="text-xs font-medium leading-snug">{errorMsg}</span>
              </div>
              <div className="flex items-center space-x-2 pt-0.5">
                <button 
                  onClick={handleRetry}
                  disabled={isLoading}
                  className="text-xs font-bold bg-white dark:bg-gray-800 px-3.5 py-1.5 rounded-full border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors flex items-center space-x-1.5 shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={cn("w-3 h-3", isLoading && "animate-spin")} />
                  <span>Retry</span>
                </button>
                {isAuthError && (
                  <Link
                    to="/login"
                    className="text-xs font-bold bg-primary-blue text-white px-3.5 py-1.5 rounded-full hover:opacity-90 transition-opacity shadow-xs flex items-center space-x-1"
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

      {/* Bottom Area: Input Box & Scanner Action */}
      <div className="shrink-0 bg-app-surface/95 backdrop-blur-md border-t border-app-border p-3 sm:p-4 transition-colors">
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

        {/* The Message Box */}
        <div className="relative bg-app-bg border border-app-border rounded-2xl shadow-xs p-2 focus-within:ring-2 focus-within:ring-primary-blue/30 focus-within:border-primary-blue transition-all">
          {/* Attached Receipt Preview */}
          {attachedImage && (
            <div className="flex items-center justify-between p-2 mb-2 bg-app-surface rounded-xl border border-app-border animate-in fade-in">
              <div className="flex items-center space-x-2.5 overflow-hidden">
                <img 
                  src={attachedImage} 
                  alt="Receipt Preview" 
                  className="w-10 h-10 object-cover rounded-lg border border-app-border shrink-0" 
                />
                <div className="truncate">
                  <p className="text-xs font-bold text-app-text truncate">
                    {attachedFileName || 'Receipt Photo'}
                  </p>
                  <p className="text-[11px] text-brand-teal font-medium flex items-center space-x-1 mt-0.5">
                    <ScanLine className="w-3 h-3" />
                    <span>Ready • Tap send to verify</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={clearAttachedImage}
                className="p-1.5 text-app-text-secondary hover:text-app-text rounded-full hover:bg-app-bg transition-colors"
                title="Remove attached photo"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="flex items-end space-x-1.5 sm:space-x-2">
            {/* Integrated Scanner Button */}
            <div className="relative shrink-0" ref={scanMenuRef}>
              <button
                type="button"
                id="message-box-scanner-button"
                onClick={() => setShowScanMenu(!showScanMenu)}
                className={cn(
                  "p-2 sm:p-2.5 rounded-xl transition-all flex items-center justify-center",
                  attachedImage 
                    ? "bg-brand-teal text-white" 
                    : "bg-app-surface text-app-text-secondary hover:text-primary-blue hover:bg-blue-50 dark:hover:bg-blue-950/40"
                )}
                title="Scan Receipt with Camera or Gallery"
              >
                <Camera className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>

              {/* Scan Options Popover */}
              {showScanMenu && (
                <div className="absolute bottom-12 left-0 w-52 bg-app-surface border border-app-border rounded-xl shadow-lg p-1.5 z-30 animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={() => { setShowScanMenu(false); cameraInputRef.current?.click(); }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-app-text hover:bg-app-bg rounded-lg flex items-center space-x-2.5 transition-colors"
                  >
                    <Camera className="w-4 h-4 text-primary-blue shrink-0" />
                    <div>
                      <p>Take Photo</p>
                      <p className="text-[10px] text-app-text-secondary font-normal">Use camera</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowScanMenu(false); fileInputRef.current?.click(); }}
                    className="w-full text-left px-3 py-2 text-xs font-bold text-app-text hover:bg-app-bg rounded-lg flex items-center space-x-2.5 transition-colors mt-0.5"
                  >
                    <ImageIcon className="w-4 h-4 text-brand-teal shrink-0" />
                    <div>
                      <p>Upload Image</p>
                      <p className="text-[10px] text-app-text-secondary font-normal">Select from gallery</p>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Textarea */}
            <textarea
              ref={inputRef}
              id="chat-message-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={attachedImage ? "Add a note or ask about this receipt..." : "Ask BizPulse about spending, inventory, or suppliers..."}
              className="flex-1 bg-transparent max-h-28 min-h-[40px] resize-none px-2 py-2 text-xs sm:text-sm font-medium text-app-text focus:outline-none placeholder:text-app-text-secondary/60 leading-relaxed"
              rows={1}
            />

            {/* Send Button */}
            <button
              onClick={() => handleSend()}
              disabled={(!input.trim() && !attachedImage) || isLoading}
              id="chat-send-button"
              className={cn(
                "p-2 sm:p-2.5 rounded-xl transition-all shrink-0 flex items-center justify-center",
                (!input.trim() && !attachedImage) || isLoading
                  ? "bg-app-surface text-app-text-secondary/40 cursor-not-allowed"
                  : "bg-primary-blue text-white hover:opacity-90 active:scale-95 shadow-xs"
              )}
              title={attachedImage ? "Scan & Analyze Receipt" : "Send message"}
            >
              {isLoading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" /> : <Send className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
