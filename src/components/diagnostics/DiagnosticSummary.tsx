import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AppText } from '@/components/AppText';
import { Card } from '@/components/Card';
import { Icon } from '@/components/Icon';
import { Skeleton } from '@/components/Skeleton';
import {
  getArpScan,
  getBandwidthCorrelation,
  getLatency24h,
  getLossSlices,
  getTracerouteLatest,
} from '@/lib/api/diagnostics';
import { LatencySparkline } from '@/components/charts/LatencySparkline';
import { LossDonut, LossLegend } from '@/components/charts/LossDonut';
import type { IconName } from '@/components/Icon';

interface Finding {
  icon: IconName;
  label: string;
  value: string;
  tone: 'ok' | 'warn' | 'bad';
}

/**
 * Top-of-page verdict: pulls the headline number out of every diagnostic and
 * turns it into a short list of findings, plus the two trend visuals.
 */
export function DiagnosticSummary() {
  const arp = useQuery({ queryKey: ['diagnostics', 'arp'], queryFn: getArpScan });
  const traceroute = useQuery({
    queryKey: ['diagnostics', 'traceroute', '8.8.8.8'],
    queryFn: () => getTracerouteLatest('8.8.8.8'),
  });
  const bandwidth = useQuery({
    queryKey: ['diagnostics', 'bandwidth'],
    queryFn: getBandwidthCorrelation,
  });
  const latency = useQuery({
    queryKey: ['diagnostics', 'latency-24h'],
    queryFn: getLatency24h,
  });
  const loss = useQuery({ queryKey: ['diagnostics', 'loss-slices'], queryFn: getLossSlices });

  const loading =
    arp.isLoading || traceroute.isLoading || bandwidth.isLoading || latency.isLoading || loss.isLoading;

  const findings = useMemo<Finding[]>(() => {
    const out: Finding[] = [];

    if (arp.data) {
      const unauthorized = arp.data.unauthorized.length;
      out.push({
        icon: 'server',
        label: unauthorized > 0 ? 'Unknown devices found' : 'All devices known',
        value:
          unauthorized > 0
            ? `${unauthorized} unauthorized`
            : `${arp.data.entries.length} recognized`,
        tone: unauthorized > 0 ? 'bad' : 'ok',
      });
    }

    if (traceroute.data) {
      const broke = traceroute.data.broke_at_hop;
      out.push({
        icon: 'activity',
        label: broke ? `Path breaks at hop ${broke}` : 'Path reaches the target',
        value: traceroute.data.cause,
        tone: broke ? 'warn' : 'ok',
      });
    }

    if (bandwidth.data) {
      out.push({
        icon: 'wifi',
        label: 'Bandwidth health',
        value: bandwidth.data.verdict,
        tone:
          bandwidth.data.verdict === 'ok'
            ? 'ok'
            : bandwidth.data.verdict === 'warning'
              ? 'warn'
              : 'bad',
      });
    }

    return out;
  }, [arp.data, traceroute.data, bandwidth.data]);

  const TONE: Record<Finding['tone'], string> = {
    ok: 'text-teal',
    warn: 'text-warning',
    bad: 'text-danger',
  };

  return (
    <Card
      title="Summary"
      subtitle="Headline findings across every diagnostic"
      action={
        <span
          aria-hidden="true"
          className="flex size-10 items-center justify-center rounded-mark gradient-brand text-deep"
        >
          <Icon name="radar" size={20} />
        </span>
      }
    >
      {loading ? (
        <div className="flex flex-col gap-3">
          <Skeleton className="h-11 w-full" />
          <Skeleton className="h-11 w-full" />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {findings.length > 0 ? (
            <ul className="flex flex-col gap-2.5">
              {findings.map((finding) => (
                <li
                  key={finding.label}
                  className="flex items-center gap-3 rounded-control bg-tint px-3.5 py-2.5"
                >
                  <span className={TONE[finding.tone]}>
                    <Icon name={finding.icon} size={18} />
                  </span>
                  <AppText variant="body" className="flex-1 text-primary">
                    {finding.label}
                  </AppText>
                  <AppText variant="label" mono className={TONE[finding.tone]}>
                    {finding.value}
                  </AppText>
                </li>
              ))}
            </ul>
          ) : (
            <AppText variant="caption" className="block text-muted">
              Run the diagnostics below to build the summary.
            </AppText>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <div className="flex items-center gap-4">
              <LossDonut
                slices={loss.data ?? []}
                size={104}
                centerLabel="Loss"
                centerValue={`${(loss.data?.[1]?.value ?? 0).toFixed(1)}%`}
              />
              <div className="min-w-0 flex-1">
                <LossLegend
                  rows={(loss.data ?? []).map((slice) => ({
                    label: slice.label,
                    value: `${slice.value.toFixed(1)}%`,
                    color: slice.color,
                  }))}
                />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <AppText variant="section" className="block text-secondary">
                Last 24 hours
              </AppText>
              <LatencySparkline points={latency.data ?? []} />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}