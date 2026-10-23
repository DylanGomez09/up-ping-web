import { DEMO_EMAIL } from '@/lib/demo/env';
import type { User } from '@/types/user';

const DEMO_USER_ID = 'demo-user-0001';

export function demoUser(): User {
  return {
    id: DEMO_USER_ID,
    email: DEMO_EMAIL,
    name: 'Demo Workshop',
    license_tier: 'professional',
    created_at: '2026-01-15T09:30:00.000Z',
  };
}