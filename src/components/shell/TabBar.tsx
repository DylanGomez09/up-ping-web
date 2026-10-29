import { NavLink } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { GUEST_TAB_ITEM, NAV_ITEMS } from '@/lib/navigation';
import type { NavItem } from '@/lib/navigation';
import { useAuthStore } from '@/store/authStore';

/**
 * Fixed bottom tab bar, the mobile counterpart of the Sidebar. Hidden from
 * 768px up and offset by the page padding so content is never covered.
 */
export function TabBar() {
  const accessToken = useAuthStore((s) => s.accessToken);

  const items = accessToken
    ? NAV_ITEMS
    : [
        ...NAV_ITEMS.filter((item) => !item.requiresAuth),
        GUEST_TAB_ITEM,
      ];

  return (
    <nav
      aria-label="Navegación principal"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul
        className="grid"
        style={{
          gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
        }}
      >
        {items.map((item) => (
          <li key={item.route}>
            <TabLink item={item} />
          </li>
        ))}
      </ul>
    </nav>
  );
}

function TabLink({ item }: { item: NavItem }) {
  return (
    <NavLink
      to={item.route}
      className={({ isActive }) =>
        [
          'flex h-full flex-col items-center justify-center gap-1 py-2.5 transition-colors',
          isActive ? 'text-teal' : 'text-muted hover:text-secondary',
        ].join(' ')
      }
    >
      {({ isActive }: { isActive: boolean }) => (
        <>
          <Icon name={item.icon} size={22} strokeWidth={isActive ? 2.2 : 1.8} />
          <span
            className={[
              'text-[11px] leading-3',
              isActive ? 'font-bold' : 'font-medium',
            ].join(' ')}
          >
            {item.label}
          </span>
        </>
      )}
    </NavLink>
  );
}
