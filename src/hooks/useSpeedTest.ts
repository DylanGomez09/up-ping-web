import { useCallback, useEffect, useRef, useState } from 'react';
import { measureBandwidth, type SpeedTestPhase } from '@/lib/api/bandwidth';
import type {
  LatencyBandwidthCorrelation,
  SpeedSample,
} from '@/types/diagnostics';

export type SpeedTestStatus = 'idle' | 'running' | 'done' | 'error';

export interface SpeedTestController {
  status: SpeedTestStatus;
  /** `null` before the run and after a reset. */
  phase: SpeedTestPhase | null;
  /** Throughput readings for the live chart, in arrival order. */
  samples: SpeedSample[];
  result: LatencyBandwidthCorrelation | null;
  error: string | null;
  start: () => void;
  reset: () => void;
}

/**
 * Owns one manual speed measurement at a time: phase, live samples, aggregate
 * result and cancellation. Cancelling on unmount is what keeps a slow upload
 * from writing state into a card that is already gone.
 */
export function useSpeedTest(): SpeedTestController {
  const [status, setStatus] = useState<SpeedTestStatus>('idle');
  const [phase, setPhase] = useState<SpeedTestPhase | null>(null);
  const [samples, setSamples] = useState<SpeedSample[]>([]);
  const [result, setResult] =
    useState<LatencyBandwidthCorrelation | null>(null);
  const [error, setError] = useState<string | null>(null);

  const abortRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      abortRef.current?.abort();
      abortRef.current = null;
    };
  }, []);

  const start = useCallback(() => {
    // Starting again while a run is in flight simply replaces it.
    abortRef.current?.abort();

    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('running');
    setPhase('latency');
    setSamples([]);
    setResult(null);
    setError(null);

    void (async () => {
      try {
        const data = await measureBandwidth({
          signal: controller.signal,
          onPhase: (next) => {
            if (!mountedRef.current || controller.signal.aborted) {
              return;
            }
            setPhase(next);
          },
          onSample: (sample) => {
            if (!mountedRef.current || controller.signal.aborted) {
              return;
            }
            setSamples((previous) => [...previous, sample]);
          },
        });

        if (!mountedRef.current || controller.signal.aborted) {
          return;
        }

        setResult(data);
        setStatus('done');
        setPhase('done');
      } catch (cause) {
        if (!mountedRef.current || controller.signal.aborted) {
          return;
        }

        setError(
          cause instanceof Error
            ? cause.message
            : 'No se pudo medir la velocidad.'
        );
        setStatus('error');
        setPhase(null);
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    })();
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStatus('idle');
    setPhase(null);
    setSamples([]);
    setResult(null);
    setError(null);
  }, []);

  return { status, phase, samples, result, error, start, reset };
}
