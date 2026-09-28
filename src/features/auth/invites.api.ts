/**
 * Invite API calls (Group G1 pass 4).
 *
 * Reuses the shared `apiClient` from the existing API layer (mirrors
 * `orgs.api.ts`'s style). `previewInvite` hits a public backend route (no
 * `verifyFirebaseToken` middleware at all) so it works before the user is
 * signed in — the shared `apiClient` still attaches an `Authorization`
 * header if one happens to be set (e.g. a previously signed-in session),
 * but the backend route ignores it either way. `acceptInvite` requires a
 * Firebase ID token — `apiClient` already attaches it globally via
 * `setAuthToken()` once Firebase sign-in/sign-up resolves.
 */
import { apiClient } from '@/services/api/client';
import type { SyncResponse } from '@/services/api/auth.api';

export type InviteStatus = 'PENDING' | 'ACCEPTED' | 'REVOKED' | 'EXPIRED';

export interface InvitePreview {
  organizationName: string;
  role: string;
  email: string;
  status: InviteStatus;
}

/**
 * GET /api/invites/:token
 * Public — no auth required. Returns invite details or a 404 if the token
 * doesn't exist at all (expired/revoked/accepted invites still 200 with
 * their terminal `status` so the UI can show a clear message).
 */
export function previewInvite(token: string): Promise<InvitePreview> {
  return apiClient.get<InvitePreview>(`/invites/${token}`).then((r) => r.data);
}

/**
 * POST /api/invites/:token/accept
 * Requires a valid Firebase ID token (via `apiClient`'s Authorization
 * header) but not an existing StuSecure account — the backend upserts the
 * `User` row and creates the `Membership` in one step. Returns the same
 * `{ user, memberships }` shape as `POST /auth/sync`.
 */
export function acceptInvite(token: string): Promise<SyncResponse> {
  return apiClient.post<SyncResponse>(`/invites/${token}/accept`).then((r) => r.data);
}
