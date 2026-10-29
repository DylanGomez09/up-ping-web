import { useId } from 'react';
import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { AppText } from '@/components/AppText';

export interface FieldProps extends Omit<ComponentPropsWithoutRef<'input'>, 'id'> {
  label: string;
  /** Helper under the field. */
  hint?: string;
  /** Validation message. Presence switches the field to the error style. */
  error?: string | null;
  optional?: boolean;
  /** Rendered inside the field, before the native input. */
  icon?: ReactNode;
  containerClassName?: string;
}

/**
 * Labelled input with hint + error slots. The native element is the only thing
 * rendered — no wrapper divs that could break native autofill or password
 * manager heuristics.
 */
export function Field({
  label,
  hint,
  error,
  optional = false,
  icon,
  className = '',
  containerClassName = '',
  ...rest
}: FieldProps) {
  const id = useId();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={containerClassName}>
      <label htmlFor={id} className="mb-1.5 block">
        <AppText variant="label" className="text-secondary">
          {label}
          {optional && <span className="ml-1 font-normal text-muted">(opcional)</span>}
        </AppText>
      </label>

      <div className="relative">
        {icon && (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-muted"
          >
            {icon}
          </span>
        )}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          className={[
            'h-11 w-full rounded-control border bg-surface px-3.5 text-[15px] text-primary',
            'placeholder:text-muted',
            'transition-colors duration-150',
            icon ? 'pl-10' : '',
            error ? 'border-danger' : 'border-border focus:border-teal',
            'disabled:cursor-not-allowed disabled:opacity-50',
            className,
          ]
            .filter(Boolean)
            .join(' ')}
          {...rest}
        />
      </div>

      {error ? (
        <AppText
          variant="caption"
          id={errorId}
          className="mt-1.5 block text-danger"
        >
          {error}
        </AppText>
      ) : hint ? (
        <AppText variant="caption" id={hintId} className="mt-1.5 block text-muted">
          {hint}
        </AppText>
      ) : null}
    </div>
  );
}