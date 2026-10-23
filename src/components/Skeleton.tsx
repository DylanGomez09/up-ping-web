export interface SkeletonProps {
  className?: string;
}

/** Neutral shimmer block used by every loading state. */
export function Skeleton({ className = 'h-4 w-full' }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-mark bg-tint ${className}`}
    />
  );
}