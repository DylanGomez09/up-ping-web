import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Icon } from '@/components/Icon';
import { InfoChip } from '@/components/InfoChip';
import { Skeleton, SkeletonGroup } from '@/components/Skeleton';
import { Status } from '@/components/diagnostics/tableParts';
import { PingChart } from '@/components/charts/PingChart';
import { assessLatency } from '@/lib/utils/latencyHealth';
import { usePingTest } from '@/hooks/usePingTest';

/** Nothing to type: diagnostics always measures this public host. */
const DEFAULT_TARGET = 'dns.google';
/** Probes per run: long enough to smooth out the cold first handshake. */
const RUN_PROBES = 15;
/** Below this many replies a verdict would be noise. */
const MIN_PROBES_FOR_VERDICT = 3;

/**
 * Latency run for the diagnostics page: the same real HTTP probes as the
 * dashboard, drawn live, plus a plain-language health verdict so the numbers
 * mean something without comparing them by hand.
 *
 * No target field on purpose — diagnostics is a one-click check, so the host
 * is fixed and the guest only has to press the button.
 */
export function LatencyCard() {
  const test = usePingTest();

  const running = test.status === 'running';
  const hasSamples = test.samples.length > 0;
  const waitingFirstProbe = running && !hasSamples;
  const delivered = test.samples.filter((sample) => sample.rtt_ms !== null).length;
  const gatheringEvidence = running && delivered < MIN_PROBES_FOR_VERDICT;
  const assessment =
    !gatheringEvidence && hasSamples
      ? assessLatency(test.avgLatencyMs, test.lossPercent)
      : null;

  return (
    <Card
      title="Latencia"
      subtitle="Sondas HTTP reales desde este navegador · 15 por medición"
      action={
        <Button
          variant="secondary"
          size="sm"
          onClick={test.reset}
          disabled={test.status === 'idle'}
        >
          Limpiar
        </Button>
      }
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        {running ? (
          <Button type="button" variant="danger" onClick={test.stop}>
            <Icon name="stop" size={16} />
            Detener
          </Button>
        ) : (
          <Button
            type="button"
            onClick={() => test.start(DEFAULT_TARGET, { maxProbes: RUN_PROBES })}
          >
            <Icon name="play" size={16} />
            Medir latencia
          </Button>
        )}

        <AppText variant="caption" className="text-muted">
          Sin escribir nada: se mide contra <span className="font-mono">dns.google</span>.
        </AppText>
      </div>

      <div className="mt-5">
        {hasSamples || running ? (
          <PingChart
            samples={test.samples}
            averageMs={test.avgLatencyMs || undefined}
            running={running}
          />
        ) : (
          <EmptyState
            mark={<Icon name="activity" size={26} />}
            title="Aún no hay latencia medida"
            description="Pulsa Medir latencia para dibujar el tiempo de ida y vuelta de cada sonda."
          />
        )}
      </div>

      {waitingFirstProbe ? (
        <SkeletonGroup
          label="Evaluando la salud de la conexión"
          className="mt-4 flex flex-col gap-2"
        >
          <div className="flex flex-wrap items-center gap-2">
            <Skeleton className="h-[30px] w-32 rounded-chip" />
            <Skeleton className="h-[30px] w-28 rounded-chip" />
            <Skeleton className="h-[30px] w-20 rounded-chip sm:ml-auto" />
          </div>
          <Skeleton className="h-[18px] w-2/3 max-w-full" />
        </SkeletonGroup>
      ) : gatheringEvidence ? (
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <InfoChip variant="highlight">
              {test.avgLatencyMs.toFixed(1)} ms de media
            </InfoChip>
            <InfoChip>{test.lossPercent.toFixed(1)} % de pérdida</InfoChip>
            <InfoChip>{test.samples.length} sondas</InfoChip>
          </div>
          <AppText variant="caption" className="block text-secondary">
            Recopilando sondas para valorar la conexión…
          </AppText>
        </div>
      ) : assessment ? (
        <div className="mt-4 flex flex-col gap-2" role="status" aria-live="polite">
          <div className="flex flex-wrap items-center gap-2">
            <InfoChip variant="highlight">
              {test.avgLatencyMs.toFixed(1)} ms de media
            </InfoChip>
            <InfoChip>{test.lossPercent.toFixed(1)} % de pérdida</InfoChip>
            <InfoChip>{test.samples.length} sondas</InfoChip>
            <span className="sm:ml-auto">
              <Status tone={assessment.tone}>{assessment.label}</Status>
            </span>
          </div>
          <AppText variant="caption" className="block text-secondary">
            {assessment.message}
          </AppText>
        </div>
      ) : null}

      <AppText variant="caption" className="mt-4 block text-muted">
        Cada sonda mide una petición HTTP completa (DNS + TCP + TLS); el navegador
        no puede enviar ICMP, así que los valores son algo más altos que `ping`.
      </AppText>
    </Card>
  );
}
