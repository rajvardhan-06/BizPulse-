import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Home,
  BarChart2,
  Camera, 
  ReceiptText, 
  MessageSquareQuote, 
  Package, 
  Target, 
  TrendingUp, 
  Store, 
  FileText, 
  CreditCard,
  Sun, 
  Moon, 
  LogOut,
  LayoutGrid,
  X,
  Settings,
  User,
  Sparkles,
  ChevronRight,
  Plus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useStore } from '../store';
import { useAuthStore } from '../authStore';
import BizPulseLogo from './BizPulseLogo';
import QuickActionSheet from './fintech/QuickActionSheet';
import TransferModal from './fintech/TransferModal';
import RequestQRModal from './fintech/RequestQRModal';
import BillPayModal from './fintech/BillPayModal';
import TopUpModal from './fintech/TopUpModal';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme, switchUserContext } = useStore();
  const { user, logout } = useAuthStore();

  const [isToolsOpen, setIsToolsOpen] = useState(false);
  const [isQuickActionOpen, setIsQuickActionOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [isRequestOpen, setIsRequestOpen] = useState(false);
  const [isBillPayOpen, setIsBillPayOpen] = useState(false);
  const [isTopUpOpen, setIsTopUpOpen] = useState(false);

  // Automatic scroll-to-top on route changes
  useEffect(() => {
    const container = document.getElementById('main-scroll-container');
    if (container) {
      container.scrollTo({ top: 0, behavior: 'instant' });
    }
    // Close tools drawer on route change
    setIsToolsOpen(false);
  }, [location.pathname]);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  const handleQuickLogout = async () => {
    await logout();
    await switchUserContext(null);
    navigate('/login');
  };

  // Primary navigation for quick access
  const primaryNav = [
    { to: '/', icon: Home, label: 'Dashboard', exact: true },
    { to: '/activity', icon: ReceiptText, label: 'Activity & Ledger', aliases: ['/ledger'] },
    { to: '/insights', icon: BarChart2, label: 'Insights & Stats', aliases: ['/statistic'] },
    { to: '/chat', icon: MessageSquareQuote, label: 'AI Assistant', badge: 'AI' },
  ];

  // Business operations suite
  const businessTools = [
    { to: '/scan', icon: Camera, label: 'Scan Receipt', desc: 'OCR digitization' },
    { to: '/inventory', icon: Package, label: 'Smart Inventory', desc: 'Stock tracking' },
    { to: '/budget', icon: Target, label: 'Budgets', desc: 'Spending targets' },
    { to: '/prices', icon: TrendingUp, label: 'Price Trends', desc: 'Cost fluctuations' },
    { to: '/suppliers', icon: Store, label: 'Suppliers', desc: 'Vendor directory' },
    { to: '/reports', icon: FileText, label: 'Reports & Export', desc: 'Financial records' },
    { to: '/wallet', icon: CreditCard, label: 'Wallet & Cards', desc: 'Cards & balances' },
  ];

  const systemNav = [
    { to: '/account', icon: Settings, label: 'Settings & Profile' },
  ];

  const initials = (user?.fullName || 'Business User')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const isCurrentActive = (to: string, aliases?: string[]) => {
    if (location.pathname === to) return true;
    if (aliases && aliases.includes(location.pathname)) return true;
    return false;
  };

  const isChatRoute = location.pathname === '/chat';

  return (
    <div className="flex h-full w-full bg-app-bg text-app-text overflow-hidden font-sans select-none md:select-auto transition-colors duration-200">
      
      {/* 1. DESKTOP MINIMALIST SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-app-surface border-r border-app-border text-app-text shrink-0 z-30 transition-colors duration-200">
        {/* Brand Header */}
        <div className="p-5 flex items-center justify-between border-b border-app-border/60">
          <Link to="/" className="flex items-center space-x-3 group">
            <BizPulseLogo size="sm" animated={false} />
            <div>
              <span className="font-bold text-base text-app-text block leading-tight tracking-tight group-hover:text-primary-blue transition-colors">
                BizPulse
              </span>
              <span className="text-[10px] uppercase font-semibold tracking-wider text-app-text-secondary">
                Financial Network
              </span>
            </div>
          </Link>
        </div>

        {/* Quick Scan Action Button */}
        <div className="px-4 pt-4 pb-2">
          <button
            onClick={() => navigate('/scan')}
            className="w-full flex items-center justify-center space-x-2 bg-primary-blue hover:bg-blue-600 text-white py-2.5 px-4 rounded-xl text-xs font-semibold shadow-xs hover:shadow-sm transition-all active:scale-[0.98]"
          >
            <Camera className="w-4 h-4" />
            <span>Scan Receipt</span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 px-3 space-y-6 overflow-y-auto scrollbar-hide py-3">
          {/* Main Group */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-app-text-secondary/70 px-3 pb-1.5">
              Core
            </div>
            <div className="space-y-1">
              {primaryNav.map(({ to, icon: Icon, label, badge, aliases }) => {
                const active = isCurrentActive(to, aliases);
                return (
                  <NavLink
                    key={to}
                    to={to}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all',
                      active
                        ? 'bg-primary-blue text-white shadow-xs font-semibold'
                        : 'text-app-text-secondary hover:text-app-text hover:bg-app-bg'
                    )}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                      <span>{label}</span>
                    </div>
                    {badge && (
                      <span className={cn(
                        "text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full tracking-wide",
                        active ? "bg-white/20 text-white" : "bg-primary-blue/10 text-primary-blue"
                      )}>
                        {badge}
                      </span>
                    )}
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* Business Tools Group */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-app-text-secondary/70 px-3 pb-1.5">
              Business Suite
            </div>
            <div className="space-y-1">
              {businessTools.map(({ to, icon: Icon, label }) => {
                const active = location.pathname === to;
                return (
                  <NavLink
                    key={to}
                    to={to}
                    className={cn(
                      'flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                      active
                        ? 'bg-primary-blue text-white shadow-xs font-semibold'
                        : 'text-app-text-secondary hover:text-app-text hover:bg-app-bg'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                    <span>{label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>

          {/* System Navigation */}
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-app-text-secondary/70 px-3 pb-1.5">
              System
            </div>
            <div className="space-y-1">
              {systemNav.map(({ to, icon: Icon, label }) => {
                const active = location.pathname === to;
                return (
                  <NavLink
                    key={to}
                    to={to}
                    className={cn(
                      'flex items-center space-x-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all',
                      active
                        ? 'bg-primary-blue text-white shadow-xs font-semibold'
                        : 'text-app-text-secondary hover:text-app-text hover:bg-app-bg'
                    )}
                  >
                    <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
                    <span>{label}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </nav>
        
        {/* Desktop Sidebar Footer: Theme & User Badge */}
        <div className="p-3 border-t border-app-border/80 space-y-2">
          {/* Quick Theme Switch */}
          <button 
            onClick={toggleTheme}
            className="flex w-full items-center justify-between px-3 py-2 rounded-lg text-xs font-medium text-app-text-secondary hover:text-app-text hover:bg-app-bg transition-colors"
          >
            <div className="flex items-center space-x-2">
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
            </div>
            <span className="text-[10px] text-app-text-secondary/70">Toggle</span>
          </button>

          {/* User Account Capsule */}
          {user && (
            <div className="p-2 rounded-xl bg-app-bg border border-app-border/60 flex items-center justify-between">
              <Link to="/profile" className="flex items-center space-x-2.5 min-w-0 flex-1 hover:opacity-85 transition-opacity">
                <div className="w-8 h-8 rounded-full bg-primary-blue text-white text-xs font-bold flex items-center justify-center shrink-0">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-semibold text-app-text truncate">{user.fullName}</div>
                  <div className="text-[10px] text-app-text-secondary truncate">{user.businessProfile?.businessName || user.email}</div>
                </div>
              </Link>
              <button
                onClick={handleQuickLogout}
                title="Log Out"
                className="p-1.5 text-app-text-secondary hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-colors ml-1"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* 2. MAIN APPLICATION VIEWPORT CONTAINER */}
      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full relative overflow-hidden">
        
        {/* Mobile Minimalist Top Bar (Stable shrink-0 header) */}
        <header className="md:hidden shrink-0 flex items-center justify-between px-4 py-3 bg-app-surface/95 backdrop-blur-md border-b border-app-border z-30 transition-colors">
          <Link to="/" className="flex items-center space-x-2.5">
            <BizPulseLogo size="sm" showText={false} animated={false} />
            <span className="font-bold text-base text-app-text tracking-tight">
              BizPulse
            </span>
          </Link>

          <div className="flex items-center space-x-1.5">
            {/* Quick AI Assistant shortcut */}
            <Link
              to="/chat"
              className={cn(
                "p-2 rounded-xl text-app-text-secondary hover:text-primary-blue hover:bg-app-bg transition-colors relative",
                location.pathname === '/chat' && "text-primary-blue bg-primary-blue/10"
              )}
              title="AI Assistant"
            >
              <Sparkles className="w-4 h-4" />
            </Link>

            {/* Quick Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-app-text-secondary hover:text-app-text hover:bg-app-bg transition-colors"
              title="Toggle Theme"
            >
              {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
            </button>

            {/* Profile Avatar link */}
            <Link
              to="/profile"
              className="w-7 h-7 rounded-full bg-primary-blue text-white text-[11px] font-bold flex items-center justify-center shrink-0 ml-1 shadow-xs"
              title="Profile"
            >
              {initials}
            </Link>
          </div>
        </header>

        {/* Primary Scrollable Viewport (Outlet) */}
        <main
          id="main-scroll-container"
          className={cn(
            "flex-1 min-h-0 w-full relative",
            isChatRoute ? "overflow-hidden" : "overflow-y-auto overflow-x-hidden"
          )}
        >
          <Outlet />
        </main>

        {/* 3. MOBILE MINIMALIST BOTTOM NAVIGATION (Pinned shrink-0 bar) */}
        <nav className="md:hidden shrink-0 z-40 bg-app-surface/95 backdrop-blur-md border-t border-app-border pb-safe">
          <div className="flex items-center justify-around px-2 py-1.5">
            
            {/* 1. Home */}
            <NavLink
              to="/"
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all',
                  isActive ? 'text-primary-blue' : 'text-app-text-secondary hover:text-app-text'
                )
              }
            >
              <Home className="w-5 h-5 mb-0.5" strokeWidth={location.pathname === '/' ? 2.4 : 1.8} />
              <span className="text-[10px] font-medium tracking-tight">Home</span>
            </NavLink>

            {/* 2. Activity / Ledger */}
            <NavLink
              to="/activity"
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all',
                  isActive || location.pathname === '/ledger' ? 'text-primary-blue' : 'text-app-text-secondary hover:text-app-text'
                )
              }
            >
              <ReceiptText className="w-5 h-5 mb-0.5" strokeWidth={isCurrentActive('/activity', ['/ledger']) ? 2.4 : 1.8} />
              <span className="text-[10px] font-medium tracking-tight">Activity</span>
            </NavLink>

            {/* 3. CENTER MINIMALIST SCAN BUTTON */}
            <button
              onClick={() => navigate('/scan')}
              className={cn(
                "w-11 h-11 rounded-full flex items-center justify-center shadow-md transition-all active:scale-95",
                location.pathname === '/scan' 
                  ? "bg-brand-teal text-white shadow-teal-500/25 ring-2 ring-brand-teal ring-offset-2 ring-offset-app-surface"
                  : "bg-primary-blue hover:bg-blue-600 text-white shadow-blue-500/20"
              )}
              title="Scan Receipt"
            >
              <Camera className="w-5 h-5" />
            </button>

            {/* 4. Insights / Stats */}
            <NavLink
              to="/insights"
              className={({ isActive }) =>
                cn(
                  'flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all',
                  isActive || location.pathname === '/statistic' ? 'text-primary-blue' : 'text-app-text-secondary hover:text-app-text'
                )
              }
            >
              <BarChart2 className="w-5 h-5 mb-0.5" strokeWidth={isCurrentActive('/insights', ['/statistic']) ? 2.4 : 1.8} />
              <span className="text-[10px] font-medium tracking-tight">Insights</span>
            </NavLink>

            {/* 5. More / Tools Sheet Trigger */}
            <button
              onClick={() => setIsToolsOpen(true)}
              className={cn(
                'flex flex-col items-center justify-center w-14 py-1 rounded-xl transition-all',
                isToolsOpen || ['/inventory', '/budget', '/prices', '/suppliers', '/reports', '/wallet', '/account'].includes(location.pathname)
                  ? 'text-primary-blue'
                  : 'text-app-text-secondary hover:text-app-text'
              )}
            >
              <LayoutGrid className="w-5 h-5 mb-0.5" strokeWidth={1.8} />
              <span className="text-[10px] font-medium tracking-tight">Tools</span>
            </button>

          </div>
        </nav>
      </div>

      {/* 4. MOBILE TOOLS & SERVICES DRAWER / SHEET */}
      {isToolsOpen && (
        <div className="fixed inset-0 z-[100] md:hidden flex flex-col justify-end animate-in fade-in duration-200">
          {/* Backdrop */}
          <div 
            onClick={() => setIsToolsOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" 
          />

          {/* Slide-up Sheet */}
          <div className="relative w-full max-h-[85vh] bg-app-surface border-t border-app-border rounded-t-3xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-200 pb-safe">
            
            {/* Sheet Handle & Header */}
            <div className="pt-3 pb-4 px-6 border-b border-app-border/60">
              <div className="w-12 h-1 bg-app-border rounded-full mx-auto mb-3" />
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-app-text">Business Suite & Tools</h2>
                  <p className="text-xs text-app-text-secondary">Quick access to all BizPulse modules</p>
                </div>
                <button
                  onClick={() => setIsToolsOpen(false)}
                  className="p-2 rounded-full text-app-text-secondary hover:text-app-text hover:bg-app-bg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Tools Grid */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              
              {/* Primary Highlights Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    setIsToolsOpen(false);
                    navigate('/chat');
                  }}
                  className="p-3.5 rounded-2xl bg-gradient-to-br from-primary-blue/10 to-indigo-500/10 border border-primary-blue/20 text-left flex items-start space-x-3 active:scale-[0.98] transition-all"
                >
                  <div className="p-2.5 rounded-xl bg-primary-blue text-white shadow-xs shrink-0">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-app-text">AI Assistant</div>
                    <div className="text-[10px] text-app-text-secondary">Receipt chat & insights</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    setIsToolsOpen(false);
                    navigate('/wallet');
                  }}
                  className="p-3.5 rounded-2xl bg-gradient-to-br from-brand-teal/10 to-emerald-500/10 border border-brand-teal/20 text-left flex items-start space-x-3 active:scale-[0.98] transition-all"
                >
                  <div className="p-2.5 rounded-xl bg-brand-teal text-white shadow-xs shrink-0">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-app-text">Wallet & Cards</div>
                    <div className="text-[10px] text-app-text-secondary">Balances & virtual card</div>
                  </div>
                </button>
              </div>

              {/* Comprehensive List */}
              <div className="bg-app-bg rounded-2xl p-1.5 border border-app-border space-y-0.5">
                {[
                  ...businessTools,
                  { to: '/account', icon: Settings, label: 'Settings & Business Profile', desc: 'Manage organization' },
                  { to: '/profile', icon: User, label: 'User Profile', desc: 'Account credentials' },
                ].map(({ to, icon: Icon, label, desc }) => {
                  const active = location.pathname === to;
                  return (
                    <button
                      key={to}
                      onClick={() => {
                        setIsToolsOpen(false);
                        navigate(to);
                      }}
                      className={cn(
                        "w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors",
                        active 
                          ? "bg-primary-blue text-white" 
                          : "hover:bg-app-surface text-app-text"
                      )}
                    >
                      <div className="flex items-center space-x-3 min-w-0">
                        <div className={cn(
                          "p-2 rounded-lg shrink-0",
                          active ? "bg-white/20 text-white" : "bg-app-surface text-app-text-secondary border border-app-border"
                        )}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-semibold truncate">{label}</div>
                          {desc && (
                            <div className={cn("text-[10px] truncate", active ? "text-white/80" : "text-app-text-secondary")}>
                              {desc}
                            </div>
                          )}
                        </div>
                      </div>
                      <ChevronRight className={cn("w-4 h-4 shrink-0 ml-2", active ? "text-white" : "text-app-text-secondary/50")} />
                    </button>
                  );
                })}
              </div>

              {/* Bottom Quick Controls */}
              <div className="pt-2 flex items-center justify-between px-1">
                <button
                  onClick={toggleTheme}
                  className="flex items-center space-x-2 text-xs font-semibold text-app-text-secondary hover:text-app-text p-2 rounded-lg"
                >
                  {theme === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-500" />}
                  <span>{theme === 'dark' ? 'Dark Theme' : 'Light Theme'}</span>
                </button>

                <button
                  onClick={handleQuickLogout}
                  className="flex items-center space-x-2 text-xs font-semibold text-rose-500 hover:text-rose-600 p-2 rounded-lg"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </div>

            </div>

          </div>
        </div>
      )}

      {/* QUICK ACTIONS MODALS (Preserved for fintech flows) */}
      <QuickActionSheet
        isOpen={isQuickActionOpen}
        onClose={() => setIsQuickActionOpen(false)}
        onOpenTransfer={() => setIsTransferOpen(true)}
        onOpenRequest={() => setIsRequestOpen(true)}
        onOpenTopUp={() => setIsTopUpOpen(true)}
        onOpenBillPay={() => setIsBillPayOpen(true)}
      />

      <TransferModal isOpen={isTransferOpen} onClose={() => setIsTransferOpen(false)} />
      <RequestQRModal isOpen={isRequestOpen} onClose={() => setIsRequestOpen(false)} />
      <BillPayModal isOpen={isBillPayOpen} onClose={() => setIsBillPayOpen(false)} />
      <TopUpModal isOpen={isTopUpOpen} onClose={() => setIsTopUpOpen(false)} />
    </div>
  );
}
