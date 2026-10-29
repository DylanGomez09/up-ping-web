import { useState } from 'react';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AccountUpsell } from '@/components/AccountUpsell';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Icon } from '@/components/Icon';
import { InfoChip } from '@/components/InfoChip';
import { PageHeader } from '@/components/shell/Sidebar';
import { Skeleton } from '@/components/Skeleton';
import { TestCard } from '@/components/TestCard';
import { deleteTest, exportTests, getTests } from '@/lib/api/tests';
import { downloadBlob } from '@/lib/utils/download';
import { useAuthStore } from '@/store/authStore';

export function HistoryPage() {
  const queryClient = useQueryClient();
  const accessToken = useAuthStore((s) => s.accessToken);

  const [exportError, setExportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const testsQuery = useInfiniteQuery({
    queryKey: ['tests'],
    queryFn: ({ pageParam }) => getTests(pageParam, 50),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.next_cursor,
    enabled: Boolean(accessToken),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tests'] });
    },
  });

  const handleExport = async () => {
    setExporting(true);
    setExportError(null);
    try {
      const csv = await exportTests();
      downloadBlob(
        new Blob([csv], { type: 'text/csv;charset=utf-8' }),
        `uppping-pruebas-${new Date().toISOString().slice(0, 10)}.csv`
      );
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : 'La exportación falló. Inténtalo de nuevo.'
      );
    } finally {
      setExporting(false);
    }
  };

  const items = testsQuery.data?.pages.flatMap((page) => page.items) ?? [];
  const total = testsQuery.data?.pages[0]?.total;

  if (!accessToken) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Historial"
          subtitle="Tus pruebas guardadas, tendencias y exportación."
        />
        <AccountUpsell
          title="Tu historial empieza con una cuenta"
          description="Puedes medir sin registrarte, pero guardar resultados y exportarlos necesita una cuenta. Es gratis y tarda menos de un minuto."
          returnTo="/history"
        />
        <Card title="Qué obtienes" subtitle="Solo para cuentas registradas">
          <ul className="flex flex-col gap-3">
            {[
              'Cada prueba guardada con su latencia, pérdida y fecha.',
              'Desglose acumulado y tendencia de las últimas 24 horas.',
              'Exportación CSV de todo tu historial.',
              'Disponible cuando vuelvas desde cualquier navegador.',
            ].map((line) => (
              <li key={line} className="flex items-start gap-2.5">
                <span aria-hidden="true" className="mt-0.5 text-teal">
                  <Icon name="check" size={16} strokeWidth={2.2} />
                </span>
                <AppText variant="caption" className="text-secondary">
                  {line}
                </AppText>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Historial"
        subtitle="Cada prueba de ping guardada en tu cuenta de UpPing."
        action={
          <Button
            variant="secondary"
            size="sm"
            loading={exporting}
            onClick={() => void handleExport()}
          >
            <Icon name="download" size={16} />
            Exportar CSV
          </Button>
        }
      />

      {exportError && (
        <div role="alert" className="rounded-control bg-danger-soft px-4 py-3">
          <AppText variant="caption" className="block text-danger">
            {exportError}
          </AppText>
        </div>
      )}

      {deleteMutation.isError && (
        <div role="alert" className="rounded-control bg-danger-soft px-4 py-3">
          <AppText variant="caption" className="block text-danger">
            {deleteMutation.error instanceof Error
              ? deleteMutation.error.message
              : 'No se pudo borrar la prueba.'}
          </AppText>
        </div>
      )}

      <Card
        title="Pruebas guardadas"
        subtitle={
          total !== undefined
            ? `${total} guardadas · mostrando ${items.length}`
            : undefined
        }
        flush
      >
        {testsQuery.isError ? (
          <ErrorState
            message="No se pudieron cargar tus pruebas guardadas."
            onRetry={() => void testsQuery.refetch()}
          />
        ) : testsQuery.isLoading ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            mark={<Icon name="clock" size={26} />}
            title="Aún no hay pruebas guardadas"
            description="Ejecuta una prueba de ping desde el panel y guarda el resultado para verlo aquí."
          />
        ) : (
          <ul className="flex flex-col gap-3">
            {items.map((test) => (
              <li key={test.id}>
                <TestCard
                  test={test}
                  deleting={
                    deleteMutation.isPending && deleteMutation.variables === test.id
                  }
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              </li>
            ))}
          </ul>
        )}

        {testsQuery.hasNextPage && (
          <div className="mt-4 flex justify-center">
            <Button
              variant="secondary"
              size="sm"
              loading={testsQuery.isFetchingNextPage}
              onClick={() => void testsQuery.fetchNextPage()}
            >
              Cargar más
            </Button>
          </div>
        )}
      </Card>

      <div className="flex justify-center">
        <InfoChip>Sincronizado con tu cuenta de UpPing</InfoChip>
      </div>
    </div>
  );
}
