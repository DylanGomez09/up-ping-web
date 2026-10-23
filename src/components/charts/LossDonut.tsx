import type { LossSlice } from '@/types/diagnostics';

export interface LossDonutProps {
  slices: LossSlice[];
  /** Diameter in px. */
  size?: number;
  /** Text rendered in the hole. */
  centerLabel: string;
  centerValue: string;
}

const RADIUS = 42;
const STROKE = 14;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Donut breakdown of delivered vs lost packets. Colours come from the caller
 * as CSS custom properties so the chart follows the active theme.
 */
export function LossDonut({
  slices,
  size = 120,
  centerLabel,
  centerValue,
}: LossDonutProps) {
  const total = slices.reduce((sum, s) => sum + s.value, 0);
  let offset = 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className="shrink-0"
      role="img"
      aria-label={`${centerLabel}: ${centerValue}`}
    >
      <g transform="translate(50 50) rotate(-90)">
        {total <= 0 && (
          <circle
            r={RADIUS}
            fill="none"
            stroke="var(--c-border)"
            strokeWidth={STROKE}
          />
        )}
        {slices.map((slice) => {
          const fraction = total > 0 ? slice.value / total : 0;
          const dash = fraction * CIRCUMFERENCE;
          const segment = (
            <circle
              key={slice.label}
              r={RADIUS}
              fill="none"
              stroke={slice.color}
              strokeWidth={STROKE}
              strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
            />
          );
          offset += dash;
          return segment;
        })}
      </g>
    </svg>
  );
}

export interface LossLegendRow {
  label: string;
  value: string;
  color: string;
}

export function LossLegend({ rows }: { rows: LossLegendRow[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <li key={row.label} className="flex items-center gap-2.5">
          <span
            aria-hidden="true"
            className="size-2.5 rounded-full"
            style={{ backgroundColor: row.color }}
          />
          <span className="flex-1 text-[13px] leading-[18px] font-medium text-secondary">
            {row.label}
          </span>
          <span className="font-mono text-[13px] font-semibold text-primary">
            {row.value}
          </span>
        </li>
      ))}
    </ul>
  );
}