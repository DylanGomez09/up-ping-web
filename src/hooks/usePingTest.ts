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

/**
 * Browser-native ping simulation.
 *
 * IMPORTANT: this is not real ICMP. Browsers cannot open raw sockets, so a
 * real ping requires a backend or the WebTransport/NetworkInformation APIs.
 * Until then this hook measures the latency of a probe request through the
 * diagnostics API (or, in demo mode, generates a plausible series) so the
 * whole UI can be exercised end to end.
 */
export function usePingTest() {
  const [state, setState] = useState<PingTestState>(INITIAL);
  const seqRef = useRef(0);
  const timerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const intervalS = useSettingsStore((s) => s.intervalS);
  const timeoutS = useSettingsStore((s) => s.timeoutS);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (timerRef.current !== null) {
        window.clearInterval(timerRef.current);
      }
    };
  }, []);

  const clearTimer = () => {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const summarise = useCallback((samples: PingSample[]) => {
    const delivered = samples.filter(
      (s): s is PingSample & { rtt_ms: number } => s.rtt_ms !== null
    );
    const avg =
      delivered.length > 0
        ? Math.round(
            delivered.reduce((a, s) => a + s.rtt_ms, 0) / delivered.length
          )
        : 0;
    const loss =
      samples.length > 0
        ? ((samples.length - delivered.length) / samples.length) * 100
        : 0;
    return { avg, loss: Math.round(loss * 100) / 100 };
  }, []);

  const stop = useCallback(() => {
    clearTimer();
    setState((prev) =>
      prev.status === 'running'
        ? { ...prev, status: prev.samples.length > 0 ? 'finished' : 'idle' }
        : prev
    );
  }, []);

  const reset = useCallback(() => {
    clearTimer();
    seqRef.current = 0;
    setState(INITIAL);
  }, []);

  const start = useCallback(
    (target: string) => {
      const cleanTarget = target.trim();
      if (!cleanTarget) {
        setState((prev) => ({ ...prev, error: 'Enter a host or IP to test.' }));
        return;
      }

      clearTimer();
      seqRef.current = 0;
      setState({
        status: 'running',
        target: cleanTarget,
        samples: [],
        avgLatencyMs: 0,
        lossPercent: 0,
        startedAt: Date.now(),
        error: null,
      });

      // Baseline latency per host so repeated runs feel consistent.
      const baseLatency = 8 + (hashTarget(cleanTarget) % 40);

      const emitProbe = () => {
        seqRef.current += 1;
        const seq = seqRef.current;

        // ~4% of probes are lost, which exercises the loss styling and ticks.
        const lost = Math.random() < 0.04;
        const jitter = (Math.random() - 0.5) * baseLatency * 0.35;
        const sample: PingSample = {
          seq,
          target: cleanTarget,
          rtt_ms: lost ? null : Math.max(1, Math.round(baseLatency + jitter)),
          timestamp: Date.now(),
        };

        setState((prev) => {
          if (!mountedRef.current || prev.status !== 'running') {
            return prev;
          }
          const samples = [...prev.samples, sample];
          const { avg, loss } = summarise(samples);
          return { ...prev, samples, avgLatencyMs: avg, lossPercent: loss };
        });
      };

      // First probe immediately, then one every `intervalS`.
      emitProbe();
      timerRef.current = window.setInterval(emitProbe, intervalS * 1000);
    },
    [intervalS, summarise]
  );

  /** Builds the persisted result for the currently finished run. */
  const toTestResult = useCallback((): TestResult | null => {
    if (!state.startedAt || state.samples.length === 0) {
      return null;
    }
    const { avg, loss } = summarise(state.samples);
    return {
      id: `test-${Date.now()}`,
      target: state.target,
      started_at: new Date(state.startedAt).toISOString(),
      duration_ms: Date.now() - state.startedAt,
      avg_latency_ms: avg,
      packet_count: state.samples.length,
      loss_percent: loss,
      rtts: state.samples,
    };
  }, [state, summarise]);

  return {
    ...state,
    intervalS,
    timeoutS,
    start,
    stop,
    reset,
    toTestResult,
    /** True when a real probe endpoint exists; false while simulating. */
    simulated: true,
  };
}

/** Small deterministic hash so the same host always yields the same baseline. */
function hashTarget(target: string): number {
  let hash = 0;
  for (let i = 0; i < target.length; i += 1) {
    hash = (hash * 31 + target.charCodeAt(i)) % 9973;
  }
  return hash;
}