import { apiGet, apiPost } from '@/lib/api/client';
import { demoUser, isDemoSession } from '@/lib/demo';
import type { LoginRequest, RegisterRequest, TokenResponse } from '@/types/auth';
import type { User } from '@/types/user';

const DEMO_TOKENS: TokenResponse = {
  access_token: 'uppping.demo.access',
  refresh_token: 'uppping.demo.refresh',
  token_type: 'bearer',
};

export async function loginRequest(body: LoginRequest): Promise<TokenResponse> {
  if (isDemoSession()) {
    void body;
    return DEMO_TOKENS;
  }
  return apiPost<TokenResponse>('/auth/login', body, { auth: false });
}

export async function registerRequest(body: RegisterRequest): Promise<TokenResponse> {
  if (isDemoSession()) {
    void body;
    return DEMO_TOKENS;
  }
  return apiPost<TokenResponse>('/auth/register', body, { auth: false });
}

export async function meRequest(): Promise<User> {
  if (isDemoSession()) {
    return demoUser();
  }
  return apiGet<User>('/me');
}