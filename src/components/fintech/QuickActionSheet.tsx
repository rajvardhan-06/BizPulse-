import React from 'react';
import { 
  Camera, 
  Send, 
  QrCode, 
  Zap, 
  PlusCircle, 
  ReceiptText, 
  Package, 
  Target, 
  TrendingUp, 
  Store, 
  FileText, 
  MessageSquareQuote, 
  X,
  Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickActionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTransfer: () => void;
  onOpenRequest: () => void;
  onOpenTopUp: () => void;
  onOpenBillPay: () => void;
}

export const QuickActionSheet: React.FC<QuickActionSheetProps> = ({
  isOpen,
  onClose,
  onOpenTransfer,
  onOpenRequest,
  onOpenTopUp,
  onOpenBillPay,
}) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const fintechActions = [
    {
      title: 'Scan Receipt',
      desc: 'AI camera extraction',
      icon: Camera,
      color: 'bg-emerald-500 text-white',
      action: () => {
        onClose();
        navigate('/scan');
      }
    },
    {
      title: 'AI Chat Assistant',
      desc: 'Chat & in-box scanner',
      icon: MessageSquareQuote,
      color: 'bg-[#028090] text-white',
      action: () => {
        onClose();
        navigate('/chat');
      }
    },
    {
      title: 'Transfer Money',
      desc: 'Send to contacts or bank',
      icon: Send,
      color: 'bg-[#3562FF] text-white',
      action: () => {
        onClose();
        onOpenTransfer();
      }
    },
    {
      title: 'Request / QR Code',
      desc: 'Receive instant payments',
      icon: QrCode,
      color: 'bg-purple-500 text-white',
      action: () => {
        onClose();
        onOpenRequest();
      }
    },
    {
      title: 'Pay Bill',
      desc: 'Electricity, water & net',
      icon: Zap,
      color: 'bg-amber-500 text-white',
      action: () => {
        onClose();
        onOpenBillPay();
      }
    },
    {
      title: 'Top Up Wallet',
      desc: 'Deposit funds to card',
      icon: PlusCircle,
      color: 'bg-cyan-500 text-white',
      action: () => {
        onClose();
        onOpenTopUp();
      }
    }
  ];

  const intelligenceFeatures = [
    {
      title: 'Ledger & Export',
      desc: 'CSV / PDF for accounting',
      icon: ReceiptText,
      path: '/ledger'
    },
    {
      title: 'Inventory & Stock',
      desc: 'Track items & reorders',
      icon: Package,
      path: '/inventory'
    },
    {
      title: 'Budget Planner',
      desc: 'Spend limits & progress',
      icon: Target,
      path: '/budget'
    },
    {
      title: 'Price Intelligence',
      desc: 'Track vendor price hikes',
      icon: TrendingUp,
      path: '/prices'
    },
    {
      title: 'Suppliers',
      desc: 'Vendor catalog & history',
      icon: Store,
      path: '/suppliers'
    },
    {
      title: 'Business Reports',
      desc: 'Summaries & analytics',
      icon: FileText,
      path: '/reports'
    }
  ];

  return (
    <div className="fixed inset-0 z-[110] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-t-[36px] sm:rounded-[36px] w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-2xl border border-gray-100 dark:border-gray-800 p-6 animate-in slide-in-from-bottom-8 sm:zoom-in-95 duration-200 pb-10 sm:pb-6">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4 sticky top-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xs py-1 z-10">
          <div className="flex items-center space-x-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#3562FF] animate-pulse" />
            <h3 className="font-bold text-base text-gray-900 dark:text-white">Quick Actions & Features</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Fast Transaction Actions */}
        <div className="mb-5">
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2.5 px-1">
            Wallet & Transactions
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {fintechActions.map((action, idx) => {
              const Icon = action.icon;
              return (
                <button
                  key={idx}
                  onClick={action.action}
                  className="flex flex-col items-start p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 hover:bg-blue-50/60 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700/60 hover:border-[#3562FF]/40 transition-all text-left group"
                >
                  <div className={`w-9 h-9 rounded-xl ${action.color} flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-[#3562FF] transition-colors">
                    {action.title}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-400 leading-tight mt-0.5 truncate w-full">
                    {action.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Business Intelligence Suite */}
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2.5 px-1">
            Business Intelligence & Operations
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {intelligenceFeatures.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <button
                  key={idx}
                  onClick={() => {
                    onClose();
                    navigate(feat.path);
                  }}
                  className="flex flex-col items-start p-3 rounded-2xl bg-gray-50/60 dark:bg-gray-800/40 hover:bg-teal-50/50 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-700/60 hover:border-[#028090]/40 transition-all text-left group"
                >
                  <div className="w-9 h-9 rounded-xl bg-white dark:bg-gray-700 text-[#028090] dark:text-[#02C39A] border border-gray-100 dark:border-gray-600 flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs font-bold text-gray-900 dark:text-white group-hover:text-[#028090] dark:group-hover:text-[#02C39A] transition-colors">
                    {feat.title}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-gray-400 leading-tight mt-0.5 truncate w-full">
                    {feat.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
export default QuickActionSheet;
