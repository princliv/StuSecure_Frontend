import axios from 'axios';

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:5000/api';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

/** Attach the Firebase ID token to every request. */
export function setAuthToken(token: string | null) {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
}

/**
 * Track the active org so the interceptor below can forward it.
 * Called by `useAuthStore.selectOrg()` and `useAuthStore.reset()`.
 * Using a module-level variable avoids a circular import between the store
 * and this module (store → auth.api → client).
 */
let _activeOrgId: string | null = null;

export function setActiveOrgId(id: string | null) {
  _activeOrgId = id;
}

/**
 * Attach X-Org-Id to every request when an org is active.
 * The backend validates it against `user.organizationId`; a mismatch → 403.
 */
apiClient.interceptors.request.use((config) => {
  if (_activeOrgId) {
    config.headers['X-Org-Id'] = _activeOrgId;
  }
  return config;
});
