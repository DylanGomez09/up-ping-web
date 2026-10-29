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
        <div className="space-y-3">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-4 w-full" />
          <AppText variant="caption" className="block text-muted">
            Descargando unos 10 MB y subiendo unos 2 MB. Tarda unos segundos.
          </AppText>
        </div>
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
