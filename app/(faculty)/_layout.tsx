/**
 * Faculty tab layout.
 *
 * Visible tabs:  Dashboard | Monitor | Students | Emergency | Profile
 * Hidden routes: attendance, guards, help-requests, reports
 *
 * Tab bar is theme-aware via useTheme().
 */

import { Tabs } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@/hooks/useTheme';
import { HapticTab } from '@/components/navigation/haptic-tab';

type MAIconName = React.ComponentProps<typeof MaterialIcons>['name'];

function tabIcon(name: MAIconName) {
  return ({ color }: { color: string }) => (
    <MaterialIcons name={name} size={24} color={color} />
  );
}

export default function FacultyLayout() {
  const { palette, brand, colors } = useTheme();

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
      {/* ── Visible tab: Dashboard ─────────────────────────────────────────── */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: tabIcon('dashboard'),
        }}
      />

      {/* ── Visible tab: Monitor ──────────────────────────────────────────── */}
      <Tabs.Screen
        name="monitoring"
        options={{
          title: 'Monitor',
          tabBarIcon: tabIcon('monitor-heart'),
        }}
      />

      {/* ── Visible tab: Students ─────────────────────────────────────────── */}
      <Tabs.Screen
        name="students"
        options={{
          title: 'Students',
          tabBarIcon: tabIcon('people-outline'),
        }}
      />

      {/* ── Visible tab: Emergency ────────────────────────────────────────── */}
      <Tabs.Screen
        name="emergency"
        options={{
          title: 'Emergency',
          tabBarIcon: tabIcon('emergency'),
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

      {/* ── Hidden routes — not in the tab bar ───────────────────────────── */}
      <Tabs.Screen name="attendance" options={{ href: null }} />
      <Tabs.Screen name="guards" options={{ href: null }} />
      <Tabs.Screen name="help-requests" options={{ href: null }} />
      <Tabs.Screen name="reports" options={{ href: null }} />
    </Tabs>
  );
}
