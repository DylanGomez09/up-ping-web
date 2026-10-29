import { useId, useLayoutEffect, useMemo, useRef, useState } from 'react';
import type { SpeedPhase, SpeedSample } from '@/types/diagnostics';

export interface SpeedChartProps {
  samples: SpeedSample[];
  /** Phase currently transferring; drives the pulse on the newest sample. */
  activePhase?: SpeedPhase | null;
  running?: boolean;
  /** Chart height in px. The SVG is measured to the container width. */
  height?: number;
}

const MARGIN = { top: 18, right: 18, bottom: 26, left: 46 };
const MIN_WIDTH = 260;
const TICK_COUNT = 4;

interface ChartPoint {
  x: number;
  y: number;
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
 * Y domain starts at zero — a speed chart that hides the baseline exaggerates
 * small differences — and the top tick is rounded up so labels stay readable.
 */
function buildYAxis(peak: number) {
  const step = niceStep(Math.max(peak, 1) / TICK_COUNT);
  const max = Math.max(step, Math.ceil((Math.max(peak, 1) * 1.08) / step) * step);
  const ticks: number[] = [];

  for (let value = 0; value <= max + step / 2; value += step) {
    ticks.push(Math.round(value * 100) / 100);
  }

  return { max, ticks };
}

function formatMbps(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function formatSeconds(value: number): string {
  return `${value < 10 ? value.toFixed(1) : Math.round(value)}s`;
}

function buildLine(points: ChartPoint[], startX: number): string {
  if (points.length === 0) {
    return '';
  }

  if (points.length === 1) {
    const point = points[0];
    return `M ${startX.toFixed(2)} ${point.y.toFixed(2)} L ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  }

  return points
    .map(
      (point, index) =>
        `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    )
    .join(' ');
}

function buildArea(
  points: ChartPoint[],
  startX: number,
  baseline: number
): string {
  if (points.length === 0) {
    return '';
  }

  const last = points[points.length - 1];

  return `${buildLine(points, startX)} L ${last.x.toFixed(2)} ${baseline.toFixed(2)} L ${startX.toFixed(2)} ${baseline.toFixed(2)} Z`;
}

/** Measures the real pixel width so the plot never stretches its typography. */
function useChartWidth() {
  const ref = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(MIN_WIDTH);

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
 * Throughput over time for one speed run. Download and upload are drawn on a
 * single time axis, so the upload curve starts where the download ended and a
 * dashed divider marks the hand-over.
 *
 * The samples are indicative: the headline figure in the card always comes
 * from total bytes over total time.
 */
export function SpeedChart({
  samples,
  activePhase = null,
  running = false,
  height = 200,
}: SpeedChartProps) {
  const { ref, width } = useChartWidth();
  const rawId = useId();
  const uid = rawId.replace(/[^a-zA-Z0-9_-]/g, '');
  const downloadAreaId = `speed-download-${uid}`;
  const uploadAreaId = `speed-upload-${uid}`;

  const geometry = useMemo(() => {
    const downloads = samples.filter((sample) => sample.phase === 'download');
    const uploads = samples.filter((sample) => sample.phase === 'upload');

    const downloadEnd = downloads.length
      ? downloads[downloads.length - 1].t
      : 0;
    const uploadEnd = uploads.length ? uploads[uploads.length - 1].t : 0;
    // Without download samples the upload curve starts at zero.
    const offset = downloads.length > 0 ? downloadEnd : 0;
    const span = Math.max(downloadEnd, offset + uploadEnd, 0.2);
    const peak = samples.reduce((max, sample) => Math.max(max, sample.mbps), 0);
    const axis = buildYAxis(peak);

    const plotLeft = MARGIN.left;
    const plotTop = MARGIN.top;
    const plotWidth = Math.max(1, width - MARGIN.left - MARGIN.right);
    const plotHeight = Math.max(1, height - MARGIN.top - MARGIN.bottom);
    const plotRight = plotLeft + plotWidth;
    const plotBottom = plotTop + plotHeight;

    const xFor = (t: number) => plotLeft + (t / span) * plotWidth;
    const yFor = (mbps: number) =>
      plotTop +
      plotHeight -
      (Math.min(Math.max(mbps, 0), axis.max) / axis.max) * plotHeight;

    const toPoints = (list: SpeedSample[], shift: number): ChartPoint[] =>
      list.map((sample) => ({
        x: xFor(sample.t + shift),
        y: yFor(sample.mbps),
      }));

    const downloadPoints = toPoints(downloads, 0);
    const uploadPoints = toPoints(uploads, offset);

    const xStep = niceStep(span / TICK_COUNT);
    const xTicks: number[] = [];
    for (let value = 0; value <= span + 1e-9; value += xStep) {
      xTicks.push(Math.round(value * 100) / 100);
    }

    return {
      axis,
      plotLeft,
      plotTop,
      plotRight,
      plotBottom,
      xFor,
      xTicks,
      downloadPoints,
      uploadPoints,
      downloadLine: buildLine(downloadPoints, plotLeft),
      downloadArea: buildArea(downloadPoints, plotLeft, plotBottom),
      uploadLine: buildLine(uploadPoints, xFor(offset)),
      uploadArea: buildArea(uploadPoints, xFor(offset), plotBottom),
      dividerX: downloads.length > 0 && uploads.length > 0 ? xFor(offset) : null,
      pulse:
        activePhase === 'download'
          ? (downloadPoints[downloadPoints.length - 1] ?? null)
          : activePhase === 'upload'
            ? (uploadPoints[uploadPoints.length - 1] ?? null)
            : null,
      pulseColor:
        activePhase === 'upload' ? 'var(--c-mint)' : 'var(--c-teal)',
    };
  }, [samples, width, height, activePhase]);

  const ariaLabel = useMemo(() => {
    const describe = (phase: SpeedPhase) => {
      const list = samples.filter((sample) => sample.phase === phase);
      if (list.length === 0) {
        return null;
      }

      const peak = Math.max(...list.map((sample) => sample.mbps));
      const average =
        list.reduce((sum, sample) => sum + sample.mbps, 0) / list.length;

      return `${phase === 'download' ? 'descarga' : 'subida'} pico ${Math.round(
        peak
      )} Mbps, media ${Math.round(average)} Mbps`;
    };

    const parts = [describe('download'), describe('upload')].filter(
      (part): part is string => part !== null
    );

    return parts.length > 0
      ? `Curva de velocidad: ${parts.join('; ')}.`
      : 'Curva de velocidad sin datos.';
  }, [samples]);

  if (samples.length === 0) {
    return (
      <div
        ref={ref}
        style={{ height }}
        className="flex items-center justify-center rounded-mark border border-dashed border-border px-4 text-center text-[12px] text-muted"
      >
        La curva aparecerá al empezar la medición.
      </div>
    );
  }

  return (
    <div ref={ref}>
      <div className="mb-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full bg-teal" />
          Descarga
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className="size-2 rounded-full bg-mint" />
          Subida
        </span>
        {running && (
          <span className="ml-auto font-mono text-secondary">
            {activePhase === 'upload'
              ? 'Midiendo subida…'
              : activePhase === 'download'
                ? 'Midiendo descarga…'
                : 'Midiendo…'}
          </span>
        )}
      </div>

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="block max-w-full"
        role="img"
        aria-label={ariaLabel}
      >
        <defs>
          <linearGradient id={downloadAreaId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--c-teal)" stopOpacity="0.28" />
            <stop offset="100%" stopColor="var(--c-teal)" stopOpacity="0" />
          </linearGradient>
          <linearGradient id={uploadAreaId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--c-mint)" stopOpacity="0.32" />
            <stop offset="100%" stopColor="var(--c-mint)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid + Mbps labels. */}
        {geometry.axis.ticks.map((tick) => {
          const y = geometry.plotBottom - (tick / geometry.axis.max) * (geometry.plotBottom - geometry.plotTop);

          return (
            <g key={`y-${tick}`}>
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
                {formatMbps(tick)}
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
          Mbps
        </text>

        {/* Time axis. */}
        {geometry.xTicks.map((tick) => (
          <text
            key={`x-${tick}`}
            x={geometry.xFor(tick)}
            y={height - 8}
            textAnchor="middle"
            fontSize={10}
            fontFamily="var(--font-mono)"
            fill="var(--c-text-muted)"
          >
            {formatSeconds(tick)}
          </text>
        ))}

        {/* Phase hand-over. */}
        {geometry.dividerX !== null && (
          <line
            x1={geometry.dividerX}
            x2={geometry.dividerX}
            y1={geometry.plotTop}
            y2={geometry.plotBottom}
            stroke="var(--c-border)"
            strokeWidth={1}
            strokeDasharray="4 4"
          />
        )}

        {geometry.downloadArea && (
          <path
            d={geometry.downloadArea}
            fill={`url(#${downloadAreaId})`}
            stroke="none"
          />
        )}
        {geometry.uploadArea && (
          <path
            d={geometry.uploadArea}
            fill={`url(#${uploadAreaId})`}
            stroke="none"
          />
        )}

        {geometry.downloadLine && (
          <path
            d={geometry.downloadLine}
            fill="none"
            stroke="var(--c-teal)"
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {geometry.uploadLine && (
          <path
            d={geometry.uploadLine}
            fill="none"
            stroke="var(--c-mint)"
            strokeWidth={2.25}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Newest reading while the transfer is still running. */}
        {running && geometry.pulse && (
          <>
            <circle
              className="chart-live-pulse"
              cx={geometry.pulse.x}
              cy={geometry.pulse.y}
              r={5}
              fill="none"
              stroke={geometry.pulseColor}
              strokeWidth={2}
            />
            <circle
              cx={geometry.pulse.x}
              cy={geometry.pulse.y}
              r={3}
              fill={geometry.pulseColor}
            />
          </>
        )}
      </svg>
    </div>
  );
}
