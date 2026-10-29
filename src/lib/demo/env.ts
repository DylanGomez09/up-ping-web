import { IS_DEMO_ENABLED } from '@/lib/config';
import { useAuthStore } from '@/store/authStore';

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
  return useAuthStore.getState().user?.email === DEMO_EMAIL;
}

export { DEMO_EMAIL, DEMO_PASSWORD };
