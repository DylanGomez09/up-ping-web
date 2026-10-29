import { useCallback, useState } from 'react';
import { logoutRequest } from '@/lib/api/auth';
import { useAuthStore } from '@/store/authStore';

/**
 * Revokes the refresh token on the server (best effort) and clears the local
 * session. The protected routes redirect to /login as soon as the token is
 * cleared.
 */
export function useSignOut() {
  const logout = useAuthStore((s) => s.logout);
  const [signingOut, setSigningOut] = useState(false);

  const signOut = useCallback(async () => {
    const refreshToken = useAuthStore.getState().refreshToken;
    setSigningOut(true);

    try {
      if (refreshToken) {
        await logoutRequest(refreshToken);
      }
    } catch {
      // The local session still needs to end even if the server is unreachable.
    } finally {
      logout();
      setSigningOut(false);
    }
  }, [logout]);

  return { signOut, signingOut };
}
