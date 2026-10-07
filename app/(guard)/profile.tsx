import React, { useState } from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import BrandLogo from '@/components/ui/BrandLogo';
import LogoutConfirmationModal from '@/components/feedback/LogoutConfirmationModal';
import { useAuthStore } from '@/store/auth.store';
import { performSignOut } from '@/features/auth/signOut';

function InfoRow({
  icon,
  label,
  value,
  isLast = false,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  value: string;
  isLast?: boolean;
}) {
  const { palette } = useTheme();
  return (
    <View style={[styles.infoRow, !isLast && { borderBottomColor: palette.border, borderBottomWidth: 1 }]}>
      <View style={[styles.rowIconWrap, { backgroundColor: palette.surfaceVariant }]}>
        <MaterialIcons name={icon} size={18} color={palette.textMuted} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: palette.textMuted }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: palette.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
}

export default function GuardProfileScreen() {
  const router = useRouter();
  const { palette, brand, isDark, statusBarStyle } = useTheme();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const profile = useAuthStore((s) => s.profile);
  const membership = useAuthStore((s) => {
    const m = s.activeOrganizationId
      ? s.memberships.find((x) => x.organizationId === s.activeOrganizationId) ?? s.memberships[0]
      : s.memberships[0];
    return m ?? null;
  });

  const displayName = profile?.displayName ?? 'Guard Officer';
  const email = profile?.email ?? '—';
  const orgName = membership?.organizationName ?? 'Campus Security Department';
  const role = membership?.role ?? 'GUARD';

  const initials = displayName
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'GD';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={palette.background} />

      {/* ── Modern Topbar ────────────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: palette.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(guard)'))}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="arrow-back" size={20} color={palette.textPrimary} />
          </TouchableOpacity>
          <BrandLogo variant="icon" size={26} />
          <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>Guard Profile</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* ── Hero Profile Card ──────────────────────────────────────── */}
        <View
          style={[
            styles.heroCard,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        >
          {/* Subtle Top Accent */}
          <View style={[styles.heroStripe, { backgroundColor: brand.blue }]} />

          {/* Large Modern Avatar */}
          <View
            style={[
              styles.avatarContainer,
              {
                backgroundColor: isDark ? 'rgba(30, 58, 95, 0.4)' : '#DBEAFE',
                borderColor: brand.blue,
              },
            ]}
          >
            <MaterialIcons name="security" size={40} color={brand.blue} />
            <View style={[styles.onlineBadge, { borderColor: palette.surface }]}>
              <View style={styles.onlineDot} />
            </View>
          </View>

          <Text style={[styles.name, { color: palette.textPrimary }]}>{displayName}</Text>

          {/* Role & Status Badges */}
          <View style={styles.badgesRow}>
            <View
              style={[
                styles.roleBadge,
                {
                  backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(21, 94, 239, 0.08)',
                  borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(21, 94, 239, 0.2)',
                },
              ]}
            >
              <MaterialIcons name="verified-user" size={13} color={isDark ? '#38BDF8' : brand.blue} />
              <Text style={[styles.roleBadgeText, { color: isDark ? '#38BDF8' : brand.blue }]}>
                {role}
              </Text>
            </View>

            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : '#E6F4EA',
                  borderColor: isDark ? 'rgba(52, 211, 153, 0.35)' : '#C6F6D5',
                },
              ]}
            >
              <View style={styles.statusDot} />
              <Text style={[styles.statusBadgeText, { color: isDark ? '#34D399' : '#047857' }]}>
                On Duty
              </Text>
            </View>
          </View>
        </View>

        {/* ── Security Officer Credentials ────────────────────────────── */}
        <Text style={[styles.sectionHeading, { color: palette.textMuted }]}>OFFICER CREDENTIALS</Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        >
          <InfoRow icon="email" label="Officer Email" value={email} />
          <InfoRow icon="business" label="Assigned Organization" value={orgName} />
          <InfoRow icon="badge" label="Post Location" value="Main Campus Gate & Turnstiles" />
          <InfoRow icon="schedule" label="Current Shift" value="Active Operational Shift" isLast />
        </View>

        {/* ── System Information ──────────────────────────────────────── */}
        <Text style={[styles.sectionHeading, { color: palette.textMuted }]}>SYSTEM & PREFERENCES</Text>
        <View
          style={[
            styles.card,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        >
          <InfoRow
            icon={isDark ? 'dark-mode' : 'light-mode'}
            label="Theme Appearance"
            value={isDark ? 'Dark Mode (Active)' : 'Light Mode (Active)'}
          />
          <InfoRow icon="qr-code-scanner" label="Scanner Protocol" value="Encrypted Dynamic QR v2" />
          <InfoRow icon="info-outline" label="App Version" value="StuSecure v1.0.0 (Secure Modernity)" isLast />
        </View>

        {/* ── Modern Sign Out CTA ─────────────────────────────────────── */}
        <TouchableOpacity
          style={[
            styles.logoutBtn,
            {
              backgroundColor: isDark ? 'rgba(255, 138, 128, 0.1)' : 'rgba(186, 26, 26, 0.05)',
              borderColor: `${palette.error}44`,
            },
          ]}
          onPress={() => setLogoutModalVisible(true)}
          activeOpacity={0.8}
        >
          <MaterialIcons name="logout" size={18} color={palette.error} />
          <Text style={[styles.logoutBtnText, { color: palette.error }]}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Logout Modal ────────────────────────────────────────────── */}
      <LogoutConfirmationModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        onConfirm={async () => {
          setLogoutModalVisible(false);
          await performSignOut();
        }}
        title="Sign Out of Guard Account?"
        description="Are you sure you want to sign out? Active duty sessions and checkpoint access will be closed."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 4,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },

  // Hero Card
  heroCard: {
    borderWidth: 1,
    borderRadius: radius.xxl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  heroStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  avatarContainer: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    position: 'relative',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginTop: 4,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },

  // Section Heading
  sectionHeading: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    fontFamily: 'Inter_600SemiBold',
    marginLeft: 4,
    marginTop: spacing.xs,
  },

  // Standard Card
  card: {
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 14,
  },
  rowIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowLabel: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
  rowValue: {
    fontSize: 14,
    fontFamily: 'Inter_500Medium',
    marginTop: 2,
  },

  // Sign out button
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    height: 50,
    borderRadius: radius.xl,
    borderWidth: 1,
    marginTop: spacing.md,
  },
  logoutBtnText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});
