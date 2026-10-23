import { useId } from 'react';
import { AppText } from '@/components/AppText';

export interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  /** Rendered on the right of the label row, e.g. "1 s". */
  valueLabel: string;
  onChange: (next: number) => void;
  disabled?: boolean;
}

/**
 * Range input whose track is filled up to the current value with a gradient.
 * The native element stays on top so dragging and keyboard stepping behave
 * normally; thumb styling lives in index.css.
 */
export function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  valueLabel,
  onChange,
  disabled = false,
}: SliderProps) {
  const id = useId();
  const percent = max > min ? ((value - min) / (max - min)) * 100 : 0;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <label htmlFor={id}>
          <AppText variant="label" className="text-secondary">
            {label}
          </AppText>
        </label>
        <AppText variant="label" mono className="text-primary">
          {valueLabel}
        </AppText>
      </div>

      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          backgroundImage: `linear-gradient(to right, var(--c-teal) 0%, var(--c-teal) ${percent}%, var(--c-border) ${percent}%, var(--c-border) 100%)`,
        }}
        className={[
          'h-1.5 w-full cursor-pointer appearance-none rounded-badge',
          'disabled:cursor-not-allowed disabled:opacity-50',
        ].join(' ')}
      />
    </div>
  );
}