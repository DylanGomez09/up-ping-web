import { apiDelete, apiGet, apiPost } from '@/lib/api/client';
import { API_URL } from '@/lib/config';
import { getAccessToken } from '@/store/authStore.selectors';
import { useAuthStore } from '@/store/authStore';
import {
  demoDeleteTest,
  demoExportCsv,
  demoSaveTest,
  demoTestsPage,
  isDemoSession,
} from '@/lib/demo';
import type { CursorPage } from '@/types/api';
import type { TestResult } from '@/types/test';

export async function getTests(cursor?: string | null): Promise<CursorPage<TestResult>> {
  if (isDemoSession()) {
    return demoTestsPage(cursor);
  }
  const query = cursor ? `?cursor=${encodeURIComponent(cursor)}` : '';
  return apiGet<CursorPage<TestResult>>(`/tests${query}`);
}

export async function saveTest(test: TestResult): Promise<TestResult> {
  if (isDemoSession()) {
    return demoSaveTest(test);
  }
  return apiPost<TestResult>('/tests', test);
}

export async function deleteTest(id: string): Promise<unknown> {
  if (isDemoSession()) {
    demoDeleteTest(id);
    return { ok: true };
  }
  return apiDelete<unknown>(`/tests/${encodeURIComponent(id)}`);
}

async function getAccessTokenOrThrow(): Promise<string> {
  const token = getAccessToken();
  if (!token) {
    // Force session teardown so the app redirects to login.
    useAuthStore.getState().logout();
    throw new Error('Not signed in');
  }
  return token;
}

/** Fetches the CSV export body. Callers decide how to deliver it. */
export async function exportTests(): Promise<string> {
  if (isDemoSession()) {
    return demoExportCsv();
  }
  const token = await getAccessTokenOrThrow();
  const res = await fetch(`${API_URL}/tests/export`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Export failed (${res.status})`);
  }
  return res.text();
}