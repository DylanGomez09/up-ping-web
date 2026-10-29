import type { CSSProperties, ReactNode } from 'react';

export interface SkeletonProps {
  className?: string;
  /** Inline size overrides, for heights that come from a prop. */
  style?: CSSProperties;
}

/**
 * Neutral loading block. The soft sweep lives in `index.css` (`.skeleton`) so
 * every placeholder animates in sync and respects reduced-motion.
 */
export function Skeleton({ className = 'h-4 w-full', style }: SkeletonProps) {
  // Callers sometimes override the radius (`rounded-full` for the donut); only
  // add the default mark when they have not chosen one, so the two utilities
  // never fight over the same corner.
  const radius = /(^|\s)rounded-/.test(className) ? '' : 'rounded-mark';

  return (
    <div
      aria-hidden="true"
      style={style}
      className={['skeleton', radius, className].filter(Boolean).join(' ')}
    />
  );
}

export interface SkeletonGroupProps {
  children: ReactNode;
  /** Screen-reader announcement while the placeholders are visible. */
  label?: string;
  className?: string;
}

/**
 * Wraps a content-shaped skeleton so assistive tech announces a single loading
 * state instead of ignoring a wall of `aria-hidden` blocks.
 */
export function SkeletonGroup({
  children,
  label = 'Cargando contenido',
  className = '',
}: SkeletonGroupProps) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className={className}>
      <span className="sr-only">{label}</span>
      {children}
    </div>
  );
}
