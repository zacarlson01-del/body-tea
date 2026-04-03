import { create } from 'zustand';
import { authService, SignupPayload, SigninPayload } from '../services/apiClient';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  profile_picture_url?: string;
}

export interface EscrowAccount {
  account_id: string;
  account_status: string;
  escrow_deposit_amount?: number;
  duration_days?: number;
}

interface AuthStore {
  user: User | null;
  escrowAccount: EscrowAccount | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  signupSuccess: boolean;

  signup: (payload: SignupPayload) => Promise<void>;
  signin: (payload: SigninPayload) => Promise<void>;
  logout: () => Promise<void>;
  getCurrentUser: () => Promise<void>;
  setError: (error: string | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  escrowAccount: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  signupSuccess: false,

  signup: async (payload: SignupPayload) => {
    set({ isLoading: true, error: null, signupSuccess: false });
    try {
      await authService.signup(payload);
      set({ isLoading: false, signupSuccess: true });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Signup failed';
      set({ error: msg, isLoading: false });
      throw error;
    }
  },

  signin: async (payload: SigninPayload) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.signin(payload);
      set({
        user: res.user,
        escrowAccount: res.escrow_account || null,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Invalid credentials';
      set({ error: msg, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await authService.logout();
    set({ user: null, escrowAccount: null, isAuthenticated: false, error: null });
  },

  getCurrentUser: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await authService.getCurrentUser();
      set({
        user: res.user,
        escrowAccount: res.escrow_account || null,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: unknown) {
      set({ user: null, escrowAccount: null, isAuthenticated: false, isLoading: false });
    }
  },

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
