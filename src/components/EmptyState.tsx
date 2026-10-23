import type { ReactNode } from 'react';
import { AppText } from '@/components/AppText';

export interface EmptyStateProps {
  title: string;
  description?: string;
  /** Icon or illustration, rendered above the title. */
  mark?: ReactNode;
  action?: ReactNode;
}

/** Shown when a list or feed has no items yet. */
export function EmptyState({
  title,
  description,
  mark,
  action,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center px-6 py-10 text-center">
      {mark && (
        <div
          aria-hidden="true"
          className="mb-4 flex size-14 items-center justify-center rounded-mark bg-tint text-muted"
        >
          {mark}
        </div>
      )}
      <AppText variant="subtitle" className="text-primary">
        {title}
      </AppText>
      {description && (
        <AppText variant="caption" className="mt-1.5 max-w-xs text-muted">
          {description}
        </AppText>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}