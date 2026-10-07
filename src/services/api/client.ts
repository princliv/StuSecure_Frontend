import axios from 'axios';
import Constants from 'expo-constants';

const BACKEND_PORT = 5000;

/**
 * The backend's LAN IP changes every time your dev machine switches networks
 * or its DHCP lease renews — hardcoding it in `.env` means re-editing it (and
 * restarting Expo) every time that happens. Instead, in dev we derive the
 * host from `hostUri` — the same address Metro used to serve the JS bundle
 * to this device, which is therefore *always* correct for however the phone
 * is currently reaching this machine. `EXPO_PUBLIC_API_URL` stays as an
 * explicit override for production/staging builds (no dev server, no
 * `hostUri`) or if you ever need to point dev at a non-local backend.
 */
function resolveBaseUrl(): string {
  if (!__DEV__ && process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const hostUri =
    Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost ?? undefined;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:${BACKEND_PORT}/api`;
  }

  return process.env.EXPO_PUBLIC_API_URL ?? `http://localhost:${BACKEND_PORT}/api`;
}

const BASE_URL = resolveBaseUrl();

/** The backend's origin with no `/api` suffix — for the Socket.IO client. */
export const BACKEND_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

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
