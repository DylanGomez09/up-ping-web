import type { IconName } from '@/components/Icon';

export interface NavItem {
  route: '/dashboard' | '/diagnostics' | '/history' | '/settings' | '/profile';
  label: string;
  icon: IconName;
}

export const NAV_ITEMS: NavItem[] = [
  { route: '/dashboard', label: 'Dashboard', icon: 'chart-bars' },
  { route: '/diagnostics', label: 'Diagnostics', icon: 'radar' },
  { route: '/history', label: 'History', icon: 'clock' },
  { route: '/settings', label: 'Settings', icon: 'gear' },
  { route: '/profile', label: 'Profile', icon: 'user' },
];