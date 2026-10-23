import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/Card';
import { ErrorState } from '@/components/ErrorState';
import { InfoChip } from '@/components/InfoChip';
import { Skeleton } from '@/components/Skeleton';
import { Status } from '@/components/diagnostics/tableParts';
import { getBandwidthCorrelation } from '@/lib/api/diagnostics';

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

/**
 * Cross-checks average latency against measured bandwidth. Reading both at
 * once tells you whether high latency is a bandwidth problem or a routing one.
 */
export function BandwidthCard() {
  const query = useQuery({
    queryKey: ['diagnostics', 'bandwidth'],
    queryFn: getBandwidthCorrelation,
    refetchInterval: 30_000,
  });

  return (
    <Card
      title="Bandwidth vs latency"
      subtitle="Are high pings caused by a saturated link?"
      action={
        <button
          type="button"
          onClick={() => void query.refetch()}
          className="text-[13px] font-semibold text-teal transition-opacity hover:opacity-80"
        >
          Refresh
        </button>
      }
    >
      {query.isError ? (
        <ErrorState
          message="Could not measure bandwidth."
          onRetry={() => void query.refetch()}
        />
      ) : query.data ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <InfoChip variant="highlight">
              {query.data.avg_latency_ms} ms avg
            </InfoChip>
            <InfoChip>
              ↓ {query.data.bandwidth.downlink_mbps ?? '—'} Mbps
            </InfoChip>
            <InfoChip>
              ↑ {query.data.bandwidth.uplink_mbps ?? '—'} Mbps
            </InfoChip>
            <InfoChip>{query.data.bandwidth.activity}</InfoChip>
          </div>

          <div className="flex items-center gap-3">
            <Status tone={VERDICT_TONE[query.data.verdict]}>
              {VERDICT_LABEL[query.data.verdict]}
            </Status>
          </div>

          <p className="text-[13px] leading-[18px] text-secondary">
            {query.data.message}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-full" />
        </div>
      )}
    </Card>
  );
}