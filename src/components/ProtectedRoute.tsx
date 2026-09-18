import React, { useEffect } from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuthStore } from '../authStore';
import { useStore } from '../store';
import { Sparkles } from 'lucide-react';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, token } = useAuthStore();
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

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F4FAF9] dark:bg-gray-950 text-[#0B2E33] dark:text-gray-100">
        <div className="relative flex items-center justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#028090] to-[#02C39A] animate-pulse flex items-center justify-center shadow-lg">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-xl font-serif font-bold tracking-tight mb-2 text-[#0B2E33] dark:text-gray-100">BizPulse</h2>
        <p className="text-xs text-[#5C7A7D] dark:text-gray-400 font-medium">Securing business workspace...</p>
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

  return children ? <>{children}</> : <Outlet />;
}
