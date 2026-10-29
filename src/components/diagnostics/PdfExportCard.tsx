import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { InfoChip } from '@/components/InfoChip';
import { Skeleton } from '@/components/Skeleton';
import type {
  LatencyBandwidthCorrelation,
  LossSlice,
} from '@/types/diagnostics';

export interface PdfExportCardProps {
  onExport: () => void;
  exporting: boolean;
  loss: LossSlice[];
  bandwidth: LatencyBandwidthCorrelation | null;
  /** Keeps the loss chip in place while the saved tests are still loading. */
  lossLoading?: boolean;
}

/**
 * Export card. Generates the PDF entirely in the browser with jsPDF — there is
 * no server round-trip and no wait for a report to be queued.
 */
export function PdfExportCard({
  onExport,
  exporting,
  loss,
  bandwidth,
  lossLoading = false,
}: PdfExportCardProps) {
  const lost = loss.find((slice) => slice.label === 'Perdidos')?.value;

  return (
    <Card
      title="Exportar informe"
      subtitle="El diagnóstico se genera en PDF en este dispositivo"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {bandwidth ? (
            <>
              <InfoChip variant="highlight">
                {bandwidth.avg_latency_ms} ms de media
              </InfoChip>
              <InfoChip>
                ↓ {bandwidth.bandwidth.downlink_mbps ?? '—'} Mbps
              </InfoChip>
              <InfoChip>
                ↑ {bandwidth.bandwidth.uplink_mbps ?? '—'} Mbps
              </InfoChip>
            </>
          ) : (
            <InfoChip>Sin velocidad medida</InfoChip>
          )}

          {lossLoading ? (
            <Skeleton className="h-[30px] w-28 rounded-chip" />
          ) : (
            lost !== undefined && (
              <InfoChip>{lost.toFixed(1)}% de pérdida (histórico)</InfoChip>
            )
          )}
        </div>

        <AppText variant="caption" className="block text-muted">
          El PDF incluye la velocidad medida, la latencia de Cloudflare y el
          historial de pérdida. ARP, traceroute y el escaneo de puertos
          necesitan un agente local y no están disponibles en el navegador.
        </AppText>

        <Button
          loading={exporting}
          disabled={exporting}
          onClick={onExport}
          className="self-start"
        >
          <Icon name="download" size={16} />
          Generar PDF
        </Button>
      </div>
    </Card>
  );
}
