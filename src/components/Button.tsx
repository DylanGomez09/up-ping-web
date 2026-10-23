import type { ButtonHTMLAttributes, ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'danger-soft';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface VariantSpec {
  /** Idle state. */
  base: string;
  disabled: string;
}

const VARIANTS: Record<ButtonVariant, VariantSpec> = {
  primary: {
    base: 'gradient-brand text-deep shadow-raised hover:brightness-[1.06]',
    disabled: 'opacity-60',
  },
  secondary: {
    base: 'border border-border bg-surface text-primary hover:bg-tint',
    disabled: 'opacity-50',
  },
  danger: {
    base: 'bg-danger text-white hover:brightness-110',
    disabled: 'opacity-50',
  },
  'danger-soft': {
    base: 'bg-danger-soft text-danger hover:brightness-95',
    disabled: 'opacity-50',
  },
};

const SIZES: Record<ButtonSize, string> = {
  sm: 'h-9 px-3.5 text-[13px] rounded-mark',
  md: 'h-11 px-4 text-[14px] rounded-control',
  lg: 'h-12 px-5 text-[15px] rounded-control',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
}

/**
 * Buttons are gradient-primary or outlined-secondary; everything else in the
 * app uses `variant="secondary"`. Loading keeps the label in place so the
 * button never changes width mid-request.
 */
export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  disabled = false,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  const spec = VARIANTS[variant];
  const isDisabled = disabled || loading;

  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={[
        'inline-flex items-center justify-center gap-2 font-semibold whitespace-nowrap',
        'transition-[filter,background-color,opacity] duration-150',
        'disabled:cursor-not-allowed',
        SIZES[size],
        spec.base,
        isDisabled ? spec.disabled : '',
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="size-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}