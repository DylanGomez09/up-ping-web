import { apiGet, apiPost } from '@/lib/api/client';
import { demoUser, isDemoSession } from '@/lib/demo';
import type { LoginRequest, RegisterRequest, TokenResponse } from '@/types/auth';
import type { User } from '@/types/user';

/** Wire shape of `UserOut` / `MeOut` from the FastAPI backend. */
interface UserResponse {
  id: string;
  email: string;
  display_name: string;
  license_tier: string;
  created_at: string;
  total_tests?: number;
}

function mapUser(raw: UserResponse): User {
  return {
    id: raw.id,
    email: raw.email,
    name: raw.display_name,
    license_tier: raw.license_tier,
    created_at: raw.created_at,
    total_tests: raw.total_tests,
  };
}

export async function loginRequest(body: LoginRequest): Promise<TokenResponse> {
  return apiPost<TokenResponse>('/auth/login', body, { auth: false });
}

/**
 * Registration creates the account and returns the user profile — it does not
 * issue tokens. Callers sign in with the same credentials afterwards.
 */
export async function registerRequest(body: RegisterRequest): Promise<User> {
  const raw = await apiPost<UserResponse>('/auth/register', body, {
    auth: false,
  });
  return mapUser(raw);
}

export async function meRequest(): Promise<User> {
  if (isDemoSession()) {
    return demoUser();
  }
  const raw = await apiGet<UserResponse>('/me');
  return mapUser(raw);
}

/** Best-effort server-side revocation; local state is cleared by the caller. */
export async function logoutRequest(refreshToken: string): Promise<void> {
  if (isDemoSession()) {
    return;
  }
  await apiPost<void>('/auth/logout', { refresh_token: refreshToken }, {
    auth: false,
  });
}
