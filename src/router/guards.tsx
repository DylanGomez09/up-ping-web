import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { AppShellSkeleton } from '@/components/shell/AppShellSkeleton';
import { safeInternalPath } from '@/lib/navigation';
import { useAuthStore } from '@/store/authStore';

/**
 * Waits for the persisted session before rendering. Without this a hard
 * refresh would flash the guest state for one frame on every signed-in page.
 */
export function HydratedRoute({ children }: { children: ReactNode }) {
  const hydrated = useAuthStore((s) => s._hydrated);

  if (!hydrated) {
    return <AppShellSkeleton />;
  }

  return <>{children}</>;
}

/**
 * Guards account-only routes. Measuring and diagnostics are public, so only
 * the profile and the save/history surfaces use this wrapper.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const location = useLocation();

  return (
    <HydratedRoute>
      {accessToken ? (
        children
      ) : (
        <Navigate
          to="/login"
          replace
          state={{ from: `${location.pathname}${location.search}` }}
        />
      )}
    </HydratedRoute>
  );
}

/** Public-only wrapper for the auth screens. */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s._hydrated);
  const location = useLocation();

  if (!hydrated) {
    return <>{children}</>;
  }

  if (accessToken) {
    const state = (location.state ?? {}) as { from?: string };
    return <Navigate to={safeInternalPath(state.from)} replace />;
  }

  return <>{children}</>;
}
