import { apiClient } from './client';

export type Role = 'STUDENT' | 'GUARD' | 'FACULTY' | 'ADMIN';

export interface UserProfile {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface Membership {
  organizationId: string;
  organizationName: string;
  organizationSlug: string;
  role: Role;
}

export interface SyncResponse {
  user: UserProfile;
  memberships: Membership[];
}

export interface SyncPayload {
  displayName: string;
  role: Role;
}

/**
 * Provision / fetch the StuSecure account for the signed-in Firebase
 * identity. `sync` is called on every auth-state change; `payload` is only
 * required the first time (no account exists yet — see AppProvider).
 */
export interface ClaimPayload {
  displayName: string;
  organization: string;
}

export const authApi = {
  sync: (payload?: SyncPayload) => apiClient.post<SyncResponse>('/auth/sync', payload),
  getMe: () => apiClient.get<UserProfile>('/auth/me'),
  claim: (payload: ClaimPayload) => apiClient.post<SyncResponse>('/auth/claim', payload),
};
