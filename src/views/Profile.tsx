import React, { useState } from 'react';
import { useAuthStore } from '../authStore';
import { useStore } from '../store';
import { 
  ArrowLeft, User, Shield, Settings as SettingsIcon, HelpCircle, Phone, 
  LogOut, ChevronRight, Moon, Sun, Sparkles, X 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface ProfileProps {
  onReplaySplash?: () => void;
}

export default function Profile({ onReplaySplash }: ProfileProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, setTheme, switchUserContext, cards, activeCardId } = useStore();

  const [activeModal, setActiveModal] = useState<'privacy' | 'help' | 'contact' | null>(null);

  const activeCard = cards.find(c => c.id === activeCardId) || cards[0];
  const displayName = user?.fullName || activeCard?.cardholderName || 'Arya Wijaya';
  const displayContact = user?.phoneNumber || user?.email || '+62 8123456789';

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleLogout = async () => {
    await logout();
    await switchUserContext(null);
    navigate('/login');
  };

  return (
    <div className="min-h-full bg-app-bg pb-8 md:pb-10 pt-6 px-4 sm:px-6 max-w-2xl mx-auto w-full transition-colors duration-300">
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-8">
        <button
          onClick={() => navigate('/')}
          className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 text-app-text-secondary transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold text-app-text">Profile</h1>
        <div className="w-9" />
      </div>

      {/* Profile Avatar & Info Card */}
      <div className="flex flex-col items-center justify-center my-6 text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="relative mb-4">
          <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-tr from-primary-blue via-brand-teal to-emerald-400 shadow-lg">
            <div className="w-full h-full rounded-full bg-app-surface flex items-center justify-center text-3xl font-extrabold text-primary-blue overflow-hidden">
              {displayName.split(' ').map(n => n[0]).join('').slice(0, 2)}
            </div>
          </div>
          <div className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-[3px] border-app-surface" />
        </div>

        <h2 className="text-2xl font-bold text-app-text tracking-tight">
          {displayName}
        </h2>
        <p className="text-sm text-app-text-secondary mt-1 font-medium">
          {displayContact}
        </p>
      </div>

      {/* Menu List */}
      <div className="bg-app-surface rounded-3xl p-3 shadow-sm border border-app-border mb-6 divide-y divide-app-border">
        
        {/* 1. My Account */}
        <button
          onClick={() => navigate('/account')}
          className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-primary-blue flex items-center justify-center shrink-0">
              <User className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-app-text">
              My Account
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-app-text-secondary group-hover:text-app-text transition-colors" />
        </button>

        {/* 2. Privacy Policy */}
        <button
          onClick={() => setActiveModal('privacy')}
          className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-11 h-11 rounded-2xl bg-teal-50 dark:bg-teal-950/40 text-brand-teal flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-app-text">
              Privacy Policy
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-app-text-secondary group-hover:text-app-text transition-colors" />
        </button>

        {/* 3. Setting with direct Dark Mode toggle */}
        <div className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors">
          <div className="flex items-center space-x-4">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-500 flex items-center justify-center shrink-0">
              <SettingsIcon className="w-5 h-5" />
            </div>
            <div className="text-left">
              <span className="text-sm font-bold text-app-text block">
                Setting
              </span>
              <span className="text-[11px] font-medium text-app-text-secondary">
                {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className={`w-14 h-7 rounded-full p-1 transition-colors duration-200 flex items-center ${
              theme === 'dark' ? 'bg-primary-blue justify-end' : 'bg-gray-200 dark:bg-gray-700 justify-start'
            }`}
          >
            <div className="w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center">
              {theme === 'dark' ? <Moon className="w-3 h-3 text-primary-blue" /> : <Sun className="w-3 h-3 text-amber-500" />}
            </div>
          </button>
        </div>

        {/* 4. Help Center */}
        <button
          onClick={() => setActiveModal('help')}
          className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-app-text">
              Help Center
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-app-text-secondary group-hover:text-app-text transition-colors" />
        </button>

        {/* 5. Contact */}
        <button
          onClick={() => setActiveModal('contact')}
          className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors group"
        >
          <div className="flex items-center space-x-4">
            <div className="w-11 h-11 rounded-2xl bg-cyan-50 dark:bg-cyan-950/40 text-cyan-500 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold text-app-text">
              Contact
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-app-text-secondary group-hover:text-app-text transition-colors" />
        </button>

        {/* 6. Replay Opening Logo Screen */}
        {onReplaySplash && (
          <button
            onClick={onReplaySplash}
            className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors group"
          >
            <div className="flex items-center space-x-4">
              <div className="w-11 h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-500 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="text-left">
                <span className="text-sm font-bold text-app-text block">
                  Replay App Opening
                </span>
                <span className="text-[11px] font-medium text-app-text-secondary">
                  BizPulse glowing pulse animation
                </span>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-app-text-secondary group-hover:text-app-text transition-colors" />
          </button>
        )}

        {/* 7. Logout */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-4 rounded-2xl hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-colors group text-rose-500"
        >
          <div className="flex items-center space-x-4">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-500 flex items-center justify-center shrink-0">
              <LogOut className="w-5 h-5" />
            </div>
            <span className="text-sm font-bold">
              Logout
            </span>
          </div>
          <ChevronRight className="w-4 h-4 text-rose-400" />
        </button>
      </div>

      {/* MODALS */}
      {activeModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-app-surface rounded-3xl w-full max-w-sm p-6 shadow-2xl border border-app-border text-app-text animate-in zoom-in-95">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-app-border">
              <h3 className="font-bold text-base">
                {activeModal === 'privacy' && 'Privacy Policy'}
                {activeModal === 'help' && 'Help Center'}
                {activeModal === 'contact' && 'Contact Support'}
              </h3>
              <button onClick={() => setActiveModal(null)} className="p-1.5 rounded-full text-app-text-secondary hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {activeModal === 'privacy' && (
              <div className="text-xs font-medium text-app-text-secondary space-y-3 max-h-60 overflow-y-auto">
                <p>BizPulse ensures end-to-end client confidentiality for all receipt processing, ledger entries, and accounting records.</p>
                <p>No financial credentials or banking PINs are ever stored in unencrypted format.</p>
                <p>Exports generated for QuickBooks and Tally comply strictly with RFC 4180 CSV standard.</p>
              </div>
            )}

            {activeModal === 'help' && (
              <div className="text-xs font-medium text-app-text-secondary space-y-4">
                <p>Have questions about scanning receipts, managing virtual cards, or exporting accounting data?</p>
                <button
                  onClick={() => {
                    setActiveModal(null);
                    navigate('/chat');
                  }}
                  className="w-full py-3.5 bg-primary-blue text-white rounded-xl font-bold shadow-sm"
                >
                  Open AI Chat Assistant
                </button>
              </div>
            )}

            {activeModal === 'contact' && (
              <div className="text-xs font-medium text-app-text-secondary space-y-3">
                <p>Email: <span className="font-bold text-app-text block mt-0.5">support@bizpulse.app</span></p>
                <p>WhatsApp Hotline: <span className="font-bold text-app-text block mt-0.5">+62 812-345-6789</span></p>
                <p>Live WebSocket Server: <span className="font-bold text-emerald-500 block mt-0.5">Connected & Synced</span></p>
              </div>
            )}

            <button
              onClick={() => setActiveModal(null)}
              className="w-full py-3 bg-app-bg text-app-text border border-app-border hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl font-bold text-xs mt-6 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
