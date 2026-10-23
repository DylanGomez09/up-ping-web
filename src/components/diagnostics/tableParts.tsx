import type { ReactNode } from 'react';

/** Small shared table primitives for the diagnostics cards. */

export function Th({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <th
      scope="col"
      className={`px-2 py-2.5 text-left text-[11px] font-bold tracking-[0.6px] uppercase text-muted ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  mono = false,
  className = '',
}: {
  children: ReactNode;
  mono?: boolean;
  className?: string;
}) {
  return (
    <td
      className={[
        'px-2 py-2.5 align-top text-[13px] leading-[18px] text-primary',
        mono ? 'font-mono text-[12.5px]' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {children}
    </td>
  );
}

export type StatusTone = 'ok' | 'warn' | 'bad';

const TONE: Record<StatusTone, string> = {
  ok: 'text-teal',
  warn: 'text-warning',
  bad: 'text-danger',
};

export function Status({ tone, children }: { tone: StatusTone; children: ReactNode }) {
  return <span className={`text-[12px] font-semibold ${TONE[tone]}`}>{children}</span>;
}