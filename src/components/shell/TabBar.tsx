import { NavLink } from 'react-router-dom';
import { Icon } from '@/components/Icon';
import { NAV_ITEMS } from '@/lib/navigation';
import type { NavItem } from '@/lib/navigation';

/**
 * Fixed bottom tab bar, the mobile counterpart of the Sidebar. Hidden from
 * 768px up and offset by the page padding so content is never covered.
 */
export function TabBar() {
  return (
    <nav
      aria-label="Main navigation"
      className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid grid-cols-5">
        {NAV_ITEMS.map((item) => (
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