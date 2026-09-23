import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { Membership, UserProfile } from '@/services/api/auth.api';

interface AuthState {
  /** Firebase user object */
  firebaseUser: User | null;
  /** Backend profile */
  profile: UserProfile | null;
  /** Orgs this user belongs to (always length 1 until multi-org membership lands) */
  memberships: Membership[];
  /** Whether auth state has been resolved (avoids flash of wrong screen) */
  isLoading: boolean;
  /** Convenience: true once firebaseUser is set and profile is loaded */
  isAuthenticated: boolean;

  setFirebaseUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setMemberships: (memberships: Membership[]) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  profile: null,
  memberships: [],
  isLoading: true,
  isAuthenticated: false,

  setFirebaseUser: (user) =>
    set({ firebaseUser: user, isAuthenticated: !!user }),

  setProfile: (profile) =>
    set({ profile }),

  setMemberships: (memberships) =>
    set({ memberships }),

  setLoading: (loading) =>
    set({ isLoading: loading }),

  reset: () =>
    set({
      firebaseUser: null,
      profile: null,
      memberships: [],
      isLoading: false,
      isAuthenticated: false,
    }),
}));
