import { create } from 'zustand';
import { authService, SignupPayload, SigninPayload } from '../services/apiClient';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  profile_picture_url?: string;
  affiliated_authorities?: string;
  postal_code?: string;
}

export interface EscrowAccount {
  account_id: string;
  account_status: string;
  escrow_deposit_amount?: number;
  duration_days?: number;
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapToUser(goTrueUser: any): User {
  const meta = goTrueUser.user_metadata || {};
  return {
    id: goTrueUser.id,
    email: goTrueUser.email,
    first_name: meta.first_name || '',
    last_name: meta.last_name || '',
    phone: meta.phone || undefined,
    gender: meta.gender || undefined,
    date_of_birth: meta.date_of_birth || undefined,
    profile_picture_url: meta.avatar_url || undefined,
    affiliated_authorities: meta.affiliated_authorities || undefined,
    postal_code: meta.postal_code || undefined,
  };
}

function mapToEscrow(goTrueUser: any): EscrowAccount | null {
  const escrow = goTrueUser.user_metadata?.escrow_account;
  if (!escrow) return null;
  return {
    account_id: escrow.account_id,
    account_status: escrow.account_status,
    escrow_deposit_amount: escrow.escrow_deposit_amount,
    duration_days: escrow.duration_days,
  };
}

// ─── Store ───────────────────────────────────────────────────────────────────

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
  getCurrentUser: () => void;
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

  /**
   * Registers via Netlify Identity.
   * Netlify sends a confirmation email — user must click it before signing in.
   * To skip confirmation: Netlify dashboard → Identity → Settings → disable "Email confirmation".
   */
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
      const goTrueUser = await authService.signin(payload);
      set({
        user: mapToUser(goTrueUser),
        escrowAccount: mapToEscrow(goTrueUser),
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Invalid email or password';
      set({ error: msg, isLoading: false });
      throw error;
    }
  },

  logout: async () => {
    await authService.logout();
    set({
      user: null,
      escrowAccount: null,
      isAuthenticated: false,
      error: null,
    });
  },

  /**
   * Restores session from GoTrue's local cache on page load.
   * GoTrue persists the session automatically — no manual localStorage needed.
   */
  getCurrentUser: () => {
    const goTrueUser = authService.getCurrentUser();
    if (goTrueUser) {
      set({
        user: mapToUser(goTrueUser),
        escrowAccount: mapToEscrow(goTrueUser),
        isAuthenticated: true,
      });
    }
  },

  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),
}));
