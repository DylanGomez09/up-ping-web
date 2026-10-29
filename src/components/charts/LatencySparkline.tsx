import { useMemo } from 'react';
import type { LatencyPoint } from '@/types/diagnostics';

export interface LatencySparklineProps {
  points: LatencyPoint[];
  height?: number;
}

/**
 * Compact 24-hour latency trend, drawn client-side from the tests saved in the
 * last day.
 */
export function LatencySparkline({ points, height = 56 }: LatencySparklineProps) {
  const width = 320;
  const padding = 4;

  const path = useMemo(() => {
    if (points.length < 2) {
      return '';
    }

    const values = points.map((p) => p.ms);
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;

    const plotWidth = width - padding * 2;
    const plotHeight = height - padding * 2;
    const stepX = plotWidth / (points.length - 1);

    return points
      .map((point, i) => {
        const x = (padding + i * stepX).toFixed(2);
        const y = (
          padding +
          plotHeight -
          ((point.ms - min) / range) * plotHeight
        ).toFixed(2);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [points, height]);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className="h-auto w-full text-teal"
      role="img"
      aria-label="Latencia de las últimas 24 horas"
    >
      {path && (
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}