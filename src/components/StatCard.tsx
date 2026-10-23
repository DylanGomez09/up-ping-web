import type { ReactNode } from 'react';
import { AppText } from '@/components/AppText';

export interface StatCardProps {
  label: string;
  /** Unit suffix for numeric values, e.g. "ms" or "%". */
  unit?: string;
  value: ReactNode;
  /** Small contextual line below the value. */
  hint?: string;
  /** Accent the icon mark; defaults to the brand gradient. */
  mark?: ReactNode;
  /** Skeleton state while the value is still loading. */
  loading?: boolean;
}

/**
 * Dashboard metric tile: label, mono value, optional unit and hint, plus a
 * rounded gradient mark.
 */
export function StatCard({
  label,
  unit,
  value,
  hint,
  mark,
  loading = false,
}: StatCardProps) {
  return (
    <div className="rounded-card border border-border bg-surface p-5 shadow-card">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <AppText variant="section" className="block text-secondary">
            {label}
          </AppText>

          <div className="mt-2 flex items-baseline gap-1.5">
            {loading ? (
              <span className="h-7 w-20 animate-pulse rounded-mark bg-tint" />
            ) : (
              <>
                <AppText variant="data" mono className="text-primary">
                  {value}
                </AppText>
                {unit && (
                  <AppText variant="body" className="text-secondary">
                    {unit}
                  </AppText>
                )}
              </>
            )}
          </div>

          {hint && (
            <AppText variant="caption" className="mt-1 block text-muted">
              {hint}
            </AppText>
          )}
        </div>

        {mark && (
          <div
            aria-hidden="true"
            className="flex size-10 shrink-0 items-center justify-center rounded-mark gradient-brand text-deep"
          >
            {mark}
          </div>
        )}
      </div>
    </div>
  );
}