/**
 * StudentHomeScreen — "Secure Modernity" design system.
 *
 * Sections (top → bottom):
 *   1. Sticky header  – BrandLogo + title | StudentAvatar
 *   2. Greeting       – Good {time}, {firstName}
 *   3. Digital Pass   – blue hero card, status pill, Show QR CTA
 *   4. Quick Actions  – 4-up grid: My QR / Attendance / Help / Emergency
 *   5. Today's Movement – entry/exit counts + View sparkline
 *   6. Recent Activity  – timeline list + "View All"
 *
 * Full dark-mode support via useTheme().
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/hooks/useTheme';
import { brand } from '@/theme/colors';
import type { AppPalette } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import BrandLogo from '@/components/ui/BrandLogo';
import StudentAvatar from '@/components/ui/StudentAvatar';

// ─── Design tokens (pass card — always brand blue, theme-independent) ────────

/** Main pass card background — always brand blue */
const PASS_BG = '#0050d7';

// ─── Mock placeholder data ───────────────────────────────────────────────────

const MOCK_MOVEMENT = { entries: 2, exits: 1 };

const MOCK_ACTIVITY = [
  {
    id: '1',
    type: 'entry' as const,
    label: 'Entered Campus',
    time: '08:42 AM',
    location: 'Hostel Gate A • Main Turnstile',
  },
  {
    id: '2',
    type: 'exit' as const,
    label: 'Exited Campus',
    time: '07:15 AM',
    location: 'Main Gate • Pedestrian Lane 2',
  },
  {
    id: '3',
    type: 'entry' as const,
    label: 'Entered Campus',
    time: 'Yesterday',
    location: 'Hostel Gate A • Main Turnstile',
  },
] as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// ─── Pulsing dot ─────────────────────────────────────────────────────────────

function PulseDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1.8,
            duration: 750,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 750,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(scale, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0.7,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale, opacity]);

  return (
    <View style={pulseDotStyles.wrap}>
      <Animated.View
        style={[
          pulseDotStyles.ring,
          { transform: [{ scale }], opacity },
        ]}
      />
      <View style={pulseDotStyles.core} />
    </View>
  );
}

const pulseDotStyles = StyleSheet.create({
  wrap: {
    width: 12,
    height: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#34d399',
  },
  core: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34d399',
  },
});

// ─── Sparkline (pure View — no SVG dependency) ───────────────────────────────

const SPARK_PTS: [number, number][] = [
  [0, 95],
  [20, 60],
  [40, 75],
  [60, 20],
  [80, 38],
  [100, 10],
];

function SparkLine() {
  const W = 72;
  const H = 56;
  const LINE_W = 2.5;

  return (
    <View style={{ width: W, height: H }}>
      {SPARK_PTS.slice(0, -1).map((p1, i) => {
        const p2 = SPARK_PTS[i + 1];
        const x1 = (p1[0] / 100) * W;
        const y1 = (p1[1] / 100) * H;
        const x2 = (p2[0] / 100) * W;
        const y2 = (p2[1] / 100) * H;
        const segLen = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
        const angleDeg = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
        const cx = (x1 + x2) / 2;
        const cy = (y1 + y2) / 2;

        return (
          <View
            key={i}
            style={{
              position: 'absolute',
              left: cx - segLen / 2,
              top: cy - LINE_W / 2,
              width: segLen,
              height: LINE_W,
              backgroundColor: brand.blue,
              borderRadius: 2,
              transform: [{ rotate: `${angleDeg}deg` }],
            }}
          />
        );
      })}
    </View>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function StudentHomeScreen() {
  const router = useRouter();
  const { palette, isDark, statusBarStyle } = useTheme();
  const { profile, firebaseUser } = useAuthStore();

  // Theme-derived tokens
  const ICON_BG = palette.secondaryFixed;
  const ICON_FG = isDark ? palette.onSecondaryFixed : '#0050d7';
  const COLOR_ENTRIES = brand.blue;
  const COLOR_EXIT = palette.error;

  const styles = makeStyles(palette, ICON_BG, ICON_FG);

  const displayName =
    profile?.displayName ?? firebaseUser?.displayName ?? 'Student';
  const firstName = displayName.split(' ')[0];
  const initials = getInitials(displayName);

  const studentId = profile?.id
    ? `STU-${profile.id.slice(-8).toUpperCase()}`
    : 'STU-2024-0001';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={palette.surface} />

      {/* ── Sticky header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BrandLogo height={22} />
          <Text style={styles.headerTitle}>Student Home</Text>
        </View>

        <StudentAvatar
          size={36}
          useHeadshot={false}
          initials={initials}
          onPress={() => router.push('/(student)/profile')}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Greeting ─────────────────────────────────────────────────────── */}
        <View style={styles.greetingSection}>
          <Text style={styles.greetingText}>
            {getGreeting()}, {firstName}
          </Text>
          <Text style={styles.greetingSubtext}>
            Here is your campus status for today.
          </Text>
        </View>

        {/* ── Digital Pass card ────────────────────────────────────────────── */}
        <View style={styles.padH}>
          <View style={styles.passCard}>
            {/* Decorative glow blob */}
            <View style={styles.passGlow} />

            {/* Top row: info + avatar */}
            <View style={styles.passTopRow}>
              <View style={styles.passInfoCol}>
                <Text style={styles.passLabel}>DIGITAL PASS</Text>
                <Text style={styles.passName}>{displayName}</Text>
                <Text style={styles.passIdText}>ID: {studentId}</Text>
              </View>
              {/* StudentAvatar on blue card — white ring border */}
              <StudentAvatar
                size={52}
                useHeadshot
                style={{
                  marginLeft: spacing.md,
                  borderColor: 'rgba(255,255,255,0.25)',
                  borderWidth: 2,
                  borderRadius: 26,
                }}
              />
            </View>

            {/* Divider */}
            <View style={styles.passDivider} />

            {/* Status row */}
            <View style={styles.passStatusRow}>
              <View style={styles.statusPill}>
                <PulseDot />
                <Text style={styles.statusPillText}>Currently Inside</Text>
              </View>
              <Text style={styles.passLocation}>Hostel Gate A</Text>
            </View>

            {/* Show QR button */}
            <TouchableOpacity
              style={styles.showQrBtn}
              onPress={() => router.push('/(student)/qr')}
              activeOpacity={0.85}
            >
              <MaterialIcons name="qr-code-scanner" size={18} color={PASS_BG} />
              <Text style={styles.showQrText}>Show QR</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Quick Actions ─────────────────────────────────────────────────── */}
        <View style={styles.padH}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.quickActionsRow}>
            <QuickAction
              iconName="qr-code-2"
              iconBg={ICON_BG}
              iconFg={ICON_FG}
              label="My QR"
              onPress={() => router.push('/(student)/qr')}
            />
            <QuickAction
              iconName="fact-check"
              iconBg={palette.surfaceVariant}
              iconFg={palette.textPrimary}
              label="Attendance"
              onPress={() => router.push('/(student)/attendance')}
            />
            <QuickAction
              iconName="help-outline"
              iconBg={palette.surfaceVariant}
              iconFg={palette.textPrimary}
              label="Help"
              onPress={() => router.push('/(student)/help')}
            />
            <QuickAction
              iconName="warning"
              iconBg={palette.errorContainer}
              iconFg={palette.error}
              label="Emergency"
              labelColor={palette.error}
              onPress={() => router.push('/(student)/emergency')}
            />
          </View>
        </View>

        {/* ── Today's Movement ──────────────────────────────────────────────── */}
        <View style={styles.padH}>
          <View style={styles.movementCard}>
            <View>
              <Text style={styles.movementHeading}>TODAY'S MOVEMENT</Text>
              <View style={styles.movementCounts}>
                <View>
                  <Text style={styles.movementNum}>{MOCK_MOVEMENT.entries}</Text>
                  <Text style={[styles.movementCountLabel, { color: COLOR_ENTRIES }]}>
                    Entries
                  </Text>
                </View>
                <View style={styles.movementDivider} />
                <View>
                  <Text style={styles.movementNum}>{MOCK_MOVEMENT.exits}</Text>
                  <Text style={[styles.movementCountLabel, { color: COLOR_EXIT }]}>
                    Exit
                  </Text>
                </View>
              </View>
            </View>
            <SparkLine />
          </View>
        </View>

        {/* ── Recent Activity ───────────────────────────────────────────────── */}
        <View style={styles.padH}>
          <View style={styles.activityHeader}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            <TouchableOpacity
              onPress={() => router.push('/(student)/activity')}
              activeOpacity={0.7}
            >
              <Text style={styles.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.activityCard}>
            {/* Dashed connecting line sitting behind the icons */}
            <View style={styles.activityConnector} />

            {MOCK_ACTIVITY.map((item, idx) => (
              <View
                key={item.id}
                style={[
                  styles.activityItem,
                  idx < MOCK_ACTIVITY.length - 1 && styles.activityItemBorder,
                ]}
              >
                <View
                  style={[
                    styles.activityIconWrap,
                    item.type === 'entry'
                      ? { backgroundColor: ICON_BG }
                      : styles.activityIconExit,
                  ]}
                >
                  <MaterialIcons
                    name={item.type === 'entry' ? 'login' : 'logout'}
                    size={16}
                    color={item.type === 'entry' ? ICON_FG : palette.error}
                  />
                </View>
                <View style={styles.activityTextCol}>
                  <View style={styles.activityTextRow}>
                    <Text style={styles.activityLabel} numberOfLines={1}>
                      {item.label}
                    </Text>
                    <Text style={styles.activityTime}>{item.time}</Text>
                  </View>
                  <Text style={styles.activityLocation} numberOfLines={1}>
                    {item.location}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Bottom breathing room */}
        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── QuickAction sub-component ───────────────────────────────────────────────

type MAIconName = React.ComponentProps<typeof MaterialIcons>['name'];

function QuickAction({
  iconName,
  iconBg,
  iconFg,
  label,
  labelColor,
  onPress,
}: {
  iconName: MAIconName;
  iconBg: string;
  iconFg: string;
  label: string;
  labelColor?: string;
  onPress: () => void;
}) {
  const { palette } = useTheme();
  return (
    <TouchableOpacity
      style={quickActionStyles.quickAction}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={[quickActionStyles.quickActionIcon, { backgroundColor: iconBg }]}>
        <MaterialIcons name={iconName} size={26} color={iconFg} />
      </View>
      <Text
        style={[
          quickActionStyles.quickActionLabel,
          { color: labelColor ?? palette.textMuted },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const quickActionStyles = StyleSheet.create({
  quickAction: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionLabel: {
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'Inter_400Regular',
  },
});

// ─── Styles factory ──────────────────────────────────────────────────────────

const SIDE = 20;

function makeStyles(palette: AppPalette, iconBg: string, iconFg: string) {
  return StyleSheet.create({
    // ── Layout ────────────────────────────────────────────────────────────────
    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },
    scroll: { flex: 1 },
    scrollContent: { paddingTop: spacing.md },
    padH: { paddingHorizontal: SIDE, marginBottom: spacing.md + 4 },

    // ── Header ────────────────────────────────────────────────────────────────
    header: {
      height: 64,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SIDE,
      backgroundColor: palette.surface,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: palette.textPrimary,
      fontFamily: 'Inter_600SemiBold',
    },

    // ── Greeting ──────────────────────────────────────────────────────────────
    greetingSection: {
      paddingHorizontal: SIDE,
      paddingTop: spacing.sm,
      marginBottom: spacing.md + 4,
    },
    greetingText: {
      fontSize: 28,
      fontWeight: '700',
      color: palette.textPrimary,
      fontFamily: 'Inter_700Bold',
      lineHeight: 36,
    },
    greetingSubtext: {
      fontSize: 14,
      color: palette.textMuted,
      marginTop: spacing.xs,
      fontFamily: 'Inter_400Regular',
    },

    // ── Digital Pass card ─────────────────────────────────────────────────────
    passCard: {
      backgroundColor: PASS_BG,
      borderRadius: radius.xxl,
      padding: spacing.lg,
      overflow: 'hidden',
      shadowColor: PASS_BG,
      shadowOffset: { width: 0, height: 6 },
      shadowOpacity: 0.35,
      shadowRadius: 16,
      elevation: 8,
    },
    passGlow: {
      position: 'absolute',
      top: -48,
      right: -48,
      width: 180,
      height: 180,
      borderRadius: 90,
      backgroundColor: 'rgba(255,255,255,0.10)',
    },
    passTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
    },
    passInfoCol: { flex: 1 },
    passLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: 'rgba(255,255,255,0.75)',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontFamily: 'Inter_600SemiBold',
    },
    passName: {
      fontSize: 20,
      fontWeight: '700',
      color: '#fff',
      marginTop: spacing.xs,
      fontFamily: 'Inter_700Bold',
    },
    passIdText: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.85)',
      marginTop: spacing.xxs,
      fontFamily: 'Inter_400Regular',
    },
    passDivider: {
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.20)',
      marginVertical: spacing.md,
    },
    passStatusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginBottom: spacing.xl + 4,
    },
    statusPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: 'rgba(255,255,255,0.18)',
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
    },
    statusPillText: {
      fontSize: 12,
      fontWeight: '500',
      color: '#fff',
      fontFamily: 'Inter_500Medium',
    },
    passLocation: {
      fontSize: 13,
      color: 'rgba(255,255,255,0.80)',
      fontFamily: 'Inter_400Regular',
    },
    showQrBtn: {
      position: 'absolute',
      bottom: spacing.lg,
      right: spacing.lg,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: '#ffffff',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      borderRadius: radius.xl,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 6,
      elevation: 4,
    },
    showQrText: {
      fontSize: 14,
      fontWeight: '600',
      color: PASS_BG,
      fontFamily: 'Inter_600SemiBold',
    },

    // ── Section title ─────────────────────────────────────────────────────────
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: palette.textPrimary,
      marginBottom: spacing.md,
      fontFamily: 'Inter_600SemiBold',
    },
    quickActionsRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },

    // ── Today's Movement ──────────────────────────────────────────────────────
    movementCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: palette.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: spacing.md + 4,
      paddingVertical: spacing.md,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    movementHeading: {
      fontSize: 11,
      fontWeight: '600',
      color: palette.textMuted,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      fontFamily: 'Inter_600SemiBold',
      marginBottom: spacing.sm,
    },
    movementCounts: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.md,
    },
    movementNum: {
      fontSize: 28,
      fontWeight: '700',
      color: palette.textPrimary,
      lineHeight: 32,
      fontFamily: 'Inter_700Bold',
    },
    movementCountLabel: {
      fontSize: 12,
      fontWeight: '500',
      fontFamily: 'Inter_500Medium',
      marginTop: 2,
    },
    movementDivider: {
      width: 1,
      height: 28,
      backgroundColor: palette.border,
      marginBottom: 4,
    },

    // ── Recent Activity ───────────────────────────────────────────────────────
    activityHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    viewAllLink: {
      fontSize: 13,
      fontWeight: '600',
      color: brand.blue,
      fontFamily: 'Inter_600SemiBold',
    },
    activityCard: {
      backgroundColor: palette.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
      overflow: 'hidden',
    },
    activityConnector: {
      position: 'absolute',
      left: spacing.md + 16,
      top: spacing.sm + 16,
      bottom: spacing.sm + 16,
      width: 2,
      borderStyle: 'dashed',
      borderLeftWidth: 2,
      borderLeftColor: palette.border,
    },
    activityItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingVertical: spacing.md - 2,
      gap: spacing.md,
    },
    activityItemBorder: {
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
    },
    activityIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2.5,
      borderColor: palette.surface,
      zIndex: 1,
    },
    activityIconExit: { backgroundColor: palette.errorContainer },
    activityTextCol: { flex: 1, paddingTop: 2 },
    activityTextRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    activityLabel: {
      flex: 1,
      fontSize: 14,
      fontWeight: '500',
      color: palette.textPrimary,
      fontFamily: 'Inter_500Medium',
    },
    activityTime: {
      fontSize: 12,
      color: palette.textMuted,
      fontFamily: 'Inter_400Regular',
      flexShrink: 0,
    },
    activityLocation: {
      fontSize: 12,
      color: palette.textMuted,
      marginTop: 2,
      fontFamily: 'Inter_400Regular',
    },
  });
}
