import type { CSSProperties, ComponentPropsWithoutRef } from 'react';

export type TextVariant =
  | 'title'
  | 'subtitle'
  | 'body'
  | 'section'
  | 'label'
  | 'caption'
  | 'data'
  | 'chip';

interface VariantSpec {
  /** Tailwind class carrying size, weight, tracking and leading. */
  className: string;
  /** Fallback weight for the mono face (only 400 and 600 exist). */
  monoWeight: 400 | 600;
}

const VARIANTS: Record<TextVariant, VariantSpec> = {
  title: { className: 'text-[28px] leading-[34px] font-bold tracking-[-0.5px]', monoWeight: 600 },
  subtitle: { className: 'text-[14px] leading-5 font-medium', monoWeight: 400 },
  body: { className: 'text-[15px] leading-[22px] font-normal', monoWeight: 400 },
  section: { className: 'text-[13px] font-bold tracking-[0.6px] uppercase', monoWeight: 600 },
  label: { className: 'text-[12px] leading-4 font-semibold', monoWeight: 600 },
  caption: { className: 'text-[12px] leading-4 font-normal', monoWeight: 400 },
  data: { className: 'text-[20px] leading-6 font-semibold tracking-[-0.3px]', monoWeight: 600 },
  chip: { className: 'text-[13px] leading-[18px] font-medium', monoWeight: 400 },
};

export interface AppTextProps extends ComponentPropsWithoutRef<'span'> {
  variant?: TextVariant;
  /**
   * Opt into the data face. Manually applied everywhere in the app — never set
   * this on prose.
   */
  mono?: boolean;
  className?: string;
  style?: CSSProperties;
}

/**
 * Every piece of text in the app renders through this component. It exists to
 * enforce the type scale and the "mono is for data only" rule in one place
 * instead of scattering arbitrary font classes.
 */
export function AppText({
  variant = 'body',
  mono = false,
  className = '',
  style,
  ...rest
}: AppTextProps) {
  const spec = VARIANTS[variant];

  return (
    <span
      className={[
        mono ? 'font-mono' : '',
        mono ? (spec.monoWeight === 600 ? 'font-semibold' : 'font-normal') : '',
        spec.className,
        'text-primary',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={style}
      {...rest}
    />
  );
}