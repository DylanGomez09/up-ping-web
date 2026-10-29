import { Skeleton, SkeletonGroup } from '@/components/Skeleton';

const NAV_ROWS = [0, 1, 2, 3, 4];
const STAT_CARDS = [0, 1, 2, 3];

/**
 * Loading shape for the signed-in chrome. It mirrors `AppShell` (sidebar,
 * padded content column, fixed mobile tab bar) so rehydrating the session does
 * not flash a different layout.
 */
export function AppShellSkeleton() {
  return (
    <div className="flex min-h-dvh bg-bg">
      <aside
        aria-hidden="true"
        className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-border bg-surface px-4 py-5 md:flex"
      >
        <div className="flex items-center gap-2.5 px-2">
          <Skeleton className="size-9 shrink-0 rounded-mark" />
          <div className="min-w-0 flex-1 space-y-1.5">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
        </div>

        <div className="mt-7 flex flex-col gap-1">
          {NAV_ROWS.map((row) => (
            <Skeleton key={row} className="h-[42px] w-full rounded-control" />
          ))}
        </div>

        <div className="mt-auto rounded-card border border-border bg-tint p-3.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="mt-2 h-3 w-full" />
          <Skeleton className="mt-1.5 h-3 w-4/5" />
          <Skeleton className="mt-3 h-9 w-full rounded-mark" />
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 pb-24 md:px-8 md:py-8 md:pb-8">
          <SkeletonGroup
            label="Cargando tu sesión"
            className="flex flex-col gap-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <Skeleton className="h-[34px] w-44" />
                <Skeleton className="mt-1 h-[22px] w-72 max-w-full" />
              </div>
              <Skeleton className="h-[30px] w-20 rounded-chip" />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {STAT_CARDS.map((card) => (
                <div
                  key={card}
                  className="rounded-card border border-border bg-surface p-5 shadow-card"
                >
                  <Skeleton className="h-[22px] w-24" />
                  <Skeleton className="mt-2 h-6 w-20" />
                  <Skeleton className="mt-1 h-4 w-32" />
                </div>
              ))}
            </div>

            <div className="rounded-card border border-border bg-surface p-5 shadow-card">
              <Skeleton className="h-[22px] w-32" />
              <Skeleton className="mt-1 h-4 w-56 max-w-full" />
              <Skeleton className="mt-4 h-11 w-full rounded-control" />
              <Skeleton className="mt-4 h-[220px] w-full rounded-control" />
            </div>
          </SkeletonGroup>
        </main>
      </div>

      <div
        aria-hidden="true"
        className="fixed inset-x-0 bottom-0 h-[59px] border-t border-border bg-surface md:hidden"
      />
    </div>
  );
}
