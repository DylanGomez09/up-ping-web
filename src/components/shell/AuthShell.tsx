import type { ReactNode } from 'react';
import { Icon } from '@/components/Icon';
import { AppText } from '@/components/AppText';
import { Link } from 'react-router-dom';

export interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  /** Rendered under the form, e.g. "Don't have an account? Register". */
  footer?: ReactNode;
}

/**
 * Centred card layout shared by Login and Register.
 */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: AuthShellProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-bg px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <span
            aria-hidden="true"
            className="mb-4 flex size-14 items-center justify-center rounded-mark gradient-brand text-deep"
          >
            <Icon name="activity" size={28} strokeWidth={2.2} />
          </span>
          <AppText variant="title" className="block text-primary">
            {title}
          </AppText>
          <AppText variant="body" className="mt-1.5 block text-secondary">
            {subtitle}
          </AppText>
        </div>

        <div className="rounded-card border border-border bg-surface p-6 shadow-card sm:p-8">
          {children}
        </div>

        {footer && (
          <div className="mt-5 text-center">
            <AppText variant="caption" className="text-secondary">
              {footer}
            </AppText>
          </div>
        )}

        <p className="mt-8 text-center">
          <Link
            to="/login"
            className="text-[12px] text-muted transition-colors hover:text-secondary"
          >
            UpPing · network diagnostics workshop
          </Link>
        </p>
      </div>
    </div>
  );
}