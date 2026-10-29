import { useMemo } from 'react';
import type { PingSample } from '@/types/test';

export interface PingChartProps {
  samples: PingSample[];
  /** Chart height in px. The SVG scales to the container width. */
  height?: number;
  /** Average used to centre the y-domain so small variations stay visible. */
  averageMs?: number;
}

const VIEW_WIDTH = 600;
const PADDING = { top: 8, right: 8, bottom: 8, left: 8 };

/**
 * Live ping plot: one tick per probe, connected by a single 2px polyline in
 * `currentColor` (teal by default). No library, no fill area, no grid.
 *
 * Lost probes (`rtt_ms === null`) are rendered as teal tick marks at the
 * bottom of the plot so a gap in the line is still visible as "no reply".
 */
export function PingChart({
  samples,
  height = 160,
  averageMs,
}: PingChartProps) {
  const width = VIEW_WIDTH;
  const padding = PADDING;
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;

  const geometry = useMemo(() => {
    const values = samples
      .map((s) => s.rtt_ms)
      .filter((v): v is number => v !== null);

    if (values.length === 0) {
      return { path: '', lostTicks: [], max: 0, min: 0 };
    }

    const rawMin = Math.min(...values);
    const rawMax = Math.max(...values);

    // Centre the domain on the average so a stable line still shows movement.
    const centre = averageMs ?? (rawMin + rawMax) / 2;
    const spread = Math.max(rawMax - rawMin, centre - rawMin, rawMax - centre, 2);
    const min = Math.max(0, centre - spread * 1.6);
    const max = centre + spread * 1.6;
    const range = max - min || 1;

    const stepX = samples.length > 1 ? plotWidth / (samples.length - 1) : 0;
    const toY = (ms: number) =>
      padding.top + plotHeight - ((ms - min) / range) * plotHeight;
    const toX = (i: number) => padding.left + i * stepX;

    let path = '';
    let penDown = false;

    samples.forEach((sample, i) => {
      if (sample.rtt_ms === null) {
        penDown = false;
        return;
      }
      const x = toX(i).toFixed(2);
      const y = toY(sample.rtt_ms).toFixed(2);
      path += penDown ? ` L ${x} ${y}` : ` M ${x} ${y}`;
      penDown = true;
    });

    const lostTicks = samples
      .map((sample, i) => ({ sample, x: toX(i) }))
      .filter(({ sample }) => sample.rtt_ms === null)
      .map(({ x }) => ({
        x1: (x - 1.5).toFixed(2),
        x2: (x + 1.5).toFixed(2),
        y1: (padding.top + plotHeight).toFixed(2),
        y2: (padding.top + plotHeight - 5).toFixed(2),
      }));

    return { path: path.trim(), lostTicks, max: rawMax, min: rawMin };
  }, [samples, averageMs, plotWidth, plotHeight, padding.top, padding.bottom]);

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-auto w-full text-teal"
        role="img"
        aria-label={`Latencia sobre ${samples.length} sondas`}
      >
        {geometry.path && (
          <path
            d={geometry.path}
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        )}
        {geometry.lostTicks.map((tick, i) => (
          <line
            key={i}
            x1={tick.x1}
            x2={tick.x2}
            y1={tick.y1}
            y2={tick.y2}
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </div>
  );
}