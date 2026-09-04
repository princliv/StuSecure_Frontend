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
  const { setFirebaseUser, setProfile, setLoading } = useAuthStore();
  const { setReady } = useAppStore();

  useEffect(() => {
    const unsubscribe = firebaseAuth.onAuthStateChanged(async (user) => {
      setFirebaseUser(user);

      if (user) {
        try {
          const token = await firebaseAuth.getIdToken(user);
          setAuthToken(token);
          const { data } = await authApi.getProfile();
          setProfile(data);
        } catch {
          setProfile(null);
        }
      } else {
        setAuthToken(null);
        setProfile(null);
      }

      setLoading(false);
      setReady(true);
    });

    return unsubscribe;
  }, [setFirebaseUser, setProfile, setLoading, setReady]);

  return <>{children}</>;
}

export function AppProvider({ children }: AppProviderProps) {
  return (
    <QueryProvider>
      <AuthBootstrap>{children}</AuthBootstrap>
    </QueryProvider>
  );
}
