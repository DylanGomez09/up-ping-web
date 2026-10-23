import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AppText } from '@/components/AppText';
import { InfoChip } from '@/components/InfoChip';
import { PageHeader } from '@/components/shell/Sidebar';
import { DiagnosticSummary } from '@/components/diagnostics/DiagnosticSummary';
import { ArpScanCard } from '@/components/diagnostics/ArpScanCard';
import { TracerouteCard } from '@/components/diagnostics/TracerouteCard';
import { PortScanCard } from '@/components/diagnostics/PortScanCard';
import { BandwidthCard } from '@/components/diagnostics/BandwidthCard';
import { PdfExportCard } from '@/components/diagnostics/PdfExportCard';
import {
  getArpScan,
  getBandwidthCorrelation,
  getLossSlices,
  getTracerouteLatest,
  runPortScan,
} from '@/lib/api/diagnostics';
import { useGeneratePdf } from '@/hooks/useGeneratePdf';
import { isDemoSession } from '@/lib/demo';

const SUMMARY_TARGET = '8.8.8.8';
const SUMMARY_HOST = '192.168.1.31';

export function DiagnosticsPage() {
  const queryClient = useQueryClient();
  const pdf = useGeneratePdf();

  const arp = useQuery({ queryKey: ['diagnostics', 'arp'], queryFn: getArpScan });
  const traceroute = useQuery({
    queryKey: ['diagnostics', 'traceroute', SUMMARY_TARGET],
    queryFn: () => getTracerouteLatest(SUMMARY_TARGET),
  });
  const portScan = useQuery({
    queryKey: ['diagnostics', 'portscan', SUMMARY_HOST],
    queryFn: () => runPortScan(SUMMARY_HOST),
  });
  const bandwidth = useQuery({
    queryKey: ['diagnostics', 'bandwidth'],
    queryFn: getBandwidthCorrelation,
  });
  const loss = useQuery({
    queryKey: ['diagnostics', 'loss-slices'],
    queryFn: getLossSlices,
  });

  const handleExport = () => {
    void pdf.generate({
      arp: arp.data ?? null,
      traceroute: traceroute.data ?? null,
      portScan: portScan.data ?? null,
      bandwidth: bandwidth.data ?? null,
      loss: loss.data ?? [],
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Diagnostics"
        subtitle="Five checks that isolate where a network problem lives."
        action={
          <InfoChip variant={isDemoSession() ? 'highlight' : 'neutral'}>
            {isDemoSession() ? 'Demo data' : 'Live scan'}
          </InfoChip>
        }
      />

      {pdf.error && (
        <div role="alert" className="rounded-control bg-danger-soft px-4 py-3">
          <AppText variant="caption" className="block text-danger">
            {pdf.error}
          </AppText>
        </div>
      )}

      <DiagnosticSummary />

      <ArpScanCard
        onRescan={() => void queryClient.invalidateQueries({ queryKey: ['diagnostics'] })}
      />

      <TracerouteCard />

      <PortScanCard />

      <BandwidthCard />

      <PdfExportCard onExport={handleExport} exporting={pdf.exporting} />
    </div>
  );
}