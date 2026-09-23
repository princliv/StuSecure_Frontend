/**
 * Org-membership API calls.
 *
 * Reuses the shared `apiClient` from the existing API layer (no second axios
 * instance). `Membership` is re-exported from `auth.api` so the rest of the
 * app only needs one import location.
 */
import { apiClient } from '@/services/api/client';
import type { Membership } from '@/services/api/auth.api';

export type { Membership };

/**
 * GET /api/orgs/mine
 * Returns the current user's memberships (always length 1 until Group G).
 */
export function listMine(): Promise<{ memberships: Membership[] }> {
  return apiClient
    .get<{ memberships: Membership[] }>('/orgs/mine')
    .then((r) => r.data);
}

/**
 * POST /api/orgs/:id/switch
 * In v1 succeeds only when `id` equals the user's single organizationId.
 */
export function switchOrg(id: string): Promise<{ memberships: Membership[] }> {
  return apiClient
    .post<{ memberships: Membership[] }>(`/orgs/${id}/switch`)
    .then((r) => r.data);
}
