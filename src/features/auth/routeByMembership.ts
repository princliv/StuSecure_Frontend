/**
 * Route the current navigator to the correct role group based on a membership.
 *
 * Route map (mirrors app/ directory layout):
 *   STUDENT  → /(student)/
 *   GUARD    → /(guard)/
 *   FACULTY  → /(faculty)/
 *   ADMIN    → /(auth)/admin-web-only  (mobile gets the "use web" screen)
 *   unknown  → /(auth)/login
 */
import { router } from 'expo-router';
import type { Membership } from '@/services/api/auth.api';

export function routeByMembership(membership: Membership): void {
  const role = membership.role?.toUpperCase();

  if (role === 'STUDENT') {
    // /(student) → app/(student)/index.tsx (no trailing slash — Expo Router convention)
    router.replace('/(student)');
  } else if (role === 'GUARD') {
    router.replace('/(guard)');
  } else if (role === 'FACULTY') {
    router.replace('/(faculty)');
  } else if (role === 'ADMIN') {
    router.replace('/(auth)/admin-web-only');
  } else {
    router.replace('/(auth)/login');
  }
}
