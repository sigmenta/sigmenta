// ─── useAuth Hook ─────────────────────────────────────────────────────────────
/**
 * Re-exports useAuth from AuthContext for convenient importing.
 * Also exports useRequireAuth which redirects unauthenticated users to /login.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/AuthContext';
import type { AuthContextValue } from '@/types';
import { ROUTES } from '@/constants';

export { useAuth };

/**
 * Redirects to /login if the user is not authenticated.
 * Returns the auth context so callers can also use user data.
 */
export function useRequireAuth(redirectTo: string = ROUTES.LOGIN): AuthContextValue {
  const auth = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.isLoading && !auth.user) {
      navigate(redirectTo, { replace: true });
    }
  }, [auth.isLoading, auth.user, navigate, redirectTo]);

  return auth;
}

export default useAuth;
