import { useAuthStore } from '@/store/authStore';
import { API_URL } from '@/lib/config';
import type { TokenResponse } from '@/types/auth';

export class ApiError extends Error {
  readonly status: number;
  readonly payload: unknown;

  constructor(message: string, status: number, payload?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.payload = payload;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  /** Attach the Authorization header. Defaults to true. */
  auth?: boolean;
  /** Internal: already attempted a token refresh for this request. */
  _retried?: boolean;
}

interface RequestSuccess<T> {
  ok: true;
  value: T;
}

interface RequestFailure {
  ok: false;
  error: ApiError;
}

type RequestResult<T> = RequestSuccess<T> | RequestFailure;

/** Shared across concurrent 401s so the refresh endpoint is hit once. */
let refreshInFlight: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (refreshInFlight) {
    return refreshInFlight;
  }

  refreshInFlight = (async () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    if (!refreshToken) {
      throw new ApiError('No hay token de renovación disponible', 401);
    }

    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!res.ok) {
      // Refresh failed: clear the session.
      useAuthStore.getState().logout();
      throw new ApiError('La sesión expiró', res.status);
    }

    const data = (await res.json()) as TokenResponse;
    // The backend rotates the refresh token on every refresh: persist both or
    // the next renewal will be rejected as already-used.
    useAuthStore
      .getState()
      .setTokens(data.access_token, data.refresh_token ?? refreshToken);
    return data.access_token;
  })().finally(() => {
    refreshInFlight = null;
  });

  return refreshInFlight;
}

function buildHeaders(options: RequestOptions): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...options.headers,
  };

  if (options.body !== undefined && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.auth !== false) {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  return headers;
}

function extractErrorMessage(
  status: number,
  payload: unknown,
  fallback: string
): string {
  if (payload && typeof payload === 'object') {
    const p = payload as Record<string, unknown>;
    if (typeof p.detail === 'string') {
      return p.detail;
    }
    if (Array.isArray(p.detail)) {
      const messages = p.detail
        .map((d) =>
          d && typeof d === 'object'
            ? String((d as Record<string, unknown>).msg ?? JSON.stringify(d))
            : String(d)
        )
        .filter(Boolean);
      if (messages.length > 0) {
        return messages.join('\n');
      }
    }
  }
  if (status === 401) {
    return 'No autorizado';
  }
  return fallback;
}

async function rawFetch<T>(
  path: string,
  options: RequestOptions
): Promise<RequestResult<T>> {
  const url = `${API_URL}${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method ?? 'GET',
      headers: buildHeaders(options),
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    return {
      ok: false,
      error: new ApiError('La petición de red falló', 0),
    };
  }

  const isJson = (res.headers.get('content-type') ?? '').includes('application/json');
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (res.ok) {
    return { ok: true, value: payload as T };
  }

  return {
    ok: false,
    error: new ApiError(
      extractErrorMessage(res.status, payload, `La petición falló (${res.status})`),
      res.status,
      payload
    ),
  };
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const attempt = async (opts: RequestOptions): Promise<RequestResult<T>> =>
    rawFetch<T>(path, opts);

  let result = await attempt(options);

  // 401 + auth'd request + not already retried -> try refreshing the token once.
  if (
    result.ok === false &&
    result.error.status === 401 &&
    options.auth !== false &&
    !options._retried &&
    useAuthStore.getState().refreshToken
  ) {
    const originalError = result.error;
    try {
      await refreshAccessToken();
      result = await attempt({ ...options, _retried: true });
    } catch {
      // refreshAccessToken already called logout() on failure.
      return Promise.reject(originalError);
    }
  }

  if (!result.ok) {
    return Promise.reject(result.error);
  }
  return result.value;
}

/** GET convenience wrapper. */
export function apiGet<T>(
  path: string,
  options: Omit<RequestOptions, 'method'> = {}
): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'GET' });
}

/** POST convenience wrapper. */
export function apiPost<T>(
  path: string,
  body?: unknown,
  options: Omit<RequestOptions, 'method' | 'body'> = {}
): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'POST', body });
}

/** DELETE convenience wrapper. */
export function apiDelete<T>(
  path: string,
  options: Omit<RequestOptions, 'method'> = {}
): Promise<T> {
  return apiRequest<T>(path, { ...options, method: 'DELETE' });
}