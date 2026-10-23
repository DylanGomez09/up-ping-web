import type { TestResult } from '@/types/test';

const STORAGE_KEY = 'uppping.demo.tests';

function seed(): TestResult[] {
  const now = Date.now();
  const targets = [
    '8.8.8.8',
    'router.lan',
    'nas.local',
    '1.1.1.1',
    'printer.lan',
  ];
  const losses = [0, 0, 1.4, 0, 0.6];

  return targets.map((target, i) => {
    const base = 12 + i * 9;
    const packetCount = 20;
    const rtts = Array.from({ length: packetCount }, (_, n) => {
      const lost = n % 7 === 3 && losses[i] > 0;
      return {
        seq: n + 1,
        target,
        rtt_ms: lost ? null : Math.round(base + Math.sin(n / 2.3) * 4 + (n % 3) * 1.4),
        timestamp: now - (now - i * 3_600_000),
      };
    });
    const good = rtts.filter((r) => r.rtt_ms !== null);
    const avg = good.length
      ? Math.round(good.reduce((a, r) => a + (r.rtt_ms as number), 0) / good.length)
      : 0;

    return {
      id: `demo-test-${i + 1}`,
      target,
      started_at: new Date(now - i * 3_600_000).toISOString(),
      duration_ms: packetCount * 1000,
      avg_latency_ms: avg,
      packet_count: packetCount,
      loss_percent: ((packetCount - good.length) / packetCount) * 100,
      rtts,
    } satisfies TestResult;
  });
}

function readAll(): TestResult[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return JSON.parse(raw) as TestResult[];
    }
  } catch {
    // fall through to reseed
  }
  const fresh = seed();
  writeAll(fresh);
  return fresh;
}

function writeAll(tests: TestResult[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tests));
  } catch {
    // Storage full or unavailable — demo data stays in memory only.
  }
}

export function demoTestsPage(cursor?: string | null): {
  items: TestResult[];
  next_cursor: string | null;
} {
  const all = readAll();
  const pageSize = 20;
  const start = cursor ? Number.parseInt(cursor, 10) || 0 : 0;
  const items = all.slice(start, start + pageSize);
  const next = start + pageSize < all.length ? String(start + pageSize) : null;
  return { items, next_cursor: next };
}

export function demoSaveTest(test: TestResult): TestResult {
  const all = readAll();
  const next = [test, ...all.filter((t) => t.id !== test.id)];
  writeAll(next);
  return test;
}

export function demoDeleteTest(id: string): void {
  writeAll(readAll().filter((t) => t.id !== id));
}

const CSV_HEADER = 'seq,target,rtt_ms,timestamp';

export function demoExportCsv(): string {
  const rows = readAll().flatMap((t) =>
    t.rtts.map((r) =>
      [r.seq, r.target, r.rtt_ms ?? '', new Date(r.timestamp).toISOString()].join(',')
    )
  );
  return [CSV_HEADER, ...rows].join('\n');
}