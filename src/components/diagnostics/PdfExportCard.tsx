import { useQuery } from '@tanstack/react-query';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { ErrorState } from '@/components/ErrorState';
import { Icon } from '@/components/Icon';
import { InfoChip } from '@/components/InfoChip';
import { Skeleton } from '@/components/Skeleton';
import { getBandwidthCorrelation, getLossSlices } from '@/lib/api/diagnostics';

export interface PdfExportCardProps {
  onExport: () => void;
  exporting: boolean;
}

/**
 * Export card. Generates the PDF entirely in the browser with jsPDF — there is
 * no server round-trip and no wait for a report to be queued.
 */
export function PdfExportCard({ onExport, exporting }: PdfExportCardProps) {
  const loss = useQuery({
    queryKey: ['diagnostics', 'loss-slices'],
    queryFn: getLossSlices,
  });
  const bandwidth = useQuery({
    queryKey: ['diagnostics', 'bandwidth'],
    queryFn: getBandwidthCorrelation,
  });

  const loading = loss.isLoading || bandwidth.isLoading;
  const errored = loss.isError || bandwidth.isError;

  return (
    <Card
      title="Export report"
      subtitle="Diagnostics are rendered into a PDF on this device"
    >
      {errored ? (
        <ErrorState
          message="Could not gather the data for the report."
          onRetry={() => {
            void loss.refetch();
            void bandwidth.refetch();
          }}
        />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {loading ? (
              <Skeleton className="h-7 w-40" />
            ) : (
              <>
                <InfoChip variant="highlight">
                  {bandwidth.data?.avg_latency_ms ?? '—'} ms avg
                </InfoChip>
                <InfoChip>
                  {(loss.data?.[1]?.value ?? 0).toFixed(1)}% loss
                </InfoChip>
                <InfoChip>
                  ↓ {bandwidth.data?.bandwidth.downlink_mbps ?? '—'} Mbps
                </InfoChip>
              </>
            )}
          </div>

          <AppText variant="caption" className="block text-muted">
            The PDF includes the summary, ARP inventory, traceroute hops, port
            scan results and the measured bandwidth figures.
          </AppText>

          <Button
            loading={exporting}
            disabled={loading || errored}
            onClick={onExport}
            className="self-start"
          >
            <Icon name="download" size={16} />
            Generate PDF
          </Button>
        </div>
      )}
    </Card>
  );
}