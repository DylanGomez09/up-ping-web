import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ErrorState } from '@/components/ErrorState';
import { InfoChip } from '@/components/InfoChip';
import { Skeleton, SkeletonGroup } from '@/components/Skeleton';
import { Status } from '@/components/diagnostics/tableParts';
import type { LatencyBandwidthCorrelation } from '@/types/diagnostics';

const VERDICT_TONE = {
  ok: 'ok',
  warning: 'warn',
  critical: 'bad',
} as const;

const VERDICT_LABEL = {
  ok: 'Saludable',
  warning: 'Disputada',
  critical: 'Congestionada',
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
      title="Velocidad frente a latencia"
      subtitle="Medido desde este navegador a través de speed.cloudflare.com"
      action={
        <Button
          variant="secondary"
          size="sm"
          onClick={onRun}
          loading={running}
          disabled={running}
        >
          {data ? 'Repetir' : 'Medir velocidad'}
        </Button>
      }
    >
      {error ? (
        <ErrorState message={error} onRetry={onRun} retryLabel="Reintentar" />
      ) : running ? (
        <SkeletonGroup
          label="Midiendo la velocidad de descarga y subida"
          className="flex flex-col gap-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-[30px] w-32 rounded-chip" />
            <Skeleton className="h-[30px] w-24 rounded-chip" />
            <Skeleton className="h-[30px] w-24 rounded-chip" />
          </div>

          <Skeleton className="h-[22px] w-24" />

          <div className="space-y-1.5">
            <Skeleton className="h-[18px] w-full" />
            <Skeleton className="h-[18px] w-3/4" />
          </div>
        </SkeletonGroup>
      ) : data ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <InfoChip variant="highlight">
              {data.avg_latency_ms} ms de media
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
            Mide la velocidad real de descarga y subida desde este navegador y la
            compara con la latencia.
          </AppText>
          <AppText variant="caption" className="block text-muted">
            Descarga unos 10 MB y sube unos 2 MB usando los endpoints públicos de
            Cloudflare. No se envía nada al backend de UpPing.
          </AppText>
        </div>
      )}
    </Card>
  );
}
