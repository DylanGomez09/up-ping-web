import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AccountUpsell } from '@/components/AccountUpsell';
import { AppText } from '@/components/AppText';
import { InfoChip } from '@/components/InfoChip';
import { PageHeader } from '@/components/shell/Sidebar';
import { PdfExportCard } from '@/components/diagnostics/PdfExportCard';
import { SpeedTestCard } from '@/components/diagnostics/SpeedTestCard';
import { UnavailableToolsCard } from '@/components/diagnostics/UnavailableToolsCard';
import { getTests } from '@/lib/api/tests';
import { buildLossSlices } from '@/lib/utils/aggregate';
import { useGeneratePdf } from '@/hooks/useGeneratePdf';
import { useSpeedTest } from '@/hooks/useSpeedTest';
import { useAuthStore } from '@/store/authStore';

export function DiagnosticsPage() {
  const pdf = useGeneratePdf();
  const accessToken = useAuthStore((s) => s.accessToken);
  const speed = useSpeedTest();

  const testsQuery = useQuery({
    queryKey: ['tests', 'diagnostics'],
    queryFn: () => getTests(null, 100),
    enabled: Boolean(accessToken),
  });

  const lossSlices = useMemo(
    () => buildLossSlices(testsQuery.data?.items ?? []),
    [testsQuery.data]
  );

  const handleExport = () => {
    void pdf.generate({
      arp: null,
      traceroute: null,
      portScan: null,
      bandwidth: speed.result,
      loss: lossSlices,
    });
  };

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

      <SpeedTestCard
        data={speed.result}
        status={speed.status}
        phase={speed.phase}
        samples={speed.samples}
        error={speed.error}
        onRun={speed.start}
        onReset={speed.reset}
      />

      <UnavailableToolsCard />

      <PdfExportCard
        onExport={handleExport}
        exporting={pdf.exporting}
        loss={lossSlices}
        bandwidth={speed.result}
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
