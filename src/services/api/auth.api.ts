import { apiClient } from './client';

export interface RegisterPayload {
  email: string;
  displayName: string;
  role: 'STUDENT' | 'GUARD' | 'FACULTY' | 'ADMIN';
}

export interface UserProfile {
  id: string;
  firebaseUid: string;
  email: string;
  displayName: string;
  role: 'STUDENT' | 'GUARD' | 'FACULTY' | 'ADMIN';
  createdAt: string;
}

/** Provision / fetch a user profile after Firebase sign-in */
export const authApi = {
  getProfile: () => apiClient.get<UserProfile>('/auth/me'),
  register: (payload: RegisterPayload) => apiClient.post<UserProfile>('/auth/register', payload),
};
