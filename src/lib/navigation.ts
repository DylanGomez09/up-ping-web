import type { IconName } from '@/components/Icon';

export interface NavItem {
  route: string;
  label: string;
  icon: IconName;
  /** Guests can measure, but the profile needs a session. */
  requiresAuth?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { route: '/dashboard', label: 'Panel', icon: 'chart-bars' },
  { route: '/diagnostics', label: 'Diagnóstico', icon: 'radar' },
  { route: '/history', label: 'Historial', icon: 'clock' },
  { route: '/settings', label: 'Ajustes', icon: 'gear' },
  { route: '/profile', label: 'Perfil', icon: 'user', requiresAuth: true },
];

/** Items shown to everyone; the rest are appended for signed-in visitors. */
export const GUEST_TAB_ITEM: NavItem = {
  route: '/login',
  label: 'Acceder',
  icon: 'user',
};

/** Only same-origin relative paths are accepted as post-auth destinations. */
export function safeInternalPath(value: unknown, fallback = '/dashboard'): string {
  return typeof value === 'string' &&
    value.startsWith('/') &&
    !value.startsWith('//')
    ? value
    : fallback;
}
