import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { ErrorState } from '@/components/ErrorState';
import { Field } from '@/components/Field';
import { Icon } from '@/components/Icon';
import { InfoChip } from '@/components/InfoChip';
import { PageHeader } from '@/components/shell/Sidebar';
import { Skeleton } from '@/components/Skeleton';
import { StatCard } from '@/components/StatCard';
import { LatencySparkline } from '@/components/charts/LatencySparkline';
import { LossDonut, LossLegend } from '@/components/charts/LossDonut';
import { PingChart } from '@/components/charts/PingChart';
import { getTests, saveTest } from '@/lib/api/tests';
import { buildLatency24h, buildLossSlices } from '@/lib/utils/aggregate';
import { usePingTest } from '@/hooks/usePingTest';
import { useAuthStore } from '@/store/authStore';
import { isDemoSession } from '@/lib/demo';
import type { LossSlice } from '@/types/diagnostics';

const DEFAULT_TARGET = '8.8.8.8';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const queryClient = useQueryClient();
  const [target, setTarget] = useState(DEFAULT_TARGET);
  const [saveError, setSaveError] = useState<string | null>(null);
  const test = usePingTest();

  const saveMutation = useMutation({
    mutationFn: saveTest,
  });

  const testsQuery = useQuery({
    queryKey: ['tests', 'recent'],
    queryFn: () => getTests(null, 100),
  });

  const savedTests = testsQuery.data?.items ?? [];
  const latencyPoints = useMemo(
    () => buildLatency24h(savedTests),
    [savedTests]
  );
  const lossSlices = useMemo(() => buildLossSlices(savedTests), [savedTests]);

  const handleSave = async () => {
    const result = test.toTestResult();
    if (!result) {
      setSaveError('Run at least one probe before saving the result.');
      return;
    }

    setSaveError(null);
    try {
      await saveMutation.mutateAsync(result);
      await queryClient.invalidateQueries({ queryKey: ['tests'] });
      test.reset();
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : 'Could not save the result. Please try again.'
      );
    }
  };

  const running = test.status === 'running';

  const statusLabel = isDemoSession()
    ? 'Demo session'
    : running
      ? 'Live probe'
      : test.samples.length > 0
        ? `${test.samples.length} probes`
        : 'Ready';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={user ? `Hello, ${user.name}` : 'Dashboard'}
        subtitle="Measure latency and packet loss from this browser."
        action={<InfoChip variant={running ? 'highlight' : 'neutral'}>{statusLabel}</InfoChip>}
      />

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Average latency"
          unit="ms"
          value={test.avgLatencyMs || '—'}
          hint={test.samples.length > 0 ? `${test.samples.length} probes sent` : 'Run a test to populate'}
          mark={<Icon name="activity" size={20} />}
          loading={running && test.samples.length === 0}
        />
        <StatCard
          label="Packet loss"
          unit="%"
          value={test.samples.length > 0 ? test.lossPercent.toFixed(1) : '—'}
          hint="Probes with no reply"
          mark={<Icon name="wifi" size={20} />}
          loading={running && test.samples.length === 0}
        />
        <StatCard
          label="Interval"
          unit="s"
          value={test.intervalS}
          hint="Between probes"
          mark={<Icon name="clock" size={20} />}
        />
        <StatCard
          label="Timeout"
          unit="s"
          value={test.timeoutS}
          hint="Per probe"
          mark={<Icon name="radar" size={20} />}
        />
      </section>

      <Card
        title="Ping test"
        subtitle={
          running
            ? `Probing ${test.target} every ${test.intervalS}s`
            : 'Measure round-trip time to a host or IP'
        }
        action={
          <Button variant="secondary" size="sm" onClick={test.reset} disabled={test.status === 'idle'}>
            Clear
          </Button>
        }
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Field
            label="Target host or IP"
            containerClassName="flex-1"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="8.8.8.8 or dns.google"
            hint="Public hosts use https://; LAN hosts use http://."
            autoComplete="off"
            spellCheck={false}
            disabled={running}
            error={test.error}
          />

          <div className="flex gap-2 sm:pb-0">
            {running ? (
              <Button variant="danger" onClick={test.stop}>
                <Icon name="stop" size={16} />
                Stop
              </Button>
            ) : (
              <Button
                onClick={() => {
                  setSaveError(null);
                  test.start(target);
                }}
              >
                <Icon name="play" size={16} />
                Start test
              </Button>
            )}

            <Button
              variant="secondary"
              onClick={() => void handleSave()}
              disabled={test.status !== 'finished' || saveMutation.isPending}
              loading={saveMutation.isPending}
            >
              Save result
            </Button>
          </div>
        </div>

        {saveError && (
          <div role="alert" className="mt-4 rounded-control bg-danger-soft px-4 py-3">
            <AppText variant="caption" className="block text-danger">
              {saveError}
            </AppText>
          </div>
        )}

        <div className="mt-5">
          {test.samples.length > 0 || test.status === 'running' ? (
            <PingChart
              samples={test.samples}
              averageMs={test.avgLatencyMs || undefined}
            />
          ) : (
            <EmptyState
              mark={<Icon name="chart-bars" size={26} />}
              title="No probes yet"
              description="Start a test to plot round-trip time per probe. Lost probes appear as ticks under the line."
            />
          )}
        </div>

        <AppText variant="caption" className="mt-4 block text-muted">
          Browser probes time a real HTTP request (DNS + TCP + TLS + response).
          Browsers cannot send ICMP, so values run slightly higher than `ping`.
        </AppText>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Loss breakdown" subtitle="Delivered vs lost across saved tests">
          <LossPanel
            slices={lossSlices}
            loading={testsQuery.isLoading}
            error={testsQuery.isError}
            onRetry={() => void testsQuery.refetch()}
          />
        </Card>

        <Card title="Last 24 hours" subtitle="Average latency per hour from saved tests">
          {testsQuery.isError ? (
            <ErrorState
              message="Could not load your saved tests."
              onRetry={() => void testsQuery.refetch()}
            />
          ) : testsQuery.isLoading ? (
            <Skeleton className="h-14 w-full" />
          ) : latencyPoints.length < 2 ? (
            <EmptyState
              mark={<Icon name="activity" size={26} />}
              title="Not enough history yet"
              description="Save at least two tests in the last 24 hours to draw the latency trend."
            />
          ) : (
            <LatencySparkline points={latencyPoints} />
          )}
        </Card>
      </div>

      <div className="flex justify-center">
        <Link
          to="/diagnostics"
          className="text-[14px] font-semibold text-teal transition-opacity hover:opacity-80"
        >
          Run full diagnostics →
        </Link>
      </div>
    </div>
  );
}

function LossPanel({
  slices,
  loading,
  error,
  onRetry,
}: {
  slices: LossSlice[];
  loading: boolean;
  error: boolean;
  onRetry: () => void;
}) {
  if (error) {
    return (
      <ErrorState message="Could not load the loss breakdown." onRetry={onRetry} />
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-5">
        <Skeleton className="size-[120px] rounded-full" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
    );
  }

  if (slices.length === 0) {
    return (
      <EmptyState
        mark={<Icon name="wifi" size={26} />}
        title="No saved packets yet"
        description="Run a ping test and save it to see delivered vs lost packets here."
      />
    );
  }

  const lost = slices.find((slice) => slice.label === 'Lost')?.value ?? 0;

  return (
    <div className="flex items-center gap-5">
      <LossDonut
        slices={slices}
        centerLabel="Loss"
        centerValue={`${lost.toFixed(1)}%`}
      />
      <div className="min-w-0 flex-1">
        <LossLegend
          rows={slices.map((slice) => ({
            label: slice.label,
            value: `${slice.value.toFixed(1)}%`,
            color: slice.color,
          }))}
        />
      </div>
    </div>
  );
}
