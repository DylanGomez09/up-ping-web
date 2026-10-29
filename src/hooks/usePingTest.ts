import { useCallback, useEffect, useRef, useState } from 'react';
import { useSettingsStore } from '@/store/settingsStore';
import type { PingSample, TestResult } from '@/types/test';

export type TestStatus = 'idle' | 'running' | 'finished' | 'error';

export interface PingTestState {
  status: TestStatus;
  target: string;
  samples: PingSample[];
  avgLatencyMs: number;
  lossPercent: number;
  startedAt: number | null;
  error: string | null;
}

const INITIAL: PingTestState = {
  status: 'idle',
  target: '',
  samples: [],
  avgLatencyMs: 0,
  lossPercent: 0,
  startedAt: null,
  error: null,
};

/** The UI stops automatically after this many probes. */
const MAX_PROBES = 100;

export interface PingTestOptions {
  /**
   * Probes before the run stops by itself. Omit for the dashboard's long
   * monitoring run; the diagnostics card asks for a shorter sample.
   */
  maxProbes?: number;
}

/** Monotonic clock where available; falls back for older browsers. */
function now(): number {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

interface SleepHandle {
  timer: number;
  cancel: () => void;
}

/**
 * True for hosts that are only reachable over plain HTTP: loopback, RFC1918,
 * link-local, mDNS/`.local` names and bare hostnames. Everything else is probed
 * over HTTPS first, which is what public hosts expect.
 */
function isPrivateHost(host: string): boolean {
  const clean = host.replace(/^\[|\]$/g, '').replace(/\.$/, '').toLowerCase();

  if (!clean) {
    return false;
  }

  if (
    clean === 'localhost' ||
    clean.endsWith('.localhost') ||
    clean.endsWith('.local') ||
    clean.endsWith('.lan') ||
    clean.endsWith('.home') ||
    clean.endsWith('.internal')
  ) {
    return true;
  }

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(clean);
  if (ipv4) {
    const a = Number(ipv4[1]);
    const b = Number(ipv4[2]);
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 192 && b === 168) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 169 && b === 254) return true;
    return false;
  }

  if (clean.includes(':')) {
    if (clean === '::' || clean === '::1') return true;
    if (clean.startsWith('fc') || clean.startsWith('fd') || clean.startsWith('fe80')) {
      return true;
    }
    return false;
  }

  // A bare hostname like "router" only resolves on the local network.
  return !clean.includes('.');
}

/** Extracts the hostname from "host", "host:port" or a full URL. */
function extractHostname(target: string): string {
  const trimmed = target.trim();
  if (!trimmed) {
    return '';
  }

  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
    ? trimmed
    : `http://${trimmed}`;

  try {
    return new URL(withScheme).hostname
      .replace(/^\[|\]$/g, '')
      .replace(/\.$/, '')
      .toLowerCase();
  } catch {
    return trimmed
      .replace(/^\[|\]$/g, '')
      .split('/')[0]
      .toLowerCase();
  }
}

/**
 * Turns the user input into a probe URL. Domains and public IPs get HTTPS;
 * LAN/loopback hosts get HTTP because they rarely serve TLS.
 *
 * Returns `null` when the input cannot be parsed as a URL.
 */
export function normalizeTarget(target: string): string | null {
  const trimmed = target.trim();
  if (!trimmed) {
    return null;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      new URL(trimmed);
      return trimmed;
    } catch {
      return null;
    }
  }

  // Anything else with an explicit scheme (ftp://, ws://, mailto:) is not a
  // valid HTTP probe target.
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed)) {
    return null;
  }

  const host = extractHostname(trimmed);
  if (!host) {
    return null;
  }

  const scheme = isPrivateHost(host) ? 'http' : 'https';

  // A raw IPv6 literal needs brackets before it can be used in a URL.
  const candidate =
    host.includes(':') && !trimmed.startsWith('[')
      ? `${scheme}://[${trimmed}]`
      : `${scheme}://${trimmed}`;

  try {
    new URL(candidate);
    return candidate;
  } catch {
    return null;
  }
}

/**
 * Browsers block plain-HTTP requests made from an HTTPS page (mixed content).
 * LAN targets are probed over HTTP, so from the deployed HTTPS site they would
 * always time out. Loopback is exempt because it is treated as trustworthy.
 */
function blockedByMixedContent(url: string): boolean {
  if (typeof window === 'undefined' || window.location.protocol !== 'https:') {
    return false;
  }
  if (!url.startsWith('http://')) {
    return false;
  }

  const isLoopback = (host: string) =>
    host === 'localhost' ||
    host === '127.0.0.1' ||
    host === '::1' ||
    host === '[::1]';

  if (isLoopback(window.location.hostname)) {
    return false;
  }

  try {
    return !isLoopback(new URL(url).hostname);
  } catch {
    return true;
  }
}

/** Cache-busting query so a CDN/proxy cannot answer from cache. */
function cacheBust(url: string): string {
  try {
    const parsed = new URL(url);
    parsed.searchParams.set(
      '_uppping',
      `${Date.now()}-${Math.random().toString(36).slice(2)}`
    );
    return parsed.toString();
  } catch {
    return url;
  }
}

function summarise(samples: PingSample[]): { avg: number; loss: number } {
  const delivered = samples.filter(
    (s): s is PingSample & { rtt_ms: number } => s.rtt_ms !== null
  );
  const avg =
    delivered.length > 0
      ? delivered.reduce((sum, s) => sum + s.rtt_ms, 0) / delivered.length
      : 0;
  const loss =
    samples.length > 0
      ? ((samples.length - delivered.length) / samples.length) * 100
      : 0;

  return {
    avg: Math.round(avg * 10) / 10,
    loss: Math.round(loss * 100) / 100,
  };
}

/**
 * Real ping engine for the browser.
 *
 * ICMP is not available to JS runtimes, so a "probe" is a timed HTTP request
 * made with `fetch(..., { mode: 'no-cors' })`. The RTT therefore includes DNS,
 * TCP and TLS setup plus the HTTP response — a bit higher than `ping`, but a
 * genuine end-to-end measurement. A probe counts as lost when it fails or
 * exceeds the configured timeout.
 */
export function usePingTest() {
  const [state, setState] = useState<PingTestState>(INITIAL);

  const mountedRef = useRef(false);
  const runIdRef = useRef(0);
  const seqRef = useRef(0);
  const probeAbortRef = useRef<AbortController | null>(null);
  const sleepRef = useRef<SleepHandle | null>(null);

  const intervalS = useSettingsStore((s) => s.intervalS);
  const timeoutS = useSettingsStore((s) => s.timeoutS);
  const maxProbesRef = useRef(MAX_PROBES);

  const cancelSleep = () => {
    if (sleepRef.current) {
      sleepRef.current.cancel();
      sleepRef.current = null;
    }
  };

  const abortProbe = () => {
    if (probeAbortRef.current) {
      probeAbortRef.current.abort();
      probeAbortRef.current = null;
    }
  };

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      runIdRef.current += 1;
      abortProbe();
      cancelSleep();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wait = (ms: number): Promise<void> =>
    new Promise((resolve) => {
      const timer = window.setTimeout(() => {
        sleepRef.current = null;
        resolve();
      }, ms);

      sleepRef.current = {
        timer,
        cancel: () => {
          window.clearTimeout(timer);
          sleepRef.current = null;
          resolve();
        },
      };
    });

  const probeOnce = (url: string, timeoutMs: number): Promise<number | null> =>
    new Promise((resolve) => {
      const controller = new AbortController();
      probeAbortRef.current = controller;
      let settled = false;
      let timer: number | null = null;

      const finish = (rtt: number | null) => {
        if (settled) {
          return;
        }
        settled = true;
        if (timer !== null) {
          window.clearTimeout(timer);
        }
        if (probeAbortRef.current === controller) {
          probeAbortRef.current = null;
        }
        resolve(rtt);
      };

      timer = window.setTimeout(() => {
        controller.abort();
        finish(null);
      }, timeoutMs);

      const startedAt = now();

      fetch(cacheBust(url), {
        mode: 'no-cors',
        cache: 'no-store',
        credentials: 'omit',
        redirect: 'follow',
        referrerPolicy: 'no-referrer',
        signal: controller.signal,
      })
        .then(() => finish(Math.max(0.1, now() - startedAt)))
        .catch(() => finish(null));
    });

  const finishRun = useCallback((runId: number) => {
    if (runIdRef.current !== runId) {
      return;
    }
    setState((prev) =>
      prev.status === 'running' ? { ...prev, status: 'finished' } : prev
    );
  }, []);

  const runLoop = useCallback(
    async (runId: number, cleanTarget: string, url: string) => {
      const probeTimeoutMs = Math.max(200, timeoutS * 1000);
      const waitMs = Math.max(200, intervalS * 1000);

      while (mountedRef.current && runIdRef.current === runId) {
        const seq = ++seqRef.current;
        const rtt = await probeOnce(url, probeTimeoutMs);

        if (!mountedRef.current || runIdRef.current !== runId) {
          return;
        }

        const sample: PingSample = {
          seq,
          target: cleanTarget,
          rtt_ms: rtt === null ? null : Math.round(rtt * 10) / 10,
          timestamp: Date.now(),
        };

        setState((prev) => {
          if (prev.status !== 'running') {
            return prev;
          }
          const samples = [...prev.samples, sample];
          const { avg, loss } = summarise(samples);
          return {
            ...prev,
            samples,
            avgLatencyMs: avg,
            lossPercent: loss,
          };
        });

        if (seq >= maxProbesRef.current) {
          finishRun(runId);
          return;
        }

        await wait(waitMs);
      }
    },
    [finishRun, intervalS, timeoutS]
  );

  const stop = useCallback(() => {
    runIdRef.current += 1;
    abortProbe();
    cancelSleep();
    setState((prev) =>
      prev.status === 'running'
        ? { ...prev, status: prev.samples.length > 0 ? 'finished' : 'idle' }
        : prev
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = useCallback(() => {
    runIdRef.current += 1;
    abortProbe();
    cancelSleep();
    seqRef.current = 0;
    setState(INITIAL);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const start = useCallback(
    (target: string, options: PingTestOptions = {}) => {
      const cleanTarget = target.trim();
      if (!cleanTarget) {
        setState((prev) => ({
          ...prev,
          error: 'Escribe un host o una IP para probar.',
        }));
        return;
      }

      const url = normalizeTarget(cleanTarget);
      if (!url) {
        setState((prev) => ({
          ...prev,
          error:
            'Escribe un host, una IP o una URL válidos (por ejemplo dns.google o 192.168.1.1).',
        }));
        return;
      }

      if (blockedByMixedContent(url)) {
        setState((prev) => ({
          ...prev,
          error:
            'Esta página se sirve por HTTPS y el navegador bloquea las peticiones HTTP a la red local. Prueba un host público o abre UpPing en localhost.',
        }));
        return;
      }

      runIdRef.current += 1;
      const runId = runIdRef.current;
      abortProbe();
      cancelSleep();
      seqRef.current = 0;
      maxProbesRef.current = Math.max(1, Math.round(options.maxProbes ?? MAX_PROBES));

      setState({
        status: 'running',
        target: cleanTarget,
        samples: [],
        avgLatencyMs: 0,
        lossPercent: 0,
        startedAt: Date.now(),
        error: null,
      });

      void runLoop(runId, cleanTarget, url);
    },
    [runLoop]
  );

  /** Builds the persisted result for the current run. */
  const toTestResult = useCallback((): TestResult | null => {
    if (!state.startedAt || state.samples.length === 0) {
      return null;
    }

    const last = state.samples[state.samples.length - 1];

    return {
      id: `local-${state.startedAt}`,
      target: state.target,
      started_at: new Date(state.startedAt).toISOString(),
      duration_ms: Math.max(0, last.timestamp - state.startedAt),
      avg_latency_ms: state.avgLatencyMs,
      packet_count: state.samples.length,
      loss_percent: state.lossPercent,
      rtts: state.samples,
    };
  }, [state]);

  return {
    ...state,
    intervalS,
    timeoutS,
    start,
    stop,
    reset,
    toTestResult,
  };
}
