import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { InfoChip } from '@/components/InfoChip';
import { Skeleton, SkeletonGroup } from '@/components/Skeleton';
import { SpeedChart } from '@/components/charts/SpeedChart';
import { Status } from '@/components/diagnostics/tableParts';
import { assessConnection } from '@/lib/utils/latencyHealth';
import type { SpeedTestPhase } from '@/lib/api/bandwidth';
import type { SpeedTestStatus } from '@/hooks/useSpeedTest';
import type {
  LatencyBandwidthCorrelation,
  SpeedPhase,
  SpeedSample,
} from '@/types/diagnostics';

export interface SpeedTestCardProps {
  data: LatencyBandwidthCorrelation | null;
  status: SpeedTestStatus;
  phase: SpeedTestPhase | null;
  samples: SpeedSample[];
  error: string | null;
  onRun: () => void;
  onReset: () => void;
}

/** Newest reading of a phase, for the live chips while the run is in flight. */
function lastOf(samples: SpeedSample[], phase: SpeedPhase): SpeedSample | null {
  for (let index = samples.length - 1; index >= 0; index -= 1) {
    if (samples[index].phase === phase) {
      return samples[index];
    }
  }

  return null;
}

/**
 * Real download/upload measurement against Cloudflare's speed endpoints, plus
 * the latency that comes out of the same run.
 *
 * Manual on purpose: it moves about 12 MB, so it never runs on page load. The
 * chart follows the transfer live, but the headline numbers always come from
 * total bytes over total time.
 */
export function SpeedTestCard({
  data,
  status,
  phase,
  samples,
  error,
  onRun,
  onReset,
}: SpeedTestCardProps) {
  const running = status === 'running';
  const hasSamples = samples.length > 0;
  const activePhase: SpeedPhase | null =
    phase === 'download' || phase === 'upload' ? phase : null;

  const assessment = data
    ? assessConnection({
        avgMs: data.avg_latency_ms,
        lossPercent: 0,
        downlinkMbps: data.bandwidth.downlink_mbps,
      })
    : null;

  const canClear = !running && (status !== 'idle' || data !== null);

  const liveDownload = lastOf(samples, 'download');
  const liveUpload = lastOf(samples, 'upload');

  return (
    <Card
      title="Velocidad"
      subtitle="Descarga, subida y latencia desde este navegador · speed.cloudflare.com"
      action={
        <div className="flex items-center gap-2">
          {canClear && (
            <Button variant="secondary" size="sm" onClick={onReset}>
              Limpiar
            </Button>
          )}
          <Button
            variant="secondary"
            size="sm"
            onClick={onRun}
            loading={running}
            disabled={running}
          >
            {data ? 'Repetir' : 'Medir velocidad'}
          </Button>
        </div>
      }
    >
      {error ? (
        <div className="flex flex-col gap-4">
          <div role="alert" className="rounded-control bg-danger-soft px-4 py-3">
            <AppText variant="caption" className="block text-danger">
              {error}
            </AppText>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={onRun}
            >
              Reintentar
            </Button>
          </div>

          {hasSamples && <SpeedChart samples={samples} />}
        </div>
      ) : running && !hasSamples ? (
        <SkeletonGroup
          label="Midiendo la latencia antes de la transferencia"
          className="flex flex-col gap-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-[30px] w-32 rounded-chip" />
            <Skeleton className="h-[30px] w-24 rounded-chip" />
            <Skeleton className="h-[30px] w-24 rounded-chip" />
          </div>

          <Skeleton className="h-[200px] w-full" />
        </SkeletonGroup>
      ) : running ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {liveDownload ? (
              <InfoChip variant="highlight">
                ↓ {liveDownload.mbps} Mbps
              </InfoChip>
            ) : (
              <InfoChip>Latencia medida</InfoChip>
            )}
            {liveUpload && <InfoChip>↑ {liveUpload.mbps} Mbps</InfoChip>}
          </div>

          <SpeedChart
            samples={samples}
            activePhase={activePhase}
            running
          />

          <AppText variant="caption" className="block text-muted">
            Cifras en vivo. El resultado final se calcula con los bytes totales
            y el tiempo total de cada fase.
          </AppText>
        </div>
      ) : data && assessment ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <InfoChip variant="highlight">
              {data.avg_latency_ms} ms de media
            </InfoChip>
            <InfoChip>
              ↓ {data.bandwidth.downlink_mbps ?? '—'} Mbps
            </InfoChip>
            <InfoChip>
              ↑ {data.bandwidth.uplink_mbps ?? '—'} Mbps
            </InfoChip>
          </div>

          {hasSamples && <SpeedChart samples={samples} />}

          <Status tone={assessment.tone}>{assessment.label}</Status>

          <p className="text-[13px] leading-[18px] text-secondary">
            {assessment.message}
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
