import { useId } from 'react';
import { AppText } from '@/components/AppText';

export interface ToggleProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  /** Optional inline description under the label. */
  description?: string;
  disabled?: boolean;
  /** Accessible name when no visible label is rendered. */
  label?: string;
}

/**
 * Switch built from a native checkbox so it stays keyboard accessible and
 * announces its state correctly.
 */
export function Toggle({
  checked,
  onChange,
  description,
  disabled = false,
  label,
}: ToggleProps) {
  const id = useId();
  const descriptionId = description ? `${id}-description` : undefined;

  return (
    <div className="flex items-start justify-between gap-4">
      {(label || description) && (
        <div className="min-w-0">
          {label && (
            <label htmlFor={id} className="block cursor-pointer">
              <AppText variant="body" className="font-medium">
                {label}
              </AppText>
            </label>
          )}
          {description && (
            <AppText
              variant="caption"
              id={descriptionId}
              className="mt-0.5 block text-muted"
            >
              {description}
            </AppText>
          )}
        </div>
      )}

      <span className="relative inline-flex shrink-0 items-center">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          disabled={disabled}
          aria-label={label ? undefined : 'Alternar'}
          aria-describedby={descriptionId}
          onChange={(e) => onChange(e.target.checked)}
          className="peer sr-only"
        />
        <span
          aria-hidden="true"
          className={[
            'block h-6 w-11 rounded-badge border transition-colors duration-150',
            checked ? 'border-transparent gradient-brand' : 'border-border bg-tint',
            disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
            'peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-teal',
          ].join(' ')}
        />
        <span
          aria-hidden="true"
          className={[
            'pointer-events-none absolute top-0.5 left-0.5 size-5 rounded-full bg-surface shadow-raised',
            'transition-transform duration-150',
            checked ? 'translate-x-5' : 'translate-x-0',
          ].join(' ')}
        />
      </span>
    </div>
  );
}