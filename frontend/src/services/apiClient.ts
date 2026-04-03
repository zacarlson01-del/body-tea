type SignupPayload = {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  phone?: string;
  gender?: string;
  date_of_birth?: string;
  affiliated_authorities?: string;
  postal_code?: string;
  escrow_deposit_amount?: number;
  duration_days?: number;
  personal_item?: string;
};

type SigninPayload = {
  username_or_email: string;
  password: string;
};

const API_BASE = '/api/auth';

let accessToken: string | null = null;
let refreshToken: string | null = null;

function buildHeaders(withAuth = false) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (withAuth && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

async function handleResponse(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(body.error || 'API request failed');
  }
  return body;
}

async function apiPost(path: string, data: any, auth = false) {
  return handleResponse(
    await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: buildHeaders(auth),
      credentials: 'include',
      body: JSON.stringify(data),
    }),
  );
}

async function apiGet(path: string, auth = false) {
  return handleResponse(
    await fetch(`${API_BASE}${path}`, {
      method: 'GET',
      headers: buildHeaders(auth),
      credentials: 'include',
    }),
  );
}

function setTokens(tokens: { accessToken: string; refreshToken: string }) {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
  return tokens;
}

export const authService = {
  signup: async (payload: SignupPayload) => {
    const res = await apiPost('/signup', payload);
    accessToken = res.accessToken; // refreshToken is now in cookie
    return res;
  },

  signin: async (payload: SigninPayload) => {
    const res = await apiPost('/signin', payload);
    accessToken = res.accessToken; // refreshToken is now in cookie
    return res;
  },

  refreshToken: async () => {
    // No need to send refreshToken in body - it's in the cookie
    const res = await apiPost('/refresh-token', {});
    accessToken = res.accessToken; // refreshToken is now in cookie
    return res;
  },

  getCurrentUser: async () => {
    try {
      return await apiGet('/me', true);
    } catch (err) {
      if (err instanceof Error && (err.message.includes('401') || err.message.includes('Invalid')) ) {
        await authService.refreshToken();
        return apiGet('/me', true);
      }
      throw err;
    }
  },

  logout: async () => {
    await apiPost('/logout', {});
    accessToken = null;
    return;
  },
};

export type { SignupPayload, SigninPayload };

export default authService;
