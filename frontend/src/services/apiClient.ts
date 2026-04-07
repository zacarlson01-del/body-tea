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
  profile_picture?: File;
};

type SigninPayload = {
  username_or_email: string;
  password: string;
};

type SupportPayload = {
  name: string;
  email: string;
  message: string;
};

type ForgotPasswordPayload = {
  email: string;
};

type ResetPasswordPayload = {
  token: string;
  new_password: string;
};

const API_BASE = process.env.REACT_APP_API_URL || '/api/auth';

const netlifyFunctionRoutes: Record<string, string> = {
  '/signup': '/.netlify/functions/auth-signup',
  '/signin': '/.netlify/functions/auth-signin',
  '/refresh-token': '/.netlify/functions/auth-refresh-token',
  '/me': '/.netlify/functions/auth-me',
  '/logout': '/.netlify/functions/auth-logout',
  '/support/create': '/.netlify/functions/support-create',
  '/forgot-password': '/.netlify/functions/auth-forgot-password',
  '/profile-picture': '/.netlify/functions/profile-picture',
  '/validate-reset-token': '/.netlify/functions/auth-validate-reset-token',
  '/reset-password': '/.netlify/functions/auth-reset-password',
};

let accessToken: string | null = null;

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read profile picture'));
    reader.readAsDataURL(file);
  });
}

function buildHeaders(withAuth = false, isJson = true) {
  const headers: Record<string, string> = {};
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  if (withAuth && accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }
  return headers;
}

async function handleResponse(response: Response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const validationMessage = Array.isArray(body.errors) && body.errors.length > 0
      ? body.errors[0]?.msg || body.errors[0]?.message
      : null;
    throw new Error(
      validationMessage ||
      body.error ||
      body.message ||
      `Request failed (${response.status})`,
    );
  }
  return body;
}

function getPrimaryUrl(path: string) {
  return `${API_BASE}${path}`;
}

function getNetlifyFallbackUrl(path: string) {
  return netlifyFunctionRoutes[path] || null;
}

async function requestWithFallback(
  method: 'POST' | 'GET',
  path: string,
  body?: BodyInit,
  auth = false,
  isJson = true,
) {
  const primaryUrl = getPrimaryUrl(path);
  const fallbackUrl = getNetlifyFallbackUrl(path);

  const requestInit: RequestInit = {
    method,
    headers: buildHeaders(auth, isJson),
    credentials: 'include',
  };

  if (body !== undefined) {
    requestInit.body = body;
  }

  const response = await fetch(primaryUrl, requestInit);

  // Some Netlify setups can return 403 on /api/auth redirects.
  // If that happens, retry directly against the serverless function route.
  if (response.status === 403 && fallbackUrl && fallbackUrl !== primaryUrl) {
    const fallbackResponse = await fetch(fallbackUrl, requestInit);
    return handleResponse(fallbackResponse);
  }

  return handleResponse(response);
}

async function apiPost(path: string, data: FormData | Record<string, unknown>, auth = false, isJson = true) {
  const body: BodyInit = isJson ? JSON.stringify(data) : (data as FormData);
  try {
    return await requestWithFallback('POST', path, body, auth, isJson);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Cannot reach API server');
  }
}

async function apiGet(path: string, auth = false) {
  try {
    return await requestWithFallback('GET', path, undefined, auth);
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Cannot reach API server');
  }
}

export const authService = {
  signup: async (payload: SignupPayload) => {
    const { profile_picture, ...jsonPayload } = payload;
    const pictureDataUrl = profile_picture ? await fileToDataUrl(profile_picture) : undefined;
    const signupPayload = pictureDataUrl
      ? { ...jsonPayload, profile_picture_data_url: pictureDataUrl }
      : jsonPayload;
    const finalRes = await apiPost('/signup', signupPayload);
    accessToken = finalRes.accessToken; // refreshToken is now in cookie
    return finalRes;
  },

  requestPasswordReset: async (payload: ForgotPasswordPayload) => {
    return apiPost('/forgot-password', payload);
  },

  validateResetToken: async (token: string) => {
    const encoded = encodeURIComponent(token);
    return apiGet(`/validate-reset-token?token=${encoded}`);
  },

  resetPassword: async (payload: ResetPasswordPayload) => {
    return apiPost('/reset-password', payload);
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

  createSupportMessage: async (payload: SupportPayload) => {
    return apiPost('/support/create', payload, true);
  },
};

export type { SignupPayload, SigninPayload, SupportPayload, ForgotPasswordPayload, ResetPasswordPayload };

export default authService;
