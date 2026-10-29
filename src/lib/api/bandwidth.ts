import type { LatencyBandwidthCorrelation } from '@/types/diagnostics';

/**
 * Real bandwidth measurement from the browser.
 *
 * Cloudflare's speed endpoints send `Access-Control-Allow-Origin: *`, so the
 * page can download and upload real payloads and time them. The test is manual
 * because it moves about 12 MB in total.
 */

const SPEED_ENDPOINT = 'https://speed.cloudflare.com';
const DOWNLOAD_BYTES = 10_000_000;
const UPLOAD_BYTES = 2_000_000;
const LATENCY_PROBES = 5;
const LATENCY_TIMEOUT_MS = 8_000;
const TRANSFER_TIMEOUT_MS = 30_000;

function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function endpoint(path: string): string {
  const separator = path.includes('?') ? '&' : '?';
  return `${SPEED_ENDPOINT}${path}${separator}uppping=${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  timeoutMs: number
): Promise<Response> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timer);
  }
}

/** Median-ish latency using a few tiny downloads. */
async function measureLatency(): Promise<number> {
  const samples: number[] = [];

  for (let i = 0; i < LATENCY_PROBES; i += 1) {
    try {
      const startedAt = now();
      const res = await fetchWithTimeout(
        endpoint('/__down?bytes=0'),
        { cache: 'no-store', credentials: 'omit' },
        LATENCY_TIMEOUT_MS
      );

      if (!res.ok) {
        continue;
      }

      await res.arrayBuffer();
      samples.push(now() - startedAt);
    } catch {
      // Ignore a failed probe; the others can still produce an average.
    }
  }

  if (samples.length === 0) {
    throw new Error('No se pudo contactar con speed.cloudflare.com. Revisa tu conexión e inténtalo de nuevo.');
  }

  samples.sort((a, b) => a - b);
  const middle = Math.floor(samples.length / 2);
  const median =
    samples.length % 2 === 0
      ? (samples[middle - 1] + samples[middle]) / 2
      : samples[middle];

  return round1(median);
}

async function measureDownload(): Promise<number> {
  const startedAt = now();
  const res = await fetchWithTimeout(
    endpoint(`/__down?bytes=${DOWNLOAD_BYTES}`),
    { cache: 'no-store', credentials: 'omit' },
    TRANSFER_TIMEOUT_MS
  );

  if (!res.ok) {
    throw new Error(`La medición de descarga falló (HTTP ${res.status}).`);
  }

  const body = await res.arrayBuffer();
  const seconds = (now() - startedAt) / 1000;
  const bytes = body.byteLength || DOWNLOAD_BYTES;

  if (seconds <= 0) {
    throw new Error('La medición de descarga fue demasiado corta para ser fiable.');
  }

  return round1((bytes * 8) / seconds / 1_000_000);
}

async function measureUpload(): Promise<number> {
  const payload = new Uint8Array(UPLOAD_BYTES);
  const startedAt = now();

  const res = await fetchWithTimeout(
    endpoint('/__up'),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: payload,
      cache: 'no-store',
      credentials: 'omit',
    },
    TRANSFER_TIMEOUT_MS
  );

  if (!res.ok) {
    throw new Error(`La medición de subida falló (HTTP ${res.status}).`);
  }

  // Wait for the response so the timer covers the whole round-trip.
  await res.arrayBuffer();
  const seconds = (now() - startedAt) / 1000;

  if (seconds <= 0) {
    throw new Error('La medición de subida fue demasiado corta para ser fiable.');
  }

  return round1((UPLOAD_BYTES * 8) / seconds / 1_000_000);
}

function verdictFor(latencyMs: number, downlinkMbps: number) {
  if (latencyMs > 150 || downlinkMbps < 5) {
    return 'critical' as const;
  }
  if (latencyMs > 80 || downlinkMbps < 25) {
    return 'warning' as const;
  }
  return 'ok' as const;
}

export async function measureBandwidth(): Promise<LatencyBandwidthCorrelation> {
  const avgLatency = await measureLatency();
  const downlink = await measureDownload();

  let uplink: number | null = null;
  try {
    uplink = await measureUpload();
  } catch {
    // Downstream still gives a useful reading; the UI shows "—" for upload.
  }

  const verdict = verdictFor(avgLatency, downlink);
  const messages = {
    ok: `Latencia baja con ${downlink} Mbps de descarga. El enlace no está congestionado.`,
    warning: `La latencia es elevada o el ancho de banda está limitado. Puede haber contención en el enlace.`,
    critical: `Latencia alta o rendimiento muy bajo. Revisa la red local o tu proveedor.`,
  } as const;

  const uploadNote =
    uplink === null ? ' No se pudo medir la subida.' : '';

  return {
    avg_latency_ms: avgLatency,
    bandwidth: {
      downlink_mbps: downlink,
      uplink_mbps: uplink ?? undefined,
      activity: 'idle',
      measured_at: new Date().toISOString(),
    },
    verdict,
    message: `${messages[verdict]}${uploadNote}`,
  };
}
