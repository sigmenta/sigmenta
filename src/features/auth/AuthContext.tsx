// ─── Women's Favorite — Firebase Auth Context ───────────────────────────────

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import {
  type User as FirebaseUser,
  onAuthStateChanged,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '@/lib/firebase';
import { COLLECTIONS, USER_ROLES } from '@/constants';
import type { AuthContextValue, UserProfile } from '@/types';

// ─── Context ────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [firebaseUser, setFirebaseUser] = useState<FirebaseUser | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  /**
   * Fetches the UserProfile from Firestore with a strict timeout.
   * Falls back to a local profile from FirebaseUser so the app never hangs.
   */
  const fetchOrCreateUserProfile = useCallback(
    async (fbUser: FirebaseUser): Promise<UserProfile> => {
      const fallbackProfile: UserProfile = {
        uid: fbUser.uid,
        email: fbUser.email ?? '',
        emailVerified: fbUser.emailVerified,
        displayName: fbUser.displayName ?? fbUser.email?.split('@')[0] ?? 'ব্যবহারকারী',
        displayNameBn: undefined,
        phoneNumber: fbUser.phoneNumber ?? undefined,
        photoURL: fbUser.photoURL ?? undefined,
        role: USER_ROLES.CUSTOMER,
        isActive: true,
        addresses: [],
        createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
        updatedAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 } as any,
      };

      try {
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Firestore timeout')), 1200)
        );

        const fetchWork = async (): Promise<UserProfile> => {
          const userRef = doc(db, COLLECTIONS.USERS, fbUser.uid);
          const snapshot = await getDoc(userRef);

          if (snapshot.exists()) {
            return { ...fallbackProfile, ...snapshot.data() } as UserProfile;
          }

          // First sign-in: create profile in background
          const now = serverTimestamp();
          const newProfile = {
            ...fallbackProfile,
            createdAt: now,
            updatedAt: now,
          };

          try {
            await setDoc(userRef, newProfile);
          } catch (writeErr) {
            console.warn('[AuthContext] Profile write skipped:', writeErr);
          }
          return fallbackProfile;
        };

        return await Promise.race([fetchWork(), timeoutPromise]);
      } catch (err) {
        console.warn('[AuthContext] Using fallback auth profile:', err);
        return fallbackProfile;
      }
    },
    [],
  );

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    // Force isLoading to false within 800ms under ALL network/offline conditions
    const safetyTimer = setTimeout(() => {
      setIsLoading(false);
    }, 800);

    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(
        auth,
        async (fbUser) => {
          try {
            if (fbUser) {
              setFirebaseUser(fbUser);
              const profile = await fetchOrCreateUserProfile(fbUser);
              setUser(profile);
            } else {
              setFirebaseUser(null);
              setUser(null);
            }
          } catch (error) {
            console.warn('[AuthContext] Profile notice:', error);
            setFirebaseUser(fbUser);
            setUser(null);
          } finally {
            clearTimeout(safetyTimer);
            setIsLoading(false);
          }
        },
        (error) => {
          clearTimeout(safetyTimer);
          console.warn('[AuthContext] Auth listener notice:', error?.message);
          setIsLoading(false);
        }
      );
    } catch (e) {
      clearTimeout(safetyTimer);
      console.warn('[AuthContext] Firebase initialization notice:', e);
      setIsLoading(false);
    }

    return () => {
      clearTimeout(safetyTimer);
      unsubscribe();
    };
  }, [fetchOrCreateUserProfile]);

  const signOut = useCallback(async (): Promise<void> => {
    try {
      // Clear any legacy demo flags just in case
      if (typeof window !== 'undefined') {
        localStorage.removeItem('wf_demo_admin');
      }
      if (isFirebaseConfigured) {
        await firebaseSignOut(auth);
      }
      setFirebaseUser(null);
      setUser(null);
    } catch (error) {
      console.error('[AuthContext] Sign out failed:', error);
      throw error;
    }
  }, []);

  // Role checks derived solely from Firestore-sourced UserProfile
  const isAdmin =
    user?.role === USER_ROLES.ADMIN || user?.role === USER_ROLES.SUPER_ADMIN;
  const isSuperAdmin = user?.role === USER_ROLES.SUPER_ADMIN;

  const value: AuthContextValue = {
    user,
    firebaseUser,
    isLoading,
    isAdmin,
    isSuperAdmin,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
