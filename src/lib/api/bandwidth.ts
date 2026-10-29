import { assessConnection } from '@/lib/utils/latencyHealth';
import type {
  LatencyBandwidthCorrelation,
  SpeedPhase,
  SpeedSample,
} from '@/types/diagnostics';

/**
 * Real bandwidth measurement from the browser.
 *
 * Cloudflare's speed endpoints send `Access-Control-Allow-Origin: *`, so the
 * page can download and upload real payloads and time them. The test is manual
 * because it moves about 12 MB in total.
 *
 * While a transfer runs we also emit throughput samples for the live chart.
 * Those samples are cosmetic: the reported figure always comes from total
 * bytes over total time.
 */

const SPEED_ENDPOINT = 'https://speed.cloudflare.com';
const DOWNLOAD_BYTES = 10_000_000;
const UPLOAD_BYTES = 2_000_000;
const LATENCY_PROBES = 5;
const LATENCY_TIMEOUT_MS = 8_000;
const TRANSFER_TIMEOUT_MS = 30_000;
/** Gap between chart samples; shorter intervals read as noise. */
const SAMPLE_INTERVAL_MS = 100;
/**
 * A fast link can finish 10 MB in well under a second, so the tail of the
 * transfer is emitted even when it does not fill a full interval. Below this
 * window the reading would be a spike, so it is dropped instead.
 */
const MIN_TAIL_WINDOW_MS = 30;

/** Phases reported to the UI. `done` closes the run. */
export type SpeedTestPhase = SpeedPhase | 'latency' | 'done';

export interface MeasureBandwidthOptions {
  /** Cancels the whole run, including an in-flight transfer. */
  signal?: AbortSignal;
  /** Fires when the run moves to another stage. */
  onPhase?: (phase: SpeedTestPhase) => void;
  /** Fires a few times per second while a transfer is in flight. */
  onSample?: (sample: SpeedSample) => void;
}

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

function abortError(): DOMException {
  return new DOMException('La medición se canceló.', 'AbortError');
}

function timeoutError(message: string): Error {
  const error = new Error(message);
  error.name = 'TimeoutError';
  return error;
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}

function isTimeoutError(error: unknown): boolean {
  return error instanceof Error && error.name === 'TimeoutError';
}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) {
    throw abortError();
  }
}

/** Mbps for a single interval, not a running average. */
function intervalMbps(bytes: number, elapsedMs: number): number {
  if (bytes <= 0 || elapsedMs <= 0) {
    return 0;
  }

  return round1((bytes * 8 * 1000) / elapsedMs / 1_000_000);
}

interface AbortScope {
  signal: AbortSignal;
  /** True when the internal timer — not the caller — cancelled the work. */
  readonly timedOut: boolean;
  dispose: () => void;
}

/**
 * One controller per operation that answers to both the caller's signal and a
 * hard deadline. The deadline is disposed by the caller *after* the body has
 * been consumed, which is what makes streaming downloads safe.
 */
function createAbortScope(
  external: AbortSignal | undefined,
  timeoutMs: number
): AbortScope {
  const controller = new AbortController();
  let timedOut = false;

  const timer = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  const forwardAbort = () => controller.abort();

  if (external) {
    if (external.aborted) {
      controller.abort();
    } else {
      external.addEventListener('abort', forwardAbort, { once: true });
    }
  }

  return {
    signal: controller.signal,
    get timedOut() {
      return timedOut;
    },
    dispose() {
      window.clearTimeout(timer);
      external?.removeEventListener('abort', forwardAbort);
    },
  };
}

/** Median-ish latency using a few tiny downloads. */
async function measureLatency(
  options: MeasureBandwidthOptions
): Promise<number> {
  const samples: number[] = [];

  for (let i = 0; i < LATENCY_PROBES; i += 1) {
    throwIfAborted(options.signal);

    const scope = createAbortScope(options.signal, LATENCY_TIMEOUT_MS);

    try {
      const startedAt = now();
      const res = await fetch(endpoint('/__down?bytes=0'), {
        cache: 'no-store',
        credentials: 'omit',
        signal: scope.signal,
      });

      if (!res.ok) {
        continue;
      }

      await res.arrayBuffer();
      samples.push(now() - startedAt);
    } catch (error) {
      if (options.signal?.aborted) {
        throw error;
      }
      // Ignore a failed probe; the others can still produce an average.
    } finally {
      scope.dispose();
    }
  }

  if (samples.length === 0) {
    throw new Error(
      'No se pudo contactar con speed.cloudflare.com. Revisa tu conexión e inténtalo de nuevo.'
    );
  }

  samples.sort((a, b) => a - b);
  const middle = Math.floor(samples.length / 2);
  const median =
    samples.length % 2 === 0
      ? (samples[middle - 1] + samples[middle]) / 2
      : samples[middle];

  return round1(median);
}

/**
 * Streams the payload so the chart can follow it. When the body is not
 * readable we fall back to `arrayBuffer()` and simply emit no samples.
 */
async function measureDownload(
  options: MeasureBandwidthOptions
): Promise<number> {
  throwIfAborted(options.signal);

  const { onSample } = options;
  const startedAt = now();
  const scope = createAbortScope(options.signal, TRANSFER_TIMEOUT_MS);
  let received = 0;

  try {
    const res = await fetch(endpoint(`/__down?bytes=${DOWNLOAD_BYTES}`), {
      cache: 'no-store',
      credentials: 'omit',
      signal: scope.signal,
    });

    if (!res.ok) {
      throw new Error(`La medición de descarga falló (HTTP ${res.status}).`);
    }

    if (res.body) {
      const reader = res.body.getReader();
      let windowBytes = 0;
      let windowStart = now();

      for (;;) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        received += value.byteLength;
        windowBytes += value.byteLength;

        const at = now();
        const elapsed = at - windowStart;

        if (elapsed >= SAMPLE_INTERVAL_MS) {
          onSample?.({
            phase: 'download',
            t: (at - startedAt) / 1000,
            mbps: intervalMbps(windowBytes, elapsed),
          });
          windowBytes = 0;
          windowStart = at;
        }
      }

      const tailAt = now();
      const tailElapsed = tailAt - windowStart;

      if (windowBytes > 0 && tailElapsed >= MIN_TAIL_WINDOW_MS) {
        onSample?.({
          phase: 'download',
          t: (tailAt - startedAt) / 1000,
          mbps: intervalMbps(windowBytes, tailElapsed),
        });
      }
    } else {
      const body = await res.arrayBuffer();
      received = body.byteLength;
    }
  } catch (error) {
    if (scope.timedOut) {
      throw timeoutError('La descarga tardó demasiado y se canceló.');
    }
    throw error;
  } finally {
    scope.dispose();
  }

  const seconds = (now() - startedAt) / 1000;
  const bytes = received || DOWNLOAD_BYTES;

  if (seconds <= 0) {
    throw new Error(
      'La medición de descarga fue demasiado corta para ser fiable.'
    );
  }

  return round1((bytes * 8) / seconds / 1_000_000);
}

/**
 * `fetch` cannot report upload progress, so the primary path uses XHR. The
 * progress event measures bytes handed to the socket buffer, which can run
 * slightly ahead of the wire; the final figure still comes from the clock.
 */
function measureUploadWithXhr(
  options: MeasureBandwidthOptions
): Promise<number> {
  const { signal, onSample } = options;

  return new Promise<number>((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }

    const xhr = new XMLHttpRequest();
    const startedAt = now();
    let lastLoaded = 0;
    let lastSampleAt = startedAt;
    let settled = false;

    const finish = (settle: () => void) => {
      if (settled) {
        return;
      }
      settled = true;
      signal?.removeEventListener('abort', handleAbort);
      settle();
    };

    const handleAbort = () => xhr.abort();

    signal?.addEventListener('abort', handleAbort, { once: true });

    xhr.open('POST', endpoint('/__up'));
    xhr.timeout = TRANSFER_TIMEOUT_MS;
    xhr.responseType = 'arraybuffer';
    xhr.setRequestHeader('Content-Type', 'application/octet-stream');

    xhr.upload.onprogress = (event) => {
      const at = now();
      const elapsed = at - lastSampleAt;

      if (elapsed < SAMPLE_INTERVAL_MS) {
        return;
      }

      const delta = event.loaded - lastLoaded;
      lastLoaded = event.loaded;
      lastSampleAt = at;

      onSample?.({
        phase: 'upload',
        t: (at - startedAt) / 1000,
        mbps: intervalMbps(delta, elapsed),
      });
    };

    xhr.onload = () => {
      if (xhr.status < 200 || xhr.status >= 300) {
        finish(() =>
          reject(
            new Error(`La medición de subida falló (HTTP ${xhr.status}).`)
          )
        );
        return;
      }

      const at = now();
      const tailElapsed = at - lastSampleAt;

      if (lastLoaded < UPLOAD_BYTES && tailElapsed >= MIN_TAIL_WINDOW_MS) {
        onSample?.({
          phase: 'upload',
          t: (at - startedAt) / 1000,
          mbps: intervalMbps(UPLOAD_BYTES - lastLoaded, tailElapsed),
        });
        lastLoaded = UPLOAD_BYTES;
        lastSampleAt = at;
      }

      const seconds = (now() - startedAt) / 1000;

      if (seconds <= 0) {
        finish(() =>
          reject(
            new Error('La medición de subida fue demasiado corta para ser fiable.')
          )
        );
        return;
      }

      finish(() => resolve(round1((UPLOAD_BYTES * 8) / seconds / 1_000_000)));
    };

    xhr.onerror = () =>
      finish(() =>
        reject(new Error('No se pudo completar la medición de subida.'))
      );

    xhr.ontimeout = () =>
      finish(() => reject(timeoutError('La subida tardó demasiado.')));

    xhr.onabort = () => finish(() => reject(abortError()));

    xhr.send(new Uint8Array(UPLOAD_BYTES));
  });
}

/** Last-resort upload path, identical to the pre-chart behaviour. */
async function measureUploadWithFetch(
  options: MeasureBandwidthOptions
): Promise<number> {
  throwIfAborted(options.signal);

  const payload = new Uint8Array(UPLOAD_BYTES);
  const startedAt = now();
  const scope = createAbortScope(options.signal, TRANSFER_TIMEOUT_MS);

  try {
    const res = await fetch(endpoint('/__up'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: payload,
      cache: 'no-store',
      credentials: 'omit',
      signal: scope.signal,
    });

    if (!res.ok) {
      throw new Error(`La medición de subida falló (HTTP ${res.status}).`);
    }

    // Wait for the response so the timer covers the whole round-trip.
    await res.arrayBuffer();
  } catch (error) {
    if (scope.timedOut) {
      throw timeoutError('La subida tardó demasiado.');
    }
    throw error;
  } finally {
    scope.dispose();
  }

  const seconds = (now() - startedAt) / 1000;

  if (seconds <= 0) {
    throw new Error('La medición de subida fue demasiado corta para ser fiable.');
  }

  return round1((UPLOAD_BYTES * 8) / seconds / 1_000_000);
}

async function measureUpload(
  options: MeasureBandwidthOptions
): Promise<number> {
  try {
    return await measureUploadWithXhr(options);
  } catch (error) {
    // A cancelled or timed-out upload should not be retried: it would only
    // double the wait. Network/CORS/status failures get one fetch attempt.
    if (options.signal?.aborted || isAbortError(error) || isTimeoutError(error)) {
      throw error;
    }
  }

  return measureUploadWithFetch(options);
}

const VERDICT_BY_TONE = {
  ok: 'ok',
  warn: 'warning',
  bad: 'critical',
} as const;

export async function measureBandwidth(
  options: MeasureBandwidthOptions = {}
): Promise<LatencyBandwidthCorrelation> {
  const { signal, onPhase } = options;

  throwIfAborted(signal);
  onPhase?.('latency');
  const avgLatency = await measureLatency(options);

  throwIfAborted(signal);
  onPhase?.('download');
  const downlink = await measureDownload(options);

  throwIfAborted(signal);
  onPhase?.('upload');

  let uplink: number | null = null;
  try {
    uplink = await measureUpload(options);
  } catch (error) {
    if (signal?.aborted) {
      throw error;
    }
    // Downstream still gives a useful reading; the UI shows "—" for upload.
  }

  onPhase?.('done');

  const assessment = assessConnection({
    avgMs: avgLatency,
    lossPercent: 0,
    downlinkMbps: downlink,
  });
  const uploadNote = uplink === null ? ' No se pudo medir la subida.' : '';

  return {
    avg_latency_ms: avgLatency,
    bandwidth: {
      downlink_mbps: downlink,
      uplink_mbps: uplink ?? undefined,
      activity: 'idle',
      measured_at: new Date().toISOString(),
    },
    verdict: VERDICT_BY_TONE[assessment.tone],
    message: `${assessment.message}${uploadNote}`,
  };
}
