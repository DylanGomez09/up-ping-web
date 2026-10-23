import type { ReactNode } from 'react';
import { Sidebar, PageHeader } from '@/components/shell/Sidebar';
import { TabBar } from '@/components/shell/TabBar';

export interface AppShellProps {
  children: ReactNode;
}

/**
 * Persistent chrome for every authenticated route: Sidebar + content column +
 * mobile TabBar. `pb-24` on the column keeps content clear of the fixed tab bar
 * on small screens.
 */
export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex min-h-dvh bg-bg">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
          {children}
        </main>
      </div>

      <TabBar />
    </div>
  );
}

export { PageHeader };