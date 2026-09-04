/**
 * app/index.tsx — Entry point
 *
 * Redirects to the correct group based on authentication state and role.
 * While loading, nothing is rendered (splash screen stays visible).
 */
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/auth.store';
import { useAppStore } from '@/store/app.store';

export default function Index() {
  const { isAuthenticated, profile } = useAuthStore();
  const { isReady } = useAppStore();

  // App is still bootstrapping — let the splash screen stay.
  if (!isReady) return null;

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  // Route to the correct module based on role.
  switch (profile?.role) {
    case 'STUDENT':
      return <Redirect href="/(student)/" />;
    case 'GUARD':
      return <Redirect href="/(guard)/" />;
    case 'FACULTY':
    case 'ADMIN':
      return <Redirect href="/(faculty)/" />;
    default:
      // Profile not yet loaded — wait (or show a brief loading state).
      return null;
  }
}
