/**
 * Guard tab layout.
 *
 * Visible tabs:  Home | Scanner | Alerts | Activity | Profile
 * Hidden routes: scan-result  (pushed from QRScannerScreen on successful scan)
 *
 * Tab bar is theme-aware via useTheme().
 */

import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@/hooks/useTheme';
import { HapticTab } from '@/components/navigation/haptic-tab';
import { useAuthStore } from '@/store/auth.store';
import { routeByMembership } from '@/features/auth/routeByMembership';

type MAIconName = React.ComponentProps<typeof MaterialIcons>['name'];

function tabIcon(name: MAIconName) {
  return ({ color }: { color: string }) => (
    <MaterialIcons name={name} size={24} color={color} />
  );
}

export default function GuardLayout() {
  const { palette, brand, colors } = useTheme();

  // ── Role guard ────────────────────────────────────────────────────────────
  const membership = useAuthStore((s) => {
    const m = s.activeOrganizationId
      ? s.memberships.find((x) => x.organizationId === s.activeOrganizationId) ?? s.memberships[0]
      : s.memberships[0];
    return m ?? null;
  });

  useEffect(() => {
    if (!membership) {
      router.replace('/(auth)/login');
      return;
    }
    if (membership.role.toUpperCase() !== 'GUARD') {
      routeByMembership(membership);
    }
  }, [membership]);
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: brand.blue,
        tabBarInactiveTintColor: palette.textMuted,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopColor: palette.border,
          borderTopWidth: 1,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: 'Inter_500Medium',
        },
      }}
    >
      {/* ── Visible tab: Home ───────────────────────────────────────────────── */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: tabIcon('home'),
        }}
      />

      {/* ── Visible tab: Scanner ────────────────────────────────────────────── */}
      <Tabs.Screen
        name="scanner"
        options={{
          title: 'Scanner',
          tabBarIcon: tabIcon('qr-code-scanner'),
        }}
      />

      {/* ── Visible tab: Alerts ─────────────────────────────────────────────── */}
      <Tabs.Screen
        name="alerts"
        options={{
          title: 'Alerts',
          tabBarIcon: tabIcon('notifications-none'),
        }}
      />

      {/* ── Visible tab: Activity ───────────────────────────────────────────── */}
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: tabIcon('history'),
        }}
      />

      {/* ── Visible tab: Profile ────────────────────────────────────────────── */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: tabIcon('person-outline'),
        }}
      />

      {/* ── Hidden route — pushed by QRScannerScreen after a successful scan ── */}
      <Tabs.Screen name="scan-result" options={{ href: null }} />
    </Tabs>
  );
}
