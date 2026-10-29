import type { TestResult } from '@/types/test';

/**
 * A guest can run a real test without an account, but saving needs one. The
 * finished run is parked in sessionStorage while the visitor signs in or
 * registers, then the dashboard picks it up and saves it automatically.
 *
 * sessionStorage (not localStorage) is deliberate: the draft belongs to this
 * tab and should not reappear in another window days later.
 */
const STORAGE_KEY = 'uppping.pending-test';

export function savePendingTest(test: TestResult): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(test));
  } catch {
    // Storage can be unavailable (private mode); the save prompt still works,
    // it just cannot survive the redirect.
  }
}

export function readPendingTest(): TestResult | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed: unknown = JSON.parse(raw);
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof (parsed as TestResult).target !== 'string' ||
      !Array.isArray((parsed as TestResult).rtts)
    ) {
      return null;
    }

    return parsed as TestResult;
  } catch {
    return null;
  }
}

export function clearPendingTest(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear.
  }
}
