/**
 * app/index.tsx — Entry point / bootstrap router.
 *
 * Decision tree (runs once isReady flips true):
 *  1. Not authenticated                              → /(auth)/login
 *  2. Authenticated, memberships empty (edge case)  → call listMine();
 *       still empty after that                       → /(auth)/login
 *  3. Multiple memberships, no active org selected  → /(auth)/select-org
 *  4. Single membership or activeOrg already set    → routeByMembership()
 *
 * Shows a centred spinner while the decision is being made.
 */
import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';

import { useAuthStore } from '@/store/auth.store';
import { useAppStore } from '@/store/app.store';
import { listMine } from '@/features/auth/orgs.api';
import { routeByMembership } from '@/features/auth/routeByMembership';
import { brand } from '@/theme/colors';

export default function Index() {
  const isReady = useAppStore((s) => s.isReady);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const resolvedRef = useRef(false);

  useEffect(() => {
    // Guard: only run once per mount, and only when the app is ready.
    if (!isReady || resolvedRef.current) return;
    resolvedRef.current = true;

    const resolve = async () => {
      // Always read fresh state via getState() to avoid stale closures.
      const state = useAuthStore.getState();

      if (!state.isAuthenticated) {
        router.replace('/(auth)/login');
        return;
      }

      let mems = state.memberships;

      // Safety net: if sync hasn't populated memberships yet, fetch them now.
      if (mems.length === 0) {
        try {
          const result = await listMine();
          state.setMemberships(result.memberships);
          mems = result.memberships;
        } catch {
          // Network/auth error — fall through to login.
        }
      }

      if (mems.length === 0) {
        router.replace('/(auth)/login');
        return;
      }

      // Multiple orgs and no org has been chosen yet → org picker.
      const { activeOrganizationId } = useAuthStore.getState();
      if (mems.length > 1 && !activeOrganizationId) {
        router.replace('/(auth)/select-org');
        return;
      }

      // Resolve the active membership.
      const activeMem = activeOrganizationId
        ? (mems.find((m) => m.organizationId === activeOrganizationId) ?? mems[0])
        : mems[0];

      routeByMembership(activeMem);
    };

    resolve();
  }, [isReady, isAuthenticated]);

  // Render a spinner while the routing decision is in-flight.
  // The splash screen is already hiding by this point, so we need something visible.
  return (
    <View
      style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' }}
    >
      <ActivityIndicator size="large" color={brand.blue} />
    </View>
  );
}
