import { NavLink } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Icon } from '@/components/Icon';
import { AppText } from '@/components/AppText';
import { NAV_ITEMS } from '@/lib/navigation';
import type { NavItem } from '@/lib/navigation';
import { useAuthStore } from '@/store/authStore';

/**
 * Desktop navigation rail, visible from 768px up. Below that it is removed by
 * CSS (not by a JS breakpoint) so there is no hydration/layout flash; the
 * fixed TabBar covers the same routes on mobile widths.
 */
export function Sidebar() {
  const logout = useAuthStore((s) => s.logout);

  return (
    <aside
      aria-label="Main navigation"
      className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface px-4 py-5 md:flex"
    >
      <div className="flex items-center gap-2.5 px-2">
        <span
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-mark gradient-brand text-deep"
        >
          <Icon name="activity" size={20} strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <AppText variant="subtitle" className="font-bold text-primary">
            UpPing
          </AppText>
          <AppText variant="caption" className="block text-muted">
            Network diagnostics
          </AppText>
        </div>
      </div>

      <nav className="mt-7 flex flex-1 flex-col gap-1">
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.route} item={item} />
        ))}
      </nav>

      <button
        type="button"
        onClick={logout}
        className="flex w-full items-center gap-2.5 rounded-control px-3 py-2.5 text-left transition-colors hover:bg-danger-soft"
      >
        <Icon name="logout" size={20} className="text-danger" />
        <AppText variant="body" className="font-medium text-danger">
          Sign out
        </AppText>
      </button>
    </aside>
  );
}

function SidebarLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.route}
      className={({ isActive }) =>
        [
          'flex items-center gap-2.5 rounded-control px-3 py-2.5 transition-colors',
          isActive
            ? 'bg-tint font-semibold text-primary'
            : 'text-secondary hover:bg-tint hover:text-primary',
        ].join(' ')
      }
    >
      {({ isActive }: { isActive: boolean }) => (
        <>
          <span
            aria-hidden="true"
            className={isActive ? 'text-teal' : 'text-secondary'}
          >
            <Icon name={item.icon} size={20} />
          </span>
          <AppText variant="body" className="font-medium">
            {item.label}
          </AppText>
        </>
      )}
    </NavLink>
  );
}

/** Shared page header used at the top of every route. */
export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <AppText variant="title" className="block text-primary">
          {title}
        </AppText>
        {subtitle && (
          <AppText variant="body" className="mt-1 block text-secondary">
            {subtitle}
          </AppText>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}