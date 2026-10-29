import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Icon } from '@/components/Icon';
import { AppText } from '@/components/AppText';
import { Button } from '@/components/Button';
import { useSignOut } from '@/hooks/useSignOut';
import { NAV_ITEMS } from '@/lib/navigation';
import type { NavItem } from '@/lib/navigation';
import { useAuthStore } from '@/store/authStore';

/**
 * Desktop navigation rail, visible from 768px up. Below that it is removed by
 * CSS (not by a JS breakpoint) so there is no hydration/layout flash; the
 * fixed TabBar covers the same routes on mobile widths.
 */
export function Sidebar() {
  const { signOut, signingOut } = useSignOut();
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();
  const location = useLocation();

  const items = accessToken
    ? NAV_ITEMS
    : NAV_ITEMS.filter((item) => !item.requiresAuth);

  return (
    <aside
      aria-label="Navegación principal"
      className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface px-4 py-5 md:flex"
    >
      <NavLink to="/" className="flex items-center gap-2.5 px-2">
        <span
          aria-hidden="true"
          className="flex size-9 items-center justify-center rounded-mark gradient-brand text-deep"
        >
          <Icon name="activity" size={20} strokeWidth={2.2} />
        </span>
        <span className="min-w-0">
          <AppText variant="subtitle" className="block font-bold text-primary">
            UpPing
          </AppText>
          <AppText variant="caption" className="block text-muted">
            Diagnóstico de red
          </AppText>
        </span>
      </NavLink>

      <nav className="mt-7 flex flex-1 flex-col gap-1">
        {items.map((item) => (
          <SidebarLink key={item.route} item={item} />
        ))}
      </nav>

      {accessToken ? (
        <div className="flex flex-col gap-1">
          {user && (
            <div className="mb-1 flex items-center gap-2.5 rounded-control px-3 py-2">
              <span
                aria-hidden="true"
                className="flex size-8 shrink-0 items-center justify-center rounded-badge gradient-brand text-[12px] font-bold text-deep"
              >
                {initialsOf(user.name)}
              </span>
              <span className="min-w-0">
                <AppText variant="label" className="block truncate text-primary">
                  {user.name}
                </AppText>
                <AppText variant="caption" className="block truncate text-muted">
                  {user.email}
                </AppText>
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={() => void signOut()}
            disabled={signingOut}
            className="flex w-full items-center gap-2.5 rounded-control px-3 py-2.5 text-left transition-colors hover:bg-danger-soft disabled:opacity-60"
          >
            <Icon name="logout" size={20} className="text-danger" />
            <AppText variant="body" className="font-medium text-danger">
              {signingOut ? 'Cerrando sesión…' : 'Cerrar sesión'}
            </AppText>
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 rounded-card border border-border bg-tint p-3.5">
          <AppText variant="label" className="block text-primary">
            Estás como invitado
          </AppText>
          <AppText variant="caption" className="block text-secondary">
            Mide sin cuenta. Regístrate solo para guardar tu historial.
          </AppText>
          <Button
            size="sm"
            fullWidth
            onClick={() =>
              navigate('/register', { state: { from: location.pathname } })
            }
          >
            Crear cuenta
          </Button>
          <button
            type="button"
            onClick={() =>
              navigate('/login', { state: { from: location.pathname } })
            }
            className="text-center text-[12px] font-semibold text-teal transition-opacity hover:opacity-80"
          >
            Ya tengo cuenta
          </button>
        </div>
      )}
    </aside>
  );
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
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
