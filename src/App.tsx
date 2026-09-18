import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useStore } from './store';
import { useAuthStore } from './authStore';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './views/Dashboard';
import Scan from './views/Scan';
import Ledger from './views/Ledger';
import Chat from './views/Chat';
import Inventory from './views/Inventory';
import BudgetView from './views/Budget';
import PriceIntelligence from './views/PriceIntelligence';
import Suppliers from './views/Suppliers';
import Reports from './views/Reports';
import Login from './views/auth/Login';
import Signup from './views/auth/Signup';
import ForgotPassword from './views/auth/ForgotPassword';
import ResetPassword from './views/auth/ResetPassword';
import Onboarding from './views/auth/Onboarding';
import Account from './views/account/Account';
import Statistic from './views/Statistic';
import Wallet from './views/Wallet';
import Profile from './views/Profile';
import OpeningSplashScreen from './components/OpeningSplashScreen';
import { BizPulseLogo } from './components/BizPulseLogo';

// Helper to redirect authenticated users away from Login/Signup back to Dashboard
function PublicAuthOnly({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isInitializing = useAuthStore((state) => state.isInitializing);

  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#F6F9FC] dark:bg-[#0B132B] flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <BizPulseLogo size="md" />
          <div className="w-5 h-5 border-2 border-[#1677FF]/30 border-t-[#1677FF] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const theme = useStore((state) => state.theme);
  const initAuth = useAuthStore((state) => state.initAuth);
  const [showSplash, setShowSplash] = React.useState(true);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <>
      {showSplash && <OpeningSplashScreen onComplete={() => setShowSplash(false)} />}
      <BrowserRouter>
      <Routes>
        {/* Public Authentication Routes */}
        <Route
          path="/login"
          element={
            <PublicAuthOnly>
              <Login />
            </PublicAuthOnly>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicAuthOnly>
              <Signup />
            </PublicAuthOnly>
          }
        />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* Onboarding Flow (Authenticated, but before completing setup) */}
        <Route
          path="/onboarding"
          element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        {/* Protected Core Application Routes */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/insights" element={<Statistic />} />
          <Route path="/statistic" element={<Statistic />} />
          <Route path="/activity" element={<Ledger />} />
          <Route path="/ledger" element={<Ledger />} />
          <Route path="/wallet" element={<Wallet />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/scan" element={<Scan />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/budget" element={<BudgetView />} />
          <Route path="/prices" element={<PriceIntelligence />} />
          <Route path="/suppliers" element={<Suppliers />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/account" element={<Account />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

