import { Button } from '@/components/Button';
import { Icon } from '@/components/Icon';
import { AppText } from '@/components/AppText';

export interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

/** Shown when a query fails. Always offers a way back. */
export function ErrorState({
  message,
  onRetry,
  retryLabel = 'Try again',
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center px-6 py-8 text-center"
    >
      <div
        aria-hidden="true"
        className="mb-3 flex size-12 items-center justify-center rounded-mark bg-danger-soft text-danger"
      >
        <Icon name="activity" size={24} />
      </div>
      <AppText variant="subtitle" className="text-primary">
        Something went wrong
      </AppText>
      <AppText variant="caption" className="mt-1.5 max-w-sm text-muted">
        {message}
      </AppText>
      {onRetry && (
        <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
          {retryLabel}
        </Button>
      )}
    </div>
  );
}