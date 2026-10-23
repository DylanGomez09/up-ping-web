import { IS_DEMO_ENABLED } from '@/lib/config';

const DEMO_EMAIL = 'demo@uppping.dev';
const DEMO_PASSWORD = 'demo1234';

/**
 * True when demo mode is compiled in (VITE_DEMO_MODE=true).
 *
 * Demo mode lets you click "Enter demo" on the Login screen, AND is also active
 * automatically while a demo session is signed in.
 */
export function isDemoEnabled(): boolean {
  return IS_DEMO_ENABLED;
}

/** True while the signed-in session is the demo user. */
export function isDemoSession(): boolean {
  if (!IS_DEMO_ENABLED) {
    return false;
  }
  try {
    const raw = localStorage.getItem('uppping.auth');
    if (!raw) {
      return false;
    }
    const parsed = JSON.parse(raw) as {
      state?: { user?: { email?: string } | null };
    };
    return parsed?.state?.user?.email === DEMO_EMAIL;
  } catch {
    return false;
  }
}

export { DEMO_EMAIL, DEMO_PASSWORD };