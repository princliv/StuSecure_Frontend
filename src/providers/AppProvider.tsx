import { useEffect, type ReactNode } from 'react';
import { QueryProvider } from './QueryProvider';
import { firebaseAuth } from '@/services/firebase/auth';
import { authApi } from '@/services/api/auth.api';
import { setAuthToken } from '@/services/api/client';
import { useAuthStore } from '@/store/auth.store';
import { useAppStore } from '@/store/app.store';

interface AppProviderProps {
  children: ReactNode;
}

function AuthBootstrap({ children }: { children: ReactNode }) {
  const { setFirebaseUser, setProfile, setMemberships, setLoading } = useAuthStore();
  const { setReady } = useAppStore();

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
      setFirebaseUser(user);

      if (user) {
        try {
          const token = await firebaseAuth.getIdToken(user);
          setAuthToken(token);
          const { data } = await authApi.sync();
          setProfile(data.user);
          setMemberships(data.memberships);
        } catch {
          // No StuSecure account for this identity yet (e.g. mid-registration
          // — the backend returns 404 until a role is provided). The
          // registration flow (see app/(auth)/register.tsx TODO) is
          // responsible for calling authApi.sync({ displayName, role }) to
          // provision the account.
          setProfile(null);
          setMemberships([]);
        }
      } else {
        setAuthToken(null);
        setProfile(null);
        setMemberships([]);
      }

      setLoading(false);
      setReady(true);
    });

    return unsubscribe;
  }, [setFirebaseUser, setProfile, setMemberships, setLoading, setReady]);

  return <>{children}</>;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <QueryProvider>
      <AuthBootstrap>{children}</AuthBootstrap>
    </QueryProvider>
  );
}
