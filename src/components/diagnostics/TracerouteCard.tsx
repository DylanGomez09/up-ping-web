import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ErrorState } from '@/components/ErrorState';
import { Field } from '@/components/Field';
import { InfoChip } from '@/components/InfoChip';
import { Status, Td, Th } from '@/components/diagnostics/tableParts';
import { runTraceroute } from '@/lib/api/diagnostics';
import type { TracerouteHop, TracerouteResult } from '@/types/diagnostics';

const CAUSE_COPY: Record<
  'local' | 'provider' | 'unknown',
  { label: string; detail: string }
> = {
  local: {
    label: 'Local network',
    detail:
      'Communication stops inside your own network — check cables, switches and the router.',
  },
  provider: {
    label: 'Provider',
    detail:
      'Communication stops upstream — a hop beyond your gateway never answers.',
  },
  unknown: {
    label: 'Inconclusive',
    detail: 'Not enough hops answered to tell where the path breaks.',
  },
};

function hopTone(hop: TracerouteHop): 'ok' | 'warn' | 'bad' {
  if (hop.timed_out) return 'bad';
  if (hop.gateway_break) return 'warn';
  return 'ok';
}

/**
 * Hop-by-hop traceroute. A single timed-out hop is a normal ICMP artefact, so
 * the card only calls it a break when no further hop ever answers.
 */
export function TracerouteCard() {
  const [target, setTarget] = useState('8.8.8.8');
  const [result, setResult] = useState<TracerouteResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: runTraceroute,
    onSuccess: (data) => {
      setResult(data);
      setError(null);
    },
    onError: (err: unknown) => {
      setResult(null);
      setError(
        err instanceof Error
          ? err.message
          : 'Could not trace the route to this host.'
      );
    },
  });

  const handleRun = () => {
    const clean = target.trim();
    if (!clean) {
      setError('Enter a host or IP to trace.');
      return;
    }
    mutation.mutate(clean);
  };

  const cause = result ? CAUSE_COPY[result.cause] : null;

  return (
    <Card
      title="Traceroute"
      subtitle="Where the path to the target breaks"
      action={
        <Button size="sm" loading={mutation.isPending} onClick={handleRun}>
          Run
        </Button>
      }
    >
      <div className="flex flex-col gap-4">
        <Field
          label="Target"
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="8.8.8.8"
          autoComplete="off"
          spellCheck={false}
        />

        {error ? (
          <ErrorState message={error} onRetry={handleRun} />
        ) : mutation.isPending ? (
          <div className="space-y-2" aria-busy="true">
            <span className="sr-only">Running traceroute</span>
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-10 w-full animate-pulse rounded-mark bg-tint"
              />
            ))}
          </div>
        ) : result ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <InfoChip variant="highlight">{result.target}</InfoChip>
              <InfoChip>{result.hops.length} hops</InfoChip>
              {result.broke_at_hop && (
                <InfoChip>broke at hop {result.broke_at_hop}</InfoChip>
              )}
            </div>

            {cause && (
              <div className="rounded-control bg-tint px-4 py-3">
                <AppText variant="body" className="block font-semibold text-primary">
                  {cause.label}
                </AppText>
                <AppText variant="caption" className="mt-1 block text-secondary">
                  {cause.detail}
                </AppText>
              </div>
            )}

            <div className="-mx-2 overflow-x-auto px-2">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border">
                    <Th>TTL</Th>
                    <Th>Address</Th>
                    <Th>Hostname</Th>
                    <Th>RTT</Th>
                  </tr>
                </thead>
                <tbody>
                  {result.hops.map((hop) => (
                    <tr
                      key={hop.ttl}
                      className="border-b border-border/60 last:border-0"
                    >
                      <Td mono>{hop.ttl}</Td>
                      <Td mono>{hop.ip ?? '—'}</Td>
                      <Td className="text-secondary">
                        {hop.hostname ?? (hop.gateway_break ? 'gateway' : '—')}
                      </Td>
                      <Td mono>
                        {hop.timed_out ? (
                          <Status tone={hopTone(hop)}>timeout</Status>
                        ) : (
                          <Status tone={hopTone(hop)}>{hop.rtt_ms} ms</Status>
                        )}
                      </Td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : (
          <AppText variant="caption" className="block text-muted">
            Run a traceroute to see each hop along the path.
          </AppText>
        )}
      </div>
    </Card>
  );
}