import { apiDelete, apiGet, apiPost } from '@/lib/api/client';
import { API_URL } from '@/lib/config';
import { getAccessToken } from '@/store/authStore.selectors';
import { useAuthStore } from '@/store/authStore';
import { resolveToIp } from '@/lib/utils/resolveTarget';
import type { CursorPage } from '@/types/api';
import type { TestResult } from '@/types/test';

/** Exact wire shape returned by `GET /tests` and `POST /tests`. */
export interface PingTestOut {
  id: string;
  target_ip: string;
  avg_latency_ms: number;
  packets_sent: number;
  packets_received: number;
  loss_percent: number;
  ran_at: string;
  created_at: string;
}

export interface PingTestList {
  items: PingTestOut[];
  total: number;
  limit: number;
  offset: number;
}

/** Exact wire shape expected by `POST /tests`. */
export interface PingTestCreate {
  target_ip: string;
  avg_latency_ms: number;
  packets_sent: number;
  packets_received: number;
  loss_percent: number;
  ran_at: string;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Maps a backend row into the shape the UI renders. */
function fromBackend(out: PingTestOut): TestResult {
  return {
    id: out.id,
    target: out.target_ip,
    started_at: out.ran_at,
    avg_latency_ms: Math.round(out.avg_latency_ms * 10) / 10,
    packet_count: out.packets_sent,
    loss_percent: Math.round(out.loss_percent * 100) / 100,
    // The backend stores aggregates only; per-probe RTTs stay client-side.
    rtts: [],
  };
}

/** Builds the backend payload, resolving hostnames to an IP first. */
async function toBackendCreate(test: TestResult): Promise<PingTestCreate> {
  const sent = Math.max(0, Math.round(test.packet_count));
  const delivered =
    test.rtts.length > 0
      ? test.rtts.filter((sample) => sample.rtt_ms !== null).length
      : Math.round(sent * (1 - clamp(test.loss_percent, 0, 100) / 100));

  const received = clamp(delivered, 0, sent);
  const ranAt = new Date(test.started_at);

  return {
    target_ip: await resolveToIp(test.target),
    avg_latency_ms: Math.max(0, test.avg_latency_ms),
    packets_sent: sent,
    packets_received: received,
    loss_percent: clamp(test.loss_percent, 0, 100),
    ran_at: Number.isNaN(ranAt.getTime())
      ? new Date().toISOString()
      : ranAt.toISOString(),
  };
}

export async function getTests(
  cursor?: string | null,
  limit = 20
): Promise<CursorPage<TestResult>> {
  const offset = cursor ? Math.max(0, Number.parseInt(cursor, 10) || 0) : 0;
  const page = await apiGet<PingTestList>(
    `/tests?limit=${limit}&offset=${offset}`
  );
  const nextOffset = offset + page.items.length;
  const nextCursor =
    page.items.length > 0 && nextOffset < page.total ? String(nextOffset) : null;

  return {
    items: page.items.map(fromBackend),
    next_cursor: nextCursor,
    total: page.total,
  };
}

export async function saveTest(test: TestResult): Promise<TestResult> {
  const payload = await toBackendCreate(test);
  const saved = await apiPost<PingTestOut>('/tests', payload);

  // Keep the local per-probe samples so callers can still chart the run.
  return { ...fromBackend(saved), rtts: test.rtts };
}

export async function deleteTest(id: string): Promise<unknown> {
  return apiDelete<unknown>(`/tests/${encodeURIComponent(id)}`);
}

async function getAccessTokenOrThrow(): Promise<string> {
  const token = getAccessToken();
  if (!token) {
    // Force session teardown so the app redirects to login.
    useAuthStore.getState().logout();
    throw new Error('No has iniciado sesión');
  }
  return token;
}

/** Fetches the CSV export body. Callers decide how to deliver it. */
export async function exportTests(): Promise<string> {
  const token = await getAccessTokenOrThrow();
  const res = await fetch(`${API_URL}/tests/export`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`La exportación falló (${res.status})`);
  }
  return res.text();
}
