import type { LatencyPoint, LossSlice } from '@/types/diagnostics';
import type { TestResult } from '@/types/test';

const HOUR_MS = 3_600_000;

/**
 * Builds the "Last 24 hours" series from saved tests by averaging latency per
 * hour. Hours without a saved test are skipped, so the sparkline shows the
 * shape of the tests you actually ran.
 */
export function buildLatency24h(
  tests: TestResult[],
  now = Date.now()
): LatencyPoint[] {
  const cutoff = now - 24 * HOUR_MS;
  const buckets = new Map<number, { sum: number; count: number }>();

  for (const test of tests) {
    const ranAt = Date.parse(test.started_at);
    if (Number.isNaN(ranAt) || ranAt < cutoff || ranAt > now + 60_000) {
      continue;
    }

    const bucket = Math.floor(ranAt / HOUR_MS) * HOUR_MS;
    const entry = buckets.get(bucket) ?? { sum: 0, count: 0 };
    entry.sum += Math.max(0, test.avg_latency_ms);
    entry.count += 1;
    buckets.set(bucket, entry);
  }

  return [...buckets.entries()]
    .sort(([a], [b]) => a - b)
    .map(([bucket, entry]) => ({
      label: new Date(bucket).toLocaleTimeString(undefined, {
        hour: '2-digit',
        minute: '2-digit',
      }),
      ms: Math.round((entry.sum / entry.count) * 10) / 10,
    }));
}

/**
 * Aggregates delivered vs lost packets across saved tests. Returns an empty
 * array when there are no packets to report, so callers can show an empty
 * state instead of a 0% donut.
 */
export function buildLossSlices(tests: TestResult[]): LossSlice[] {
  let sent = 0;
  let received = 0;

  for (const test of tests) {
    const packets = Math.max(0, Math.round(test.packet_count));
    sent += packets;

    const delivered =
      test.rtts.length > 0
        ? test.rtts.filter((sample) => sample.rtt_ms !== null).length
        : Math.round(packets * (1 - Math.min(100, Math.max(0, test.loss_percent)) / 100));

    received += Math.min(packets, Math.max(0, delivered));
  }

  if (sent === 0) {
    return [];
  }

  const lostPercent = ((sent - received) / sent) * 100;
  const deliveredPercent = 100 - lostPercent;

  return [
    {
      label: 'Delivered',
      value: Math.round(deliveredPercent * 100) / 100,
      color: 'var(--c-teal)',
    },
    {
      label: 'Lost',
      value: Math.round(lostPercent * 100) / 100,
      color: 'var(--c-danger)',
    },
  ];
}
