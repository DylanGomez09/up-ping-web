import {
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Skeleton } from '@/components/Skeleton';
import type { PingSample } from '@/types/test';

export interface PingChartProps {
  samples: PingSample[];
  /** Chart height in px. The SVG is measured to the container width. */
  height?: number;
  /** Average used for the dashed reference line and to flag slow probes. */
  averageMs?: number;
  /** Adds a live pulse on the newest delivered probe. */
  running?: boolean;
}

const MARGIN = { top: 22, right: 16, bottom: 28, left: 48 };
const MIN_WIDTH = 260;
/** Above this many probes, dots would turn the line into a solid band. */
const MAX_DOTS = 32;
const TICK_COUNT = 4;

interface ChartPoint {
  index: number;
  x: number;
  y: number;
  rtt: number;
  sample: PingSample;
  slow: boolean;
}

interface LostPoint {
  index: number;
  x: number;
  sample: PingSample;
}

function niceStep(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }

  const exponent = Math.floor(Math.log10(value));
  const fraction = value / 10 ** exponent;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return nice * 10 ** exponent;
}

/**
 * Padded domain with round tick values. Padding keeps the line away from the
 * frame, and the nice step stops the axis from showing values like 37.421.
 */
function buildScale(values: number[]) {
  if (values.length === 0) {
    return { min: 0, max: 1, ticks: [0, 0.5, 1] };
  }

  const low = Math.min(...values);
  const high = Math.max(...values);
  const spread = Math.max(high - low, high * 0.12, 1);
  const paddedLow = Math.max(0, low - spread * 0.3);
  const paddedHigh = high + spread * 0.3;

  const step = niceStep((paddedHigh - paddedLow) / TICK_COUNT);
  const min = Math.floor(paddedLow / step) * step;
  const max = Math.max(min + step, Math.ceil(paddedHigh / step) * step);

  const ticks: number[] = [];
  for (let value = min; value <= max + step / 2; value += step) {
    ticks.push(Math.round(value * 100) / 100);
  }

  return { min, max, ticks };
}

/** Measures the real pixel width so the plot never stretches its typography. */
function useChartWidth() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const measure = () => {
      setWidth(Math.max(MIN_WIDTH, Math.round(element.clientWidth)));
    };

    measure();

    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', measure);
      return () => window.removeEventListener('resize', measure);
    }

    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { ref, width };
}

/**
 * Live ping plot.
 *
 * - gradient area + line so the shape reads at a glance
 * - dashed average line and y-axis ticks in ms
 * - warning-coloured dots for probes above 1.6× the average
 * - danger crosses at the baseline for probes without a reply
 * - hover/focus tooltip with the probe number, RTT and time
 * - a pulsing ring on the newest probe while the test is running
 */
export function PingChart({
  samples,
  height = 220,
  averageMs,
  running = false,
}: PingChartProps) {
  const { ref, width } = useChartWidth();
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const areaId = `ping-area-${uid}`;
  const lineId = `ping-line-${uid}`;

  const geometry = useMemo(() => {
    const plotLeft = MARGIN.left;
    const plotRight = Math.max(plotLeft + 24, width - MARGIN.right);
    const plotTop = MARGIN.top;
    const plotBottom = Math.max(plotTop + 24, height - MARGIN.bottom);
    const plotWidth = plotRight - plotLeft;
    const plotHeight = plotBottom - plotTop;

    const values = samples
      .map((sample) => sample.rtt_ms)
      .filter((value): value is number => value !== null);

    const average =
      averageMs ??
      (values.length > 0
        ? values.reduce((sum, value) => sum + value, 0) / values.length
        : 0);

    const scale = buildScale(values);
    const range = scale.max - scale.min || 1;
    const slowThreshold = average > 0 ? average * 1.6 : Number.POSITIVE_INFINITY;

    const xFor = (index: number) =>
      samples.length <= 1
        ? plotLeft + plotWidth / 2
        : plotLeft + (index / (samples.length - 1)) * plotWidth;

    const yFor = (rtt: number) =>
      plotTop + plotHeight - ((rtt - scale.min) / range) * plotHeight;

    const points: Array<ChartPoint | null> = samples.map((sample, index) => {
      if (sample.rtt_ms === null) {
        return null;
      }

      return {
        index,
        x: xFor(index),
        y: yFor(sample.rtt_ms),
        rtt: sample.rtt_ms,
        sample,
        slow: sample.rtt_ms > slowThreshold,
      };
    });

    const segments: ChartPoint[][] = [];
    let current: ChartPoint[] = [];

    for (const point of points) {
      if (point) {
        current.push(point);
      } else if (current.length > 0) {
        segments.push(current);
        current = [];
      }
    }
    if (current.length > 0) {
      segments.push(current);
    }

    const shapes = segments.map((segment) => {
      const first = segment[0];
      const last = segment[segment.length - 1];
      const line = segment
        .map((point, index) => {
          const command = index === 0 ? 'M' : 'L';
          return `${command} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
        })
        .join(' ');

      const area =
        segment.length > 1
          ? `${line} L ${last.x.toFixed(2)} ${plotBottom} L ${first.x.toFixed(2)} ${plotBottom} Z`
          : '';

      return { key: `segment-${first.index}`, line, area };
    });

    const lost: LostPoint[] = [];
    samples.forEach((sample, index) => {
      if (sample.rtt_ms === null) {
        lost.push({ index, x: xFor(index), sample });
      }
    });

    const lastPoint =
      [...points].reverse().find((point): point is ChartPoint => point !== null) ??
      null;

    const averageY =
      plotTop + plotHeight - ((average - scale.min) / range) * plotHeight;

    return {
      plotLeft,
      plotRight,
      plotTop,
      plotBottom,
      plotWidth,
      plotHeight,
      points,
      lost,
      shapes,
      scale,
      average,
      averageY,
      xFor,
      lastPoint,
      hasSlow: points.some((point) => point?.slow),
    };
  }, [samples, averageMs, width, height]);

  const hoveredIndex =
    hoverIndex !== null && hoverIndex >= 0 && hoverIndex < samples.length
      ? hoverIndex
      : null;
  const hoveredSample =
    hoveredIndex !== null ? samples[hoveredIndex] : undefined;
  const hoveredPoint =
    hoveredIndex !== null ? geometry.points[hoveredIndex] : null;

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (samples.length === 0) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;

    if (x < geometry.plotLeft - 12 || x > geometry.plotRight + 12) {
      setHoverIndex(null);
      return;
    }

    if (samples.length === 1) {
      setHoverIndex(0);
      return;
    }

    const ratio = (x - geometry.plotLeft) / geometry.plotWidth;
    const index = Math.round(ratio * (samples.length - 1));
    setHoverIndex(Math.max(0, Math.min(samples.length - 1, index)));
  };

  if (samples.length === 0) {
    return (
      <div
        className="w-full"
        role={running ? 'status' : undefined}
        aria-live={running ? 'polite' : undefined}
      >
        <div ref={ref} className="relative w-full" style={{ height }}>
          {running && (
            <Skeleton className="h-full w-full rounded-control" />
          )}
        </div>

        {running && (
          <>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">
              <Skeleton className="h-[18px] w-16" />
              <Skeleton className="h-[18px] w-24" />
              <Skeleton className="h-[18px] w-20" />
            </div>
            <span className="sr-only">Esperando la primera sonda…</span>
          </>
        )}
      </div>
    );
  }

  const lostCount = geometry.lost.length;
  const deliveredCount = samples.length - lostCount;
  const maxTick = Math.max(Math.abs(geometry.scale.max), Math.abs(geometry.scale.min));
  const formatTick = (value: number) =>
    maxTick < 10 ? value.toFixed(1) : value.toFixed(0);

  const showDots = samples.length <= MAX_DOTS;
  const timeLabel = hoveredSample
    ? new Date(hoveredSample.timestamp).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      })
    : '';

  const xLabels: Array<{ index: number; x: number; anchor: 'start' | 'middle' | 'end' }> = [];
  if (samples.length === 1) {
    xLabels.push({ index: 0, x: geometry.xFor(0), anchor: 'start' });
  } else {
    xLabels.push({ index: 0, x: geometry.xFor(0), anchor: 'start' });
    if (samples.length > 2 && geometry.plotWidth >= 460) {
      const middle = Math.floor((samples.length - 1) / 2);
      xLabels.push({ index: middle, x: geometry.xFor(middle), anchor: 'middle' });
    }
    xLabels.push({
      index: samples.length - 1,
      x: geometry.xFor(samples.length - 1),
      anchor: 'end',
    });
  }

  // Tooltip box geometry, kept inside the plot where possible.
  const tooltipWidth = 132;
  const tooltipHeight = 64;
  const hoveredY = hoveredPoint
    ? hoveredPoint.y
    : geometry.plotBottom - 4;
  let tooltipX = geometry.xFor(hoveredIndex ?? 0) + 12;
  if (tooltipX + tooltipWidth > geometry.plotRight) {
    tooltipX = geometry.xFor(hoveredIndex ?? 0) - tooltipWidth - 12;
  }
  tooltipX = Math.max(
    geometry.plotLeft,
    Math.min(tooltipX, geometry.plotRight - tooltipWidth)
  );
  let tooltipY = hoveredY - tooltipHeight - 14;
  if (tooltipY < geometry.plotTop) {
    tooltipY = hoveredY + 16;
  }
  tooltipY = Math.max(4, Math.min(tooltipY, height - tooltipHeight - 4));

  return (
    <div className="w-full">
      <div ref={ref} className="relative w-full" style={{ height }}>
        {width > 0 && (
          <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className="block max-w-full touch-pan-y"
            role="img"
            aria-label={`Latencia de ${samples.length} sondas: ${deliveredCount} con respuesta, ${lostCount} sin respuesta. Media ${geometry.average.toFixed(1)} ms.`}
            onPointerMove={handlePointerMove}
            onPointerDown={handlePointerMove}
            onPointerLeave={() => setHoverIndex(null)}
          >
            <defs>
              <linearGradient id={areaId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--c-teal)" stopOpacity="0.36" />
                <stop offset="70%" stopColor="var(--c-teal)" stopOpacity="0.08" />
                <stop offset="100%" stopColor="var(--c-teal)" stopOpacity="0" />
              </linearGradient>
              <linearGradient id={lineId} x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="var(--c-teal-deep)" />
                <stop offset="55%" stopColor="var(--c-teal)" />
                <stop offset="100%" stopColor="var(--c-mint)" />
              </linearGradient>
            </defs>

            {/* Horizontal grid + y-axis labels in ms. */}
            {geometry.scale.ticks.map((tick) => {
              const y =
                geometry.plotTop +
                geometry.plotHeight -
                ((tick - geometry.scale.min) /
                  (geometry.scale.max - geometry.scale.min || 1)) *
                  geometry.plotHeight;

              return (
                <g key={tick}>
                  <line
                    x1={geometry.plotLeft}
                    x2={geometry.plotRight}
                    y1={y}
                    y2={y}
                    stroke="var(--c-border)"
                    strokeWidth={1}
                    strokeDasharray="2 6"
                    opacity={0.9}
                  />
                  <text
                    x={geometry.plotLeft - 8}
                    y={y}
                    textAnchor="end"
                    dominantBaseline="middle"
                    fontSize={10}
                    fontFamily="var(--font-mono)"
                    fill="var(--c-text-muted)"
                  >
                    {formatTick(tick)}
                  </text>
                </g>
              );
            })}

            <text
              x={4}
              y={12}
              textAnchor="start"
              fontSize={9}
              fontWeight={600}
              letterSpacing="0.4"
              fontFamily="var(--font-mono)"
              fill="var(--c-text-muted)"
            >
              ms
            </text>

            {/* Area and line, drawn per continuous segment so losses leave a gap. */}
            {geometry.shapes.map((shape) => (
              <g key={shape.key}>
                {shape.area && (
                  <path
                    d={shape.area}
                    fill={`url(#${areaId})`}
                    stroke="none"
                  />
                )}
                <path
                  d={shape.line}
                  fill="none"
                  stroke={`url(#${lineId})`}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </g>
            ))}

            {/* Average reference line. */}
            {geometry.average > 0 && (
              <>
                <line
                  x1={geometry.plotLeft}
                  x2={geometry.plotRight}
                  y1={geometry.averageY}
                  y2={geometry.averageY}
                  stroke="var(--c-warning)"
                  strokeWidth={1.25}
                  strokeDasharray="5 5"
                  opacity={0.75}
                />
                <text
                  x={geometry.plotRight}
                  y={Math.max(12, geometry.averageY - 6)}
                  textAnchor="end"
                  fontSize={10}
                  fontWeight={600}
                  fontFamily="var(--font-mono)"
                  fill="var(--c-warning)"
                >
                  media {Math.round(geometry.average)} ms
                </text>
              </>
            )}

            {/* Delivered probes: dots while the series is small, plus the newest. */}
            {showDots &&
              geometry.points.map((point) =>
                point ? (
                  <circle
                    key={`dot-${point.index}`}
                    cx={point.x}
                    cy={point.y}
                    r={3}
                    fill={point.slow ? 'var(--c-warning)' : 'var(--c-teal)'}
                    stroke="var(--c-surface)"
                    strokeWidth={1.5}
                  />
                ) : null
              )}

            {!showDots && geometry.lastPoint && (
              <circle
                cx={geometry.lastPoint.x}
                cy={geometry.lastPoint.y}
                r={3.5}
                fill="var(--c-teal)"
                stroke="var(--c-surface)"
                strokeWidth={1.5}
              />
            )}

            {/* Lost probes: soft danger halo with a clear cross at the baseline. */}
            {geometry.lost.map((lost) => (
              <g key={`lost-${lost.index}`}>
                <circle
                  cx={lost.x}
                  cy={geometry.plotBottom - 4}
                  r={5.5}
                  fill="var(--c-danger-soft)"
                />
                <line
                  x1={lost.x - 3}
                  x2={lost.x + 3}
                  y1={geometry.plotBottom - 7}
                  y2={geometry.plotBottom - 1}
                  stroke="var(--c-danger)"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
                <line
                  x1={lost.x - 3}
                  x2={lost.x + 3}
                  y1={geometry.plotBottom - 1}
                  y2={geometry.plotBottom - 7}
                  stroke="var(--c-danger)"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
              </g>
            ))}

            {/* Sequence labels at both ends (and the middle on wide charts). */}
            {xLabels.map((label) => (
              <text
                key={`x-${label.index}`}
                x={label.x}
                y={height - 9}
                textAnchor={label.anchor}
                fontSize={10}
                fontFamily="var(--font-mono)"
                fill="var(--c-text-muted)"
              >
                #{samples[label.index].seq}
              </text>
            ))}

            {/* Live ring on the newest delivered probe. */}
            {running && geometry.lastPoint && (
              <g>
                <circle
                  cx={geometry.lastPoint.x}
                  cy={geometry.lastPoint.y}
                  r={4}
                  fill="var(--c-teal)"
                  stroke="var(--c-surface)"
                  strokeWidth={2}
                />
                <circle
                  className="chart-live-pulse"
                  cx={geometry.lastPoint.x}
                  cy={geometry.lastPoint.y}
                  r={5}
                  fill="none"
                  stroke="var(--c-teal)"
                  strokeWidth={2}
                />
              </g>
            )}

            {/* Hover guide and focus marker. */}
            {hoveredIndex !== null && (
              <g pointerEvents="none">
                <line
                  x1={geometry.xFor(hoveredIndex)}
                  x2={geometry.xFor(hoveredIndex)}
                  y1={geometry.plotTop}
                  y2={geometry.plotBottom}
                  stroke="var(--c-teal)"
                  strokeWidth={1}
                  strokeDasharray="3 4"
                  opacity={0.45}
                />
                {hoveredPoint ? (
                  <circle
                    cx={hoveredPoint.x}
                    cy={hoveredPoint.y}
                    r={5}
                    fill="var(--c-surface)"
                    stroke={
                      hoveredPoint.slow ? 'var(--c-warning)' : 'var(--c-teal)'
                    }
                    strokeWidth={2.5}
                  />
                ) : (
                  <circle
                    cx={geometry.xFor(hoveredIndex)}
                    cy={geometry.plotBottom - 4}
                    r={7}
                    fill="none"
                    stroke="var(--c-danger)"
                    strokeWidth={1.5}
                  />
                )}
              </g>
            )}

            {/* Tooltip stays inside the plot rect. */}
            {hoveredSample && (
              <g pointerEvents="none">
                <rect
                  x={tooltipX}
                  y={tooltipY}
                  width={tooltipWidth}
                  height={tooltipHeight}
                  rx={10}
                  fill="var(--c-surface)"
                  stroke="var(--c-border)"
                  strokeWidth={1}
                />
                <text
                  x={tooltipX + 12}
                  y={tooltipY + 18}
                  fontSize={10}
                  fontWeight={600}
                  letterSpacing="0.3"
                  fontFamily="var(--font-mono)"
                  fill="var(--c-text-muted)"
                >
                  Sonda #{hoveredSample.seq}
                </text>
                <text
                  x={tooltipX + 12}
                  y={tooltipY + 38}
                  fontSize={14}
                  fontWeight={600}
                  fontFamily="var(--font-mono)"
                  fill={
                    hoveredSample.rtt_ms === null
                      ? 'var(--c-danger)'
                      : 'var(--c-text-primary)'
                  }
                >
                  {hoveredSample.rtt_ms === null
                    ? 'Sin respuesta'
                    : `${hoveredSample.rtt_ms.toFixed(1)} ms`}
                </text>
                <text
                  x={tooltipX + 12}
                  y={tooltipY + 54}
                  fontSize={10}
                  fontFamily="var(--font-mono)"
                  fill="var(--c-text-muted)"
                >
                  {timeLabel}
                </text>
              </g>
            )}
          </svg>
        )}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] leading-[18px] font-medium text-secondary">
        <span className="inline-flex items-center gap-1.5">
          <span
            aria-hidden="true"
            className="size-2 rounded-full"
            style={{
              backgroundImage:
                'linear-gradient(135deg, var(--c-teal), var(--c-mint))',
            }}
          />
          Latencia
        </span>

        {geometry.average > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="h-0 w-4 border-t border-dashed border-warning"
            />
            Media {geometry.average.toFixed(1)} ms
          </span>
        )}

        {geometry.hasSlow && (
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="size-2 rounded-full bg-warning"
            />
            Sonda lenta
          </span>
        )}

        {lostCount > 0 && (
          <span className="inline-flex items-center gap-1.5">
            <span
              aria-hidden="true"
              className="text-[13px] leading-none font-bold text-danger"
            >
              ×
            </span>
            Sin respuesta ({lostCount})
          </span>
        )}
      </div>
    </div>
  );
}
