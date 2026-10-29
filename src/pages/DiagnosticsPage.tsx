import { useMemo } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { AccountUpsell } from '@/components/AccountUpsell';
import { AppText } from '@/components/AppText';
import { InfoChip } from '@/components/InfoChip';
import { PageHeader } from '@/components/shell/Sidebar';
import { BandwidthCard } from '@/components/diagnostics/BandwidthCard';
import { PdfExportCard } from '@/components/diagnostics/PdfExportCard';
import { UnavailableToolsCard } from '@/components/diagnostics/UnavailableToolsCard';
import { measureBandwidth } from '@/lib/api/bandwidth';
import { getTests } from '@/lib/api/tests';
import { buildLossSlices } from '@/lib/utils/aggregate';
import { useGeneratePdf } from '@/hooks/useGeneratePdf';
import { useAuthStore } from '@/store/authStore';

export function DiagnosticsPage() {
  const pdf = useGeneratePdf();
  const accessToken = useAuthStore((s) => s.accessToken);

  const testsQuery = useQuery({
    queryKey: ['tests', 'diagnostics'],
    queryFn: () => getTests(null, 100),
    enabled: Boolean(accessToken),
  });

  const lossSlices = useMemo(
    () => buildLossSlices(testsQuery.data?.items ?? []),
    [testsQuery.data]
  );

  const bandwidth = useMutation({
    mutationFn: measureBandwidth,
  });

  const handleExport = () => {
    void pdf.generate({
      arp: null,
      traceroute: null,
      portScan: null,
      bandwidth: bandwidth.data ?? null,
      loss: lossSlices,
    });
  };

  const bandwidthError =
    bandwidth.isError && bandwidth.error instanceof Error
      ? bandwidth.error.message
      : bandwidth.isError
        ? 'No se pudo medir la velocidad.'
        : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Diagnóstico"
        subtitle="Mediciones reales disponibles desde este navegador."
        action={<InfoChip variant="highlight">En vivo</InfoChip>}
      />

      {pdf.error && (
        <div role="alert" className="rounded-control bg-danger-soft px-4 py-3">
          <AppText variant="caption" className="block text-danger">
            {pdf.error}
          </AppText>
        </div>
      )}

      <BandwidthCard
        data={bandwidth.data ?? null}
        running={bandwidth.isPending}
        error={bandwidthError}
        onRun={() => bandwidth.mutate()}
      />

      <UnavailableToolsCard />

      <PdfExportCard
        onExport={handleExport}
        exporting={pdf.exporting}
        loss={lossSlices}
        bandwidth={bandwidth.data ?? null}
        lossLoading={testsQuery.isLoading}
      />

      {!accessToken && (
        <AccountUpsell
          title="Guarda tus diagnósticos"
          description="Con una cuenta puedes conservar las pruebas de latencia, ver tendencias y exportar el historial completo a CSV."
          returnTo="/diagnostics"
        />
      )}
    </div>
  );
}
