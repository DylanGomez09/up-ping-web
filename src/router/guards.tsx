import { Navigate, useLocation } from 'react-router-dom';
import type { ReactNode } from 'react';
import { Skeleton } from '@/components/Skeleton';
import { useAuthStore } from '@/store/authStore';

/**
 * Guards authenticated routes. While the persisted session is being
 * rehydrated we render a neutral placeholder instead of redirecting, otherwise
 * a hard refresh would bounce the user to /login for a frame.
 *
 * Signed-in users hitting /login or /register are bounced to /dashboard.
 */
export function ProtectedRoute({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s._hydrated);
  const location = useLocation();

  if (!hydrated) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-bg px-4">
        <div className="w-full max-w-sm space-y-3">
          <Skeleton className="h-8 w-32" />
          <Skeleton className="h-28 w-full" />
          <Skeleton className="h-28 w-full" />
        </div>
      </div>
    );
  }

  if (!accessToken) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

/** Public-only wrapper for the auth screens. */
export function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const hydrated = useAuthStore((s) => s._hydrated);

  if (!hydrated) {
    return <>{children}</>;
  }

  if (accessToken) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}