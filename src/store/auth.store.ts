import { create } from 'zustand';
import type { User } from 'firebase/auth';
import type { Membership, UserProfile } from '@/services/api/auth.api';
import { setActiveOrgId } from '@/services/api/client';

interface AuthState {
  /** Firebase user object */
  firebaseUser: User | null;
  /** Backend profile */
  profile: UserProfile | null;
  /** Orgs this user belongs to (always length 1 until multi-org membership lands) */
  memberships: Membership[];
  /** The org the user has explicitly selected (null = not yet chosen / use first) */
  activeOrganizationId: string | null;
  /** Whether auth state has been resolved (avoids flash of wrong screen) */
  isLoading: boolean;
  /** Convenience: true once firebaseUser is set and profile is loaded */
  isAuthenticated: boolean;

  setFirebaseUser: (user: User | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setMemberships: (memberships: Membership[]) => void;
  /** Select an org; also keeps the axios X-Org-Id header in sync. */
  selectOrg: (membership: Membership) => void;
  setLoading: (loading: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  firebaseUser: null,
  profile: null,
  memberships: [],
  activeOrganizationId: null,
  isLoading: true,
  isAuthenticated: false,

  setFirebaseUser: (user) =>
    set({ firebaseUser: user, isAuthenticated: !!user }),

  setProfile: (profile) =>
    set({ profile }),

  setMemberships: (memberships) =>
    set({ memberships }),

  selectOrg: (membership) => {
    setActiveOrgId(membership.organizationId);
    set({ activeOrganizationId: membership.organizationId });
  },

  setLoading: (loading) =>
    set({ isLoading: loading }),

  reset: () => {
    setActiveOrgId(null);
    set({
      firebaseUser: null,
      profile: null,
      memberships: [],
      activeOrganizationId: null,
      isLoading: false,
      isAuthenticated: false,
    });
  },
}));
