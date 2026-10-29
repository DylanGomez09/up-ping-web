import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ErrorState } from '@/components/ErrorState';
import { InfoChip } from '@/components/InfoChip';
import { Skeleton } from '@/components/Skeleton';
import { Status } from '@/components/diagnostics/tableParts';
import type { LatencyBandwidthCorrelation } from '@/types/diagnostics';

const VERDICT_TONE = {
  ok: 'ok',
  warning: 'warn',
  critical: 'bad',
} as const;

const VERDICT_LABEL = {
  ok: 'Healthy',
  warning: 'Contended',
  critical: 'Congested',
} as const;

export interface BandwidthCardProps {
  data: LatencyBandwidthCorrelation | null;
  running: boolean;
  error: string | null;
  onRun: () => void;
}

/**
 * Real download/upload measurement against Cloudflare's speed endpoints.
 * Manual on purpose: it moves about 12 MB, so it never runs on page load.
 */
export function BandwidthCard({ data, running, error, onRun }: BandwidthCardProps) {
  return (
    <Card
      title="Bandwidth vs latency"
      subtitle="Measured from this browser through speed.cloudflare.com"
      action={
        <Button
          variant="secondary"
          size="sm"
          onClick={onRun}
          loading={running}
          disabled={running}
        >
          {data ? 'Run again' : 'Run speed test'}
        </Button>
      }
    >
      {error ? (
        <ErrorState message={error} onRetry={onRun} retryLabel="Run again" />
      ) : running ? (
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <AppText variant="caption" className="block text-muted">
            Downloading about 10 MB and uploading about 2 MB. This takes a few
            seconds.
          </AppText>
        </div>
      ) : data ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <InfoChip variant="highlight">
              {data.avg_latency_ms} ms avg
            </InfoChip>
            <InfoChip>↓ {data.bandwidth.downlink_mbps ?? '—'} Mbps</InfoChip>
            <InfoChip>↑ {data.bandwidth.uplink_mbps ?? '—'} Mbps</InfoChip>
          </div>

          <div className="flex items-center gap-3">
            <Status tone={VERDICT_TONE[data.verdict]}>
              {VERDICT_LABEL[data.verdict]}
            </Status>
          </div>

          <p className="text-[13px] leading-[18px] text-secondary">
            {data.message}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <AppText variant="body" className="text-secondary">
            Measures real download and upload throughput from this browser, then
            compares it with latency.
          </AppText>
          <AppText variant="caption" className="block text-muted">
            Downloads about 10 MB and uploads about 2 MB using Cloudflare&apos;s
            public speed endpoints. Nothing is sent to the UpPing backend.
          </AppText>
        </div>
      )}
    </Card>
  );
}
