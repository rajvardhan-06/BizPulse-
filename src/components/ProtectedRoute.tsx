import React, { useEffect } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../authStore';
import { useStore } from '../store';
import { BizPulseLogo } from './BizPulseLogo';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isInitializing, user, token } = useAuthStore();
  const { switchUserContext, activeUserId } = useStore();
  const location = useLocation();

  // Keep business data isolated to the authenticated user ID
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      if (activeUserId !== user.id) {
        switchUserContext(user.id, token);
      }
    } else if (!isAuthenticated && activeUserId !== null) {
      switchUserContext(null);
    }
  }, [isAuthenticated, user?.id, activeUserId, token, switchUserContext]);

  if (isInitializing) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F6F9FC] dark:bg-[#0B132B] text-[#102A43] dark:text-slate-100">
        <div className="flex flex-col items-center space-y-4">
          <BizPulseLogo size="md" />
          <div className="flex items-center space-x-2 text-xs text-[#627D98] dark:text-slate-400 font-medium">
            <div className="w-4 h-4 border-2 border-[#1677FF]/30 border-t-[#1677FF] rounded-full animate-spin" />
            <span>Securing business workspace...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to onboarding if not yet completed and not already on /onboarding
  if (user && !user.onboardingCompleted && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Redirect to dashboard if onboarding is already completed and user tries to access /onboarding
  if (user && user.onboardingCompleted && location.pathname === '/onboarding') {
    return <Navigate to="/" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}

