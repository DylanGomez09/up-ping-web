import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Link } from 'react-router-dom';
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
import { getLatency24h, getLossSlices } from '@/lib/api/diagnostics';
import { saveTest } from '@/lib/api/tests';
import { usePingTest } from '@/hooks/usePingTest';
import { useAuthStore } from '@/store/authStore';
import { isDemoSession } from '@/lib/demo';

const DEFAULT_TARGET = '8.8.8.8';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [target, setTarget] = useState(DEFAULT_TARGET);
  const test = usePingTest();

  const saveMutation = useMutation({
    mutationFn: saveTest,
  });

  const latency24h = useLatencyTrend();

  const handleSave = async () => {
    const result = test.toTestResult();
    if (!result) {
      return;
    }
    await saveMutation.mutateAsync(result);
    test.reset();
  };

  const running = test.status === 'running';

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={user ? `Hello, ${user.name}` : 'Dashboard'}
        subtitle="Measure latency and packet loss across your workshop network."
        action={
          <InfoChip variant="highlight">
            {isDemoSession() ? 'Demo session' : `${test.samples.length} probes`}
          </InfoChip>
        }
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
            placeholder="8.8.8.8"
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
              <Button onClick={() => test.start(target)}>
                <Icon name="play" size={16} />
                Start test
              </Button>
            )}

            <Button
              variant="secondary"
              onClick={handleSave}
              disabled={test.status !== 'finished' || saveMutation.isPending}
              loading={saveMutation.isPending}
            >
              Save result
            </Button>
          </div>
        </div>

        <div className="mt-5">
          {test.samples.length > 0 ? (
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
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Loss breakdown" subtitle="Delivered vs lost packets">
          <LossPanel />
        </Card>

        <Card title="Last 24 hours" subtitle="Latency trend across the day">
          {latency24h.isError ? (
            <ErrorState
              message="Could not load the latency trend."
              onRetry={() => void latency24h.refetch()}
            />
          ) : latency24h.isLoading ? (
            <Skeleton className="h-14 w-full" />
          ) : (
            <LatencySparkline points={latency24h.data ?? []} />
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

function LossPanel() {
  const query = useLossSlices();

  if (query.isError) {
    return (
      <ErrorState
        message="Could not load the loss breakdown."
        onRetry={() => void query.refetch()}
      />
    );
  }

  if (query.isLoading) {
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

  const slices = query.data ?? [];

  return (
    <div className="flex items-center gap-5">
      <LossDonut
        slices={slices}
        centerLabel="Loss"
        centerValue={`${(slices[1]?.value ?? 0).toFixed(1)}%`}
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

function useLatencyTrend() {
  return useQuery({ queryKey: ['diagnostics', 'latency-24h'], queryFn: getLatency24h });
}

function useLossSlices() {
  return useQuery({ queryKey: ['diagnostics', 'loss-slices'], queryFn: getLossSlices });
}