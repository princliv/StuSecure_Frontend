/**
 * SelectOrgScreen — shown when the user belongs to more than one organization
 * (currently never in v1 — every user has exactly one org — but the screen is
 * ready for Group G multi-org membership).
 *
 * Also serves as the recovery screen whenever `activeOrganizationId` is null
 * after authentication (e.g. cold-start with a token but no cached selection).
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useTheme } from '@/hooks/useTheme';
import { brand, type AppPalette } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import BrandLogo from '@/components/ui/BrandLogo';
import Button from '@/components/ui/Button';
import LogoutConfirmationModal from '@/components/feedback/LogoutConfirmationModal';
import { useAuthStore } from '@/store/auth.store';
import { switchOrg } from '@/features/auth/orgs.api';
import type { Membership } from '@/features/auth/orgs.api';
import { routeByMembership } from '@/features/auth/routeByMembership';
import { performSignOut } from '@/features/auth/signOut';

const ROLE_ICON: Record<string, React.ComponentProps<typeof MaterialIcons>['name']> = {
  STUDENT: 'school',
  GUARD: 'security',
  FACULTY: 'co-present',
  ADMIN: 'admin-panel-settings',
};

export default function SelectOrgScreen() {
  const { palette, statusBarStyle } = useTheme();
  const styles = makeStyles(palette);
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);

  const { memberships, selectOrg } = useAuthStore();
  const [switching, setSwitching] = useState<string | null>(null); // orgId being switched
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (membership: Membership) => {
    setError(null);
    setSwitching(membership.organizationId);
    try {
      await switchOrg(membership.organizationId);
      selectOrg(membership);
      routeByMembership(membership);
    } catch {
      setError('Could not switch to that organization. Please try again.');
    } finally {
      setSwitching(null);
    }
  };

  const handleLogout = () => {
    setLogoutModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={palette.background} />

      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <View style={styles.heroSection}>
          <BrandLogo variant="with-name" height={52} style={{ marginBottom: spacing.lg }} />
          <Text style={styles.heroTitle}>Choose Organization</Text>
          <Text style={styles.heroSubtitle}>
            Select the organization you want to access.
          </Text>
        </View>

        {/* ── Error banner ──────────────────────────────────────────────── */}
        {error ? (
          <View style={styles.errorBanner}>
            <MaterialIcons name="error-outline" size={16} color={palette.error} />
            <Text style={styles.errorBannerText}>{error}</Text>
          </View>
        ) : null}

        {/* ── Org list ──────────────────────────────────────────────────── */}
        {memberships.length === 0 ? (
          <View style={styles.emptyCard}>
            <MaterialIcons name="domain-disabled" size={40} color={palette.textMuted} />
            <Text style={styles.emptyTitle}>No organizations found</Text>
            <Text style={styles.emptySubtitle}>
              Your account is not linked to any organization. Contact your
              administrator.
            </Text>
            <Button
              label="Sign Out"
              variant="outline"
              onPress={handleLogout}
              style={{ marginTop: spacing.lg }}
            />
          </View>
        ) : (
          <View style={styles.listCard}>
            {/* Decorative top stripe */}
            <View style={styles.cardTopStripe} />

            {memberships.map((m, idx) => {
              const isLast = idx === memberships.length - 1;
              const isLoading = switching === m.organizationId;
              const iconName = ROLE_ICON[m.role?.toUpperCase()] ?? 'business';

              return (
                <TouchableOpacity
                  key={m.organizationId}
                  style={[styles.orgRow, !isLast && styles.orgRowBorder]}
                  onPress={() => handleSelect(m)}
                  activeOpacity={0.7}
                  disabled={switching !== null}
                >
                  <View style={styles.orgIconWrap}>
                    <MaterialIcons name={iconName} size={22} color={brand.blue} />
                  </View>

                  <View style={styles.orgText}>
                    <Text style={styles.orgName}>{m.organizationName}</Text>
                    <Text style={styles.orgRole}>{m.role}</Text>
                  </View>

                  {isLoading ? (
                    <ActivityIndicator size="small" color={brand.blue} />
                  ) : (
                    <MaterialIcons
                      name="chevron-right"
                      size={22}
                      color={palette.textMuted}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Sign-out link ──────────────────────────────────────────────── */}
        {memberships.length > 0 ? (
          <TouchableOpacity
            style={styles.signOutRow}
            onPress={handleLogout}
            activeOpacity={0.7}
          >
            <MaterialIcons name="logout" size={16} color={palette.textMuted} />
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <LogoutConfirmationModal
        visible={logoutModalVisible}
        onClose={() => setLogoutModalVisible(false)}
        onConfirm={async () => {
          setLogoutModalVisible(false);
          await performSignOut();
        }}
        title="Sign Out of Account?"
        description="Are you sure you want to sign out? You will need to enter your credentials again to select an organization."
      />
    </SafeAreaView>
  );
}

const SIDE_MARGIN = 20;

function makeStyles(palette: AppPalette) {
  return StyleSheet.create({
    flex: { flex: 1 },

    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },

    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: SIDE_MARGIN,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xxl,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ── Hero ──────────────────────────────────────────────────────────────────

    heroSection: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },

    heroTitle: {
      fontSize: 26,
      fontWeight: '700',
      color: palette.textPrimary,
      marginBottom: spacing.xs,
      textAlign: 'center',
      fontFamily: 'Inter_700Bold',
    },

    heroSubtitle: {
      fontSize: 14,
      color: palette.textMuted,
      textAlign: 'center',
      fontFamily: 'Inter_400Regular',
    },

    // ── Error banner ──────────────────────────────────────────────────────────

    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: palette.errorContainer,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
      width: '100%',
    },
    errorBannerText: {
      flex: 1,
      fontSize: 13,
      color: palette.error,
      fontFamily: 'Inter_400Regular',
    },

    // ── Org list card ──────────────────────────────────────────────────────────

    listCard: {
      width: '100%',
      backgroundColor: palette.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: palette.border,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 16,
      elevation: 4,
    },

    cardTopStripe: {
      height: 3,
      backgroundColor: brand.blue,
    },

    orgRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },
    orgRowBorder: {
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },

    orgIconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: palette.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },

    orgText: {
      flex: 1,
    },
    orgName: {
      fontSize: 15,
      fontWeight: '600',
      color: palette.textPrimary,
      fontFamily: 'Inter_600SemiBold',
    },
    orgRole: {
      fontSize: 12,
      color: palette.textMuted,
      fontFamily: 'Inter_400Regular',
      marginTop: 2,
    },

    // ── Empty state ───────────────────────────────────────────────────────────

    emptyCard: {
      width: '100%',
      backgroundColor: palette.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xxl,
      alignItems: 'center',
      gap: spacing.sm,
    },
    emptyTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: palette.textPrimary,
      fontFamily: 'Inter_600SemiBold',
    },
    emptySubtitle: {
      fontSize: 14,
      color: palette.textMuted,
      textAlign: 'center',
      fontFamily: 'Inter_400Regular',
    },

    // ── Sign-out ──────────────────────────────────────────────────────────────

    signOutRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.xl,
    },
    signOutText: {
      fontSize: 14,
      color: palette.textMuted,
      fontFamily: 'Inter_400Regular',
    },
  });
}
