import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
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
import { useSettingsStore } from '@/store/settingsStore';
import { downloadBlob } from '@/lib/utils/download';

export function HistoryPage() {
  const queryClient = useQueryClient();
  const autoSaveCsv = useSettingsStore((s) => s.autoSaveCsv);

  const [exportError, setExportError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const testsQuery = useQuery({
    queryKey: ['tests'],
    queryFn: () => getTests(null),
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
        `uppping-tests-${new Date().toISOString().slice(0, 10)}.csv`
      );
    } catch (err) {
      setExportError(
        err instanceof Error ? err.message : 'Export failed. Please try again.'
      );
    } finally {
      setExporting(false);
    }
  };

  const items = testsQuery.data?.items ?? [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="History"
        subtitle="Every saved ping run on this device."
        action={
          <Button
            variant="secondary"
            size="sm"
            loading={exporting}
            onClick={() => void handleExport()}
          >
            <Icon name="download" size={16} />
            Export CSV
          </Button>
        }
      />

      {autoSaveCsv && (
        <div className="rounded-control border border-border bg-tint px-4 py-3">
          <AppText variant="caption" className="block text-secondary">
            Auto-save CSV is on in Settings — results are kept on download.
          </AppText>
        </div>
      )}

      {exportError && (
        <div role="alert" className="rounded-control bg-danger-soft px-4 py-3">
          <AppText variant="caption" className="block text-danger">
            {exportError}
          </AppText>
        </div>
      )}

      <Card
        title="Saved tests"
        subtitle={testsQuery.data ? `${items.length} on this page` : undefined}
        flush
      >
        {testsQuery.isError ? (
          <ErrorState
            message="Could not load your saved tests."
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
            title="No saved tests yet"
            description="Run a ping test from the dashboard and save the result to see it here."
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
      </Card>

      <div className="flex justify-center">
        <InfoChip>Stored locally until the backend is connected</InfoChip>
      </div>
    </div>
  );
}