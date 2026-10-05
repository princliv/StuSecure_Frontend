/**
 * Shared sign-out sequence — reused by every screen that offers a "Sign Out"
 * action (select-org, admin-web-only, and the three role profile screens).
 * Callers are responsible for confirming with the user first (e.g. via
 * `Alert.alert`) before invoking this.
 */
import { firebaseAuth } from '@/services/firebase/auth';
import { setAuthToken } from '@/services/api/client';
import { useAuthStore } from '@/store/auth.store';

export async function performSignOut(): Promise<void> {
  await firebaseAuth.signOut();
  setAuthToken(null);
  useAuthStore.getState().reset();
}
