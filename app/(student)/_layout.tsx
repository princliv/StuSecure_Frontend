/**
 * Student tab layout.
 *
 * Visible tabs:  Home | Activity | QR | Alerts | Profile
 * Hidden routes: attendance, help, emergency  (quick-actions only)
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

export default function StudentLayout() {
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
    if (membership.role.toUpperCase() !== 'STUDENT') {
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
      {/* ── Visible tab: Home ─────────────────────────────────────────────── */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: tabIcon('home'),
        }}
      />

      {/* ── Visible tab: Activity ─────────────────────────────────────────── */}
      <Tabs.Screen
        name="activity"
        options={{
          title: 'Activity',
          tabBarIcon: tabIcon('history'),
        }}
      />

      {/* ── Visible tab: QR ───────────────────────────────────────────────── */}
      <Tabs.Screen
        name="qr"
        options={{
          title: 'QR',
          tabBarIcon: tabIcon('qr-code-2'),
        }}
      />

      {/* ── Visible tab: Alerts (notifications) ───────────────────────────── */}
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarIcon: tabIcon('notifications-none'),
        }}
      />

      {/* ── Visible tab: Profile ──────────────────────────────────────────── */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: tabIcon('person-outline'),
        }}
      />

      {/* ── Hidden routes — reachable via quick-actions, not the tab bar ──── */}
      <Tabs.Screen name="attendance" options={{ href: null }} />
      <Tabs.Screen name="help" options={{ href: null }} />
      <Tabs.Screen name="emergency" options={{ href: null }} />
    </Tabs>
  );
}
