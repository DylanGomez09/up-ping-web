import type { ComponentPropsWithoutRef, ReactNode } from 'react';
import { AppText } from '@/components/AppText';

export interface CardProps extends ComponentPropsWithoutRef<'section'> {
  /** Section eyebrow above the content. */
  title?: string;
  /** Supporting line under the title. */
  subtitle?: string;
  /** Right-aligned slot in the header (buttons, info chips). */
  action?: ReactNode;
  /** Remove the default body padding for edge-to-edge content. */
  flush?: boolean;
  children: ReactNode;
}

/**
 * The single surface primitive: radius 16, hairline border, soft `deep`-tinted
 * shadow. Every panel in the app is one of these.
 */
export function Card({
  title,
  subtitle,
  action,
  flush = false,
  className = '',
  children,
  ...rest
}: CardProps) {
  const hasHeader = Boolean(title || subtitle || action);

  return (
    <section
      className={['rounded-card border border-border bg-surface shadow-card', className]
        .filter(Boolean)
        .join(' ')}
      {...rest}
    >
      {hasHeader && (
        <header
          className={[
            'flex items-start justify-between gap-3',
            flush ? 'px-5 pt-5 pb-2' : 'px-5 pt-5 pb-4',
          ].join(' ')}
        >
          <div className="min-w-0">
            {title && (
              <AppText variant="section" className="block text-secondary">
                {title}
              </AppText>
            )}
            {subtitle && (
              <AppText variant="caption" className="mt-1 block text-muted">
                {subtitle}
              </AppText>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </header>
      )}
      <div className={flush ? 'px-5 pb-5' : 'px-5 pb-5 pt-0'}>{children}</div>
    </section>
  );
}