import GoTrue from 'gotrue-js';

// Points to Netlify Identity endpoint on the same origin.
// In production on Netlify this resolves automatically.
// During local dev, run `netlify dev` (not `npm start`) so /.netlify/identity is proxied.
const IDENTITY_URL = `${window.location.origin}/.netlify/identity`;

export const auth = new GoTrue({
  APIUrl: IDENTITY_URL,
  audience: '',
  setCookie: false,
});

// ─── Helpers ────────────────────────────────────────────────────────────────

function generateAccountId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const seg = () =>
    Array.from({ length: 4 }, () =>
      chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  return `ISEA-${seg()}-${seg()}`;
}

// ─── Types ───────────────────────────────────────────────────────────────────

export interface SignupPayload {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  affiliated_authorities?: string;
  postal_code?: string;
  profile_picture?: File;
  escrow_deposit_amount?: number;
  duration_days?: number;
  personal_item?: string;
}

export interface SigninPayload {
  email: string;
  password: string;
}

// ─── Auth service ────────────────────────────────────────────────────────────

export const authService = {
  /**
   * Creates a new Netlify Identity user.
   * All profile fields are stored in user_metadata — visible in Netlify dashboard.
   * Netlify sends a confirmation email; user must click it before signing in
   * (disable this in Netlify → Identity → Settings → "Email confirmation").
   */
  signup: async (payload: SignupPayload) => {
    return auth.signup(payload.email, payload.password, {
      full_name: `${payload.first_name} ${payload.last_name}`,
      first_name: payload.first_name,
      last_name: payload.last_name,
      phone: payload.phone || '',
      gender: payload.gender || '',
      date_of_birth: payload.date_of_birth || '',
      affiliated_authorities: payload.affiliated_authorities || '',
      postal_code: payload.postal_code || '',
      escrow_account: {
        account_id: generateAccountId(),
        account_status: 'pending',
        escrow_deposit_amount: payload.escrow_deposit_amount || 0,
        duration_days: payload.duration_days || 30,
        personal_item: payload.personal_item || '',
      },
    });
  },

  /**
   * Signs in with email + password.
   * Returns the GoTrue User object (which includes user_metadata).
   */
  signin: async (payload: SigninPayload) => {
    return auth.login(payload.email, payload.password, true);
  },

  /** Returns the locally cached GoTrue User, or null if not signed in. */
  getCurrentUser: () => auth.currentUser(),

  /** Signs out the current user. */
  logout: async () => {
    const user = auth.currentUser();
    if (user) await user.logout();
  },

  /**
   * Confirms a user's email after they click the confirmation link.
   * Call this on app load if the URL contains #confirmation_token=...
   */
  confirm: async (token: string) => auth.confirm(token, true),

  /**
   * Sends a password-reset email.
   */
  requestPasswordRecovery: async (email: string) =>
    auth.requestPasswordRecovery(email),
};

export default authService;
