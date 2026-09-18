import { create } from 'zustand';
import { User, BusinessProfile, UserSettings } from './types/auth';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  initAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  demoLogin: () => Promise<{ success: boolean; error?: string }>;
  signup: (data: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
    businessName?: string;
    phoneNumber?: string;
  }) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ success: boolean; message?: string; resetToken?: string; error?: string }>;
  resetPassword: (payload: { token: string; newPassword: string; confirmPassword: string }) => Promise<{ success: boolean; message?: string; error?: string }>;
  updateProfile: (updates: { fullName?: string; phoneNumber?: string }) => Promise<{ success: boolean; error?: string }>;
  updateBusinessProfile: (updates: Partial<BusinessProfile>) => Promise<{ success: boolean; error?: string }>;
  updateSettings: (updates: Partial<UserSettings>) => Promise<{ success: boolean; error?: string }>;
  changePassword: (payload: { currentPassword: string; newPassword: string; confirmPassword: string }) => Promise<{ success: boolean; error?: string }>;
  completeOnboarding: (data: { businessName?: string; businessType?: string; currency?: string; reportingPeriod?: any }) => Promise<{ success: boolean; error?: string }>;
  deleteAccount: (password: string) => Promise<{ success: boolean; error?: string }>;
  clearError: () => void;
}

const TOKEN_KEY = 'bizpulse_auth_token';

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem(TOKEN_KEY),
  isAuthenticated: false,
  isLoading: true,
  error: null,

  clearError: () => set({ error: null }),

  initAuth: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const res = await fetch('/api/auth/me', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      if (res.ok) {
        const data = await res.json();
        set({ user: data.user, token, isAuthenticated: true, isLoading: false });
      } else {
        localStorage.removeItem(TOKEN_KEY);
        set({ user: null, token: null, isAuthenticated: false, isLoading: false });
      }
    } catch (err) {
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await res.json();
      if (!res.ok) {
        set({ isLoading: false, error: data.error || 'Login failed.' });
        return { success: false, error: data.error || 'Login failed.' };
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      return { success: true };
    } catch (err: any) {
      const msg = 'Network error or server unavailable. Please try again.';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  demoLogin: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/demo-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (!res.ok) {
        set({ isLoading: false, error: data.error || 'Demo login failed.' });
        return { success: false, error: data.error || 'Demo login failed.' };
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      return { success: true };
    } catch (err: any) {
      const msg = 'Network error or server unavailable. Please try again.';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  signup: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        set({ isLoading: false, error: data.error || 'Signup failed.' });
        return { success: false, error: data.error || 'Signup failed.' };
      }

      localStorage.setItem(TOKEN_KEY, data.token);
      set({
        user: data.user,
        token: data.token,
        isAuthenticated: true,
        isLoading: false,
        error: null
      });

      return { success: true };
    } catch (err: any) {
      const msg = 'Network error. Please try again.';
      set({ isLoading: false, error: msg });
      return { success: false, error: msg };
    }
  },

  logout: async () => {
    const token = get().token;
    if (token) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
      } catch {
        // ignore logout network errors
      }
    }

    localStorage.removeItem(TOKEN_KEY);
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  forgotPassword: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      set({ isLoading: false });
      return {
        success: res.ok,
        message: data.message,
        resetToken: data.resetToken,
        error: !res.ok ? data.error : undefined
      };
    } catch (err: any) {
      set({ isLoading: false, error: 'Network error. Please try again.' });
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  resetPassword: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      set({ isLoading: false });
      if (!res.ok) {
        return { success: false, error: data.error };
      }
      return { success: true, message: data.message };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, error: 'Network error. Please try again.' };
    }
  },

  updateProfile: async (updates) => {
    const token = get().token;
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      const data = await res.json();
      if (res.ok) {
        set({ user: data.user });
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err: any) {
      return { success: false, error: 'Failed to update profile.' };
    }
  },

  updateBusinessProfile: async (updates) => {
    const token = get().token;
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      const res = await fetch('/api/auth/business-profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      const data = await res.json();
      if (res.ok) {
        set({ user: data.user });
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err: any) {
      return { success: false, error: 'Failed to update business profile.' };
    }
  },

  updateSettings: async (updates) => {
    const token = get().token;
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      const res = await fetch('/api/auth/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(updates)
      });

      const data = await res.json();
      if (res.ok) {
        set({ user: data.user });
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err: any) {
      return { success: false, error: 'Failed to update settings.' };
    }
  },

  changePassword: async (payload) => {
    const token = get().token;
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err: any) {
      return { success: false, error: 'Failed to change password.' };
    }
  },

  completeOnboarding: async (data) => {
    const token = get().token;
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      const res = await fetch('/api/auth/onboarding/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });

      const resData = await res.json();
      if (res.ok) {
        set({ user: resData.user });
        return { success: true };
      } else {
        return { success: false, error: resData.error };
      }
    } catch (err: any) {
      return { success: false, error: 'Failed to complete onboarding.' };
    }
  },

  deleteAccount: async (password) => {
    const token = get().token;
    if (!token) return { success: false, error: 'Not authenticated' };

    try {
      const res = await fetch('/api/auth/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ password })
      });

      const data = await res.json();
      if (res.ok) {
        localStorage.removeItem(TOKEN_KEY);
        set({ user: null, token: null, isAuthenticated: false });
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (err: any) {
      return { success: false, error: 'Failed to delete account.' };
    }
  }
}));
