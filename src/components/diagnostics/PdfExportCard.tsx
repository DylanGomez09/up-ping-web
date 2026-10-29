import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { InfoChip } from '@/components/InfoChip';
import type {
  LatencyBandwidthCorrelation,
  LossSlice,
} from '@/types/diagnostics';

export interface PdfExportCardProps {
  onExport: () => void;
  exporting: boolean;
  loss: LossSlice[];
  bandwidth: LatencyBandwidthCorrelation | null;
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
}: PdfExportCardProps) {
  const lost = loss.find((slice) => slice.label === 'Lost')?.value;

  return (
    <Card
      title="Export report"
      subtitle="Diagnostics are rendered into a PDF on this device"
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {bandwidth ? (
            <>
              <InfoChip variant="highlight">
                {bandwidth.avg_latency_ms} ms avg
              </InfoChip>
              <InfoChip>
                ↓ {bandwidth.bandwidth.downlink_mbps ?? '—'} Mbps
              </InfoChip>
              <InfoChip>
                ↑ {bandwidth.bandwidth.uplink_mbps ?? '—'} Mbps
              </InfoChip>
            </>
          ) : (
            <InfoChip>No bandwidth measured</InfoChip>
          )}

          {lost !== undefined && <InfoChip>{lost.toFixed(1)}% loss</InfoChip>}
        </div>

        <AppText variant="caption" className="block text-muted">
          The PDF includes the summary, measured bandwidth and packet-loss
          figures. ARP, traceroute and port scans require a local agent and are
          not available in the browser.
        </AppText>

        <Button
          loading={exporting}
          disabled={exporting}
          onClick={onExport}
          className="self-start"
        >
          <Icon name="download" size={16} />
          Generate PDF
        </Button>
      </div>
    </Card>
  );
}
