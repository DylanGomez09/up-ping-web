import type { ReactNode } from 'react';
import { AppText } from '@/components/AppText';

export interface InfoChipProps {
  children: ReactNode;
  /**
   * `highlight` fills the chip with the brand gradient and dark text. The
   * default is a neutral tint surface.
   */
  variant?: 'neutral' | 'highlight';
  className?: string;
}

/**
 * Rounded pill for compact metadata. The gradient variant is used for the
 * active connection status.
 */
export function InfoChip({
  children,
  variant = 'neutral',
  className = '',
}: InfoChipProps) {
  return (
    <span
      className={[
        'inline-flex max-w-full items-center gap-1.5 rounded-chip px-3 py-1.5',
        variant === 'highlight'
          ? 'gradient-brand text-deep'
          : 'bg-tint text-secondary',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {typeof children === 'string' ? (
        <AppText variant="chip" mono>
          {children}
        </AppText>
      ) : (
        children
      )}
    </span>
  );
}