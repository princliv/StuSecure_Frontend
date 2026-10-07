import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import axios from 'axios';

import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import BrandLogo from '@/components/ui/BrandLogo';
import StudentAvatar from '@/components/ui/StudentAvatar';
import LogoutConfirmationModal from '@/components/feedback/LogoutConfirmationModal';
import { studentApi, type Student } from '@/services/api/student.api';
import { useAuthStore } from '@/store/auth.store';
import { performSignOut } from '@/features/auth/signOut';

function errorMessage(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined;
    return data?.error ?? 'Could not load your profile.';
  }
  return 'Could not load your profile.';
}

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

export default function StudentProfileScreen() {
  const router = useRouter();
  const { palette, brand, isDark, statusBarStyle } = useTheme();
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const membership = useAuthStore((s) => {
    const m = s.activeOrganizationId
      ? s.memberships.find((x) => x.organizationId === s.activeOrganizationId) ?? s.memberships[0]
      : s.memberships[0];
    return m ?? null;
  });

  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await studentApi.getMyProfile();
      setStudent(data);
      setError(null);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const displayName = student?.name ?? 'Student';
  const orgName = membership?.organizationName ?? 'University Campus';

  const initials = displayName
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'ST';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={palette.background} />

      {/* ── Modern Topbar ────────────────────────────────────────────── */}
      <View style={[styles.header, { borderBottomColor: palette.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={[styles.backBtn, { backgroundColor: palette.surface, borderColor: palette.border }]}
            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(student)'))}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="arrow-back" size={20} color={palette.textPrimary} />
          </TouchableOpacity>
          <BrandLogo variant="icon" size={26} />
          <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>Student Profile</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={brand.blue} />
        }
      >
        {error ? (
          <View style={[styles.errorBanner, { backgroundColor: palette.errorContainer, borderColor: `${palette.error}40` }]}>
            <MaterialIcons name="error-outline" size={18} color={palette.error} />
            <Text style={{ color: palette.error, flex: 1, fontSize: 13 }}>{error}</Text>
          </View>
        ) : null}

        {loading && !student ? (
          <ActivityIndicator color={brand.blue} style={{ marginTop: spacing.xl }} />
        ) : (
          <>
            {/* ── Hero Profile Card ────────────────────────────────────── */}
            <View
              style={[
                styles.heroCard,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
              ]}
            >
              <View style={[styles.heroStripe, { backgroundColor: brand.blue }]} />

              {/* Modern Avatar with Active Ring */}
              <View style={styles.avatarWrap}>
                <StudentAvatar
                  size={76}
                  useHeadshot={false}
                  initials={initials}
                  style={{ borderWidth: 2, borderColor: brand.blue }}
                />
                <View style={[styles.statusRing, { borderColor: palette.surface }]}>
                  <View style={styles.statusDot} />
                </View>
              </View>

              <Text style={[styles.name, { color: palette.textPrimary }]}>{displayName}</Text>
              <Text style={[styles.email, { color: palette.textMuted }]}>{student?.email ?? '—'}</Text>

              {/* Badges Row */}
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
                  <MaterialIcons name="school" size={13} color={isDark ? '#38BDF8' : brand.blue} />
                  <Text style={[styles.roleBadgeText, { color: isDark ? '#38BDF8' : brand.blue }]}>
                    STUDENT
                  </Text>
                </View>

                <View
                  style={[
                    styles.accessBadge,
                    {
                      backgroundColor: isDark ? 'rgba(52, 211, 153, 0.15)' : '#E6F4EA',
                      borderColor: isDark ? 'rgba(52, 211, 153, 0.35)' : '#C6F6D5',
                    },
                  ]}
                >
                  <MaterialIcons name="check-circle" size={13} color={isDark ? '#34D399' : '#047857'} />
                  <Text style={[styles.accessBadgeText, { color: isDark ? '#34D399' : '#047857' }]}>
                    Campus Pass Active
                  </Text>
                </View>
              </View>
            </View>

            {/* ── Student Information Group ────────────────────────────── */}
            <Text style={[styles.sectionHeading, { color: palette.textMuted }]}>STUDENT INFORMATION</Text>
            <View
              style={[
                styles.card,
                {
                  backgroundColor: palette.surface,
                  borderColor: palette.border,
                },
              ]}
            >
              <InfoRow icon="email" label="Institutional Email" value={student?.email ?? '—'} />
              <InfoRow icon="badge" label="Enrollment Number" value={student?.enrollmentNo ?? '—'} />
              {student?.phone ? (
                <InfoRow icon="phone" label="Phone Number" value={student.phone} />
              ) : null}
              <InfoRow icon="business" label="Institution / Organization" value={orgName} isLast={!student?.hostelName} />
              {student?.hostelName ? (
                <InfoRow
                  icon="apartment"
                  label="Hostel & Room"
                  value={`${student.hostelName}${student.roomNumber ? ` · Room ${student.roomNumber}` : ''}`}
                  isLast
                />
              ) : null}
            </View>

            {/* ── Security & Preferences Group ─────────────────────────── */}
            <Text style={[styles.sectionHeading, { color: palette.textMuted }]}>SECURITY & APP PREFERENCES</Text>
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
                icon="qr-code-2"
                label="Digital Pass QR"
                value="Dynamic TOTP Secured"
              />
              <InfoRow
                icon={isDark ? 'dark-mode' : 'light-mode'}
                label="Theme Mode"
                value={isDark ? 'Dark Theme' : 'Light Theme'}
              />
              <InfoRow
                icon="verified"
                label="App Version"
                value="StuSecure v1.0.0 (Secure Modernity)"
                isLast
              />
            </View>

            {/* ── Modern Sign Out CTA ─────────────────────────────────── */}
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
          </>
        )}
      </ScrollView>

      {/* ── Logout Modal ────────────────────────────────────────────── */}
      <LogoutConfirmationModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        onConfirm={async () => {
          setLogoutModalVisible(false);
          await performSignOut();
        }}
        title="Sign Out of Student Account?"
        description="Are you sure you want to sign out? You will need your student credentials to show your digital campus QR pass."
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

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.xs,
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
  avatarWrap: {
    position: 'relative',
    marginBottom: spacing.xs,
  },
  statusRing: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  name: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginTop: 6,
  },
  email: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
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
  accessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    borderWidth: 1,
  },
  accessBadgeText: {
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

  // Logout Button
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
