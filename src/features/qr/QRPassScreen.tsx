/**
 * QRPassScreen — "My QR Pass" / "Student QR"
 *
 * Layout (top → bottom):
 *   1. Sticky header  – BrandLogo + "Student QR" | StudentAvatar → profile
 *   2. Digital Pass card (surface bg, radius 24, soft navy shadow)
 *      a. StudentAvatar + green active pulse dot
 *      b. Name + student-ID (badge icon)
 *      c. Green "Active" pill
 *      d. Hostel | Room row
 *      e. Large QR code + blue corner brackets
 *      f. Helper text + auto-refresh countdown pill
 *      g. Gradient footer stripe
 *   3. Two action buttons: Max Brightness | Manual Refresh
 *
 * Full dark-mode support via useTheme().
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
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
import QRCode from 'react-native-qrcode-svg';
import * as Brightness from 'expo-brightness';
import { useAuthStore } from '@/store/auth.store';
import { useTheme } from '@/hooks/useTheme';
import { brand } from '@/theme/colors';
import type { AppPalette } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import BrandLogo from '@/components/ui/BrandLogo';
import StudentAvatar from '@/components/ui/StudentAvatar';

// ─── Design tokens ────────────────────────────────────────────────────────────

/** Design-system secondary: #0050d7 */
const BLUE = '#0050d7';
/** Active green */
const GREEN = '#10B981';
const GREEN_DARK = '#047857';
/** Soft navy-tinted shadow colour */
const SHADOW_NAVY = '#091C35';

const MOCK_HOSTEL = 'Block B';
const MOCK_ROOM = '302';
const QR_REFRESH_SECONDS = 60;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateQRValue(uid?: string): string {
  const base = uid ?? 'demo';
  return `stusecure-${base}-${Date.now()}`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// ─── Pulsing active dot ───────────────────────────────────────────────────────

function PulseDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.75)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 2.2, duration: 800, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 800, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.75, duration: 0, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale, opacity]);

  return (
    <View style={pulseDotStyles.wrap}>
      <Animated.View style={[pulseDotStyles.ring, { transform: [{ scale }], opacity }]} />
      <View style={pulseDotStyles.core} />
    </View>
  );
}

const pulseDotStyles = StyleSheet.create({
  wrap: { width: 14, height: 14, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: GREEN,
  },
  core: { width: 9, height: 9, borderRadius: 4.5, backgroundColor: GREEN },
});

// ─── Blue corner bracket overlay ─────────────────────────────────────────────

function CornerBrackets({ size }: { size: number }) {
  const L = 18;
  const T = 2.5;
  const R = 6;
  const corners: Array<{
    top?: number; bottom?: number; left?: number; right?: number;
    borderTopWidth?: number; borderBottomWidth?: number;
    borderLeftWidth?: number; borderRightWidth?: number;
    borderTopLeftRadius?: number; borderTopRightRadius?: number;
    borderBottomLeftRadius?: number; borderBottomRightRadius?: number;
  }> = [
    { top: -1, left: -1, borderTopWidth: T, borderLeftWidth: T, borderTopLeftRadius: R },
    { top: -1, right: -1, borderTopWidth: T, borderRightWidth: T, borderTopRightRadius: R },
    { bottom: -1, left: -1, borderBottomWidth: T, borderLeftWidth: T, borderBottomLeftRadius: R },
    { bottom: -1, right: -1, borderBottomWidth: T, borderRightWidth: T, borderBottomRightRadius: R },
  ];

  return (
    <>
      {corners.map((c, i) => (
        <View
          key={i}
          style={[
            {
              position: 'absolute',
              width: L,
              height: L,
              borderColor: BLUE,
            },
            c,
          ]}
        />
      ))}
    </>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function QRPassScreen() {
  const router = useRouter();
  const { palette, isDark, statusBarStyle } = useTheme();
  const { profile, firebaseUser } = useAuthStore();

  // Theme-derived icon colours
  const ICON_BG = palette.secondaryFixed;
  const ICON_FG = isDark ? palette.onSecondaryFixed : BLUE;

  const styles = makeStyles(palette, ICON_BG, ICON_FG);

  const displayName =
    profile?.displayName ?? firebaseUser?.displayName ?? 'Student';
  const initials = getInitials(displayName);
  const studentId = profile?.id
    ? `STU${profile.id.slice(-8).toUpperCase()}`
    : 'STU202408';
  const uid = firebaseUser?.uid ?? profile?.id;

  // ── QR token + countdown ──────────────────────────────────────────────────

  const [qrValue, setQrValue] = useState(() => generateQRValue(uid));
  const [countdown, setCountdown] = useState(QR_REFRESH_SECONDS);
  const refreshSpin = useRef(new Animated.Value(0)).current;

  const triggerRefresh = useCallback(() => {
    setQrValue(generateQRValue(uid));
    setCountdown(QR_REFRESH_SECONDS);
    refreshSpin.setValue(0);
    Animated.timing(refreshSpin, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [uid, refreshSpin]);

  // Countdown ticker
  useEffect(() => {
    const id = setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          triggerRefresh();
          return QR_REFRESH_SECONDS;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [triggerRefresh]);

  const spinInterpolation = refreshSpin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // ── Brightness ────────────────────────────────────────────────────────────

  const [maxBrightness, setMaxBrightness] = useState(false);
  const prevBrightness = useRef<number | null>(null);

  const handleBrightness = useCallback(async () => {
    try {
      const { status } = await Brightness.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Allow brightness control in Settings.');
        return;
      }
      if (!maxBrightness) {
        prevBrightness.current = await Brightness.getBrightnessAsync();
        await Brightness.setBrightnessAsync(1);
        setMaxBrightness(true);
      } else {
        await Brightness.setBrightnessAsync(prevBrightness.current ?? 0.5);
        setMaxBrightness(false);
      }
    } catch {
      Alert.alert('Brightness', 'Unable to change brightness on this device.');
    }
  }, [maxBrightness]);

  // Restore brightness on unmount
  useEffect(() => {
    return () => {
      if (prevBrightness.current !== null) {
        Brightness.setBrightnessAsync(prevBrightness.current).catch(() => {});
      }
    };
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={palette.surface} />

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BrandLogo height={22} />
          <Text style={styles.headerTitle}>Student QR</Text>
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
        {/* ── Digital Pass card ─────────────────────────────────────────── */}
        <View style={styles.passCard}>

          {/* ── Student info header ─────────────────────────────────────── */}
          <View style={styles.cardHeader}>
            <View style={styles.studentRow}>
              {/* StudentAvatar with pulse dot */}
              <View style={styles.avatarWrap}>
                <StudentAvatar
                  size={56}
                  useHeadshot
                  style={{
                    borderColor: palette.surface,
                    borderWidth: 2,
                    borderRadius: 28,
                  }}
                />
                <View style={styles.pulseDotWrap}>
                  <PulseDot />
                </View>
              </View>

              {/* Name + ID */}
              <View style={styles.studentInfo}>
                <Text style={styles.studentName}>{displayName}</Text>
                <View style={styles.studentIdRow}>
                  <MaterialIcons name="badge" size={14} color={palette.textMuted} />
                  <Text style={styles.studentIdText}>{studentId}</Text>
                </View>
              </View>
            </View>

            {/* Active pill */}
            <View style={styles.activePill}>
              <View style={styles.activeDot} />
              <Text style={styles.activePillText}>Active</Text>
            </View>
          </View>

          {/* Separator */}
          <View style={styles.separator} />

          {/* ── Hostel / Room row ───────────────────────────────────────── */}
          <View style={styles.hostelRow}>
            <View style={styles.hostelCol}>
              <Text style={styles.hostelLabel}>HOSTEL</Text>
              <Text style={styles.hostelValue}>{MOCK_HOSTEL}</Text>
            </View>
            <View style={styles.hostelDivider} />
            <View style={styles.hostelCol}>
              <Text style={styles.hostelLabel}>ROOM</Text>
              <Text style={styles.hostelValue}>{MOCK_ROOM}</Text>
            </View>
          </View>

          {/* ── QR code area ────────────────────────────────────────────── */}
          <View style={styles.qrSection}>
            {/* QR frame with blue corner brackets */}
            <View style={styles.qrFrame}>
              <CornerBrackets size={220} />
              <View style={styles.qrInner}>
                <QRCode
                  value={qrValue}
                  size={200}
                  color="#000000"
                  backgroundColor="#ffffff"
                  quietZone={8}
                />
              </View>
            </View>

            {/* Helper text */}
            <Text style={styles.helperText}>
              Present this QR code to an authorized security guard or scanner.
            </Text>

            {/* Auto-refresh countdown pill */}
            <View style={styles.countdownPill}>
              <Animated.View style={{ transform: [{ rotate: spinInterpolation }] }}>
                <MaterialIcons name="autorenew" size={14} color={BLUE} />
              </Animated.View>
              <Text style={styles.countdownText}>
                Auto-refreshes in {countdown}s
              </Text>
            </View>
          </View>

          {/* Gradient footer stripe */}
          <View style={styles.cardFooterStripe} />
        </View>

        {/* ── Action buttons ────────────────────────────────────────────── */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.actionBtn, maxBrightness && styles.actionBtnActive]}
            onPress={handleBrightness}
            activeOpacity={0.75}
          >
            <MaterialIcons
              name={maxBrightness ? 'brightness-high' : 'brightness-5'}
              size={24}
              color={BLUE}
            />
            <Text style={styles.actionBtnLabel}>
              {maxBrightness ? 'Normal Mode' : 'Max Brightness'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionBtn}
            onPress={triggerRefresh}
            activeOpacity={0.75}
          >
            <MaterialIcons name="qr-code-scanner" size={24} color={BLUE} />
            <Text style={styles.actionBtnLabel}>Manual Refresh</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: spacing.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles factory ──────────────────────────────────────────────────────────

const SIDE = 20;

function makeStyles(palette: AppPalette, iconBg: string, iconFg: string) {
  return StyleSheet.create({
    // ── Layout ──────────────────────────────────────────────────────────────
    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },
    scroll: { flex: 1 },
    scrollContent: {
      paddingTop: spacing.md,
      paddingHorizontal: SIDE,
      alignItems: 'center',
    },

    // ── Header ──────────────────────────────────────────────────────────────
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
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: palette.textPrimary,
      fontFamily: 'Inter_600SemiBold',
    },

    // ── Pass card ────────────────────────────────────────────────────────────
    passCard: {
      width: '100%',
      backgroundColor: palette.surface,
      borderRadius: radius.xxl,
      overflow: 'hidden',
      shadowColor: SHADOW_NAVY,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.06,
      shadowRadius: 32,
      elevation: 6,
      marginBottom: spacing.md + 4,
    },

    // ── Card header (student info) ────────────────────────────────────────────
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
      paddingBottom: spacing.md,
    },
    studentRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    avatarWrap: { position: 'relative' },
    pulseDotWrap: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      backgroundColor: palette.surface,
      borderRadius: 10,
      padding: 2,
    },
    studentInfo: { flex: 1 },
    studentName: {
      fontSize: 16,
      fontWeight: '600',
      color: palette.textPrimary,
      fontFamily: 'Inter_600SemiBold',
    },
    studentIdRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: 2,
    },
    studentIdText: {
      fontSize: 13,
      color: palette.textMuted,
      fontFamily: 'Inter_400Regular',
    },

    // ── Active pill ───────────────────────────────────────────────────────────
    activePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: `${GREEN}1A`,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.full,
    },
    activeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: GREEN,
    },
    activePillText: {
      fontSize: 13,
      fontWeight: '500',
      color: GREEN_DARK,
      fontFamily: 'Inter_500Medium',
    },

    // ── Separator ─────────────────────────────────────────────────────────────
    separator: {
      height: 1,
      backgroundColor: `${palette.border}80`,
      marginHorizontal: 0,
    },

    // ── Hostel / Room row ─────────────────────────────────────────────────────
    hostelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: 12,
      backgroundColor: `${palette.surfaceVariant}4D`,
    },
    hostelCol: { flexDirection: 'column', gap: 2 },
    hostelLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: palette.textMuted,
      letterSpacing: 1.0,
      textTransform: 'uppercase',
      fontFamily: 'Inter_600SemiBold',
    },
    hostelValue: {
      fontSize: 14,
      fontWeight: '500',
      color: palette.textPrimary,
      fontFamily: 'Inter_500Medium',
    },
    hostelDivider: {
      width: 1,
      height: 32,
      backgroundColor: `${palette.border}99`,
      marginHorizontal: spacing.lg,
    },

    // ── QR section ────────────────────────────────────────────────────────────
    qrSection: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xl,
      paddingBottom: spacing.lg,
      alignItems: 'center',
      backgroundColor: palette.surface,
    },
    qrFrame: {
      position: 'relative',
      padding: 10,
      backgroundColor: palette.surface,
      borderRadius: radius.lg,
      shadowColor: palette.border,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1,
      shadowRadius: 0,
      elevation: 0,
      borderWidth: 1,
      borderColor: palette.border,
    },
    qrInner: {
      backgroundColor: '#ffffff',
      padding: 8,
      borderRadius: radius.md,
    },
    helperText: {
      fontSize: 13,
      color: palette.textMuted,
      textAlign: 'center',
      maxWidth: 280,
      marginTop: spacing.xl,
      fontFamily: 'Inter_400Regular',
      lineHeight: 18,
    },
    countdownPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: palette.surfaceVariant,
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.full,
      marginTop: spacing.sm,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 1,
    },
    countdownText: {
      fontSize: 12,
      color: palette.textMuted,
      fontFamily: 'Inter_400Regular',
    },

    // ── Gradient footer stripe ────────────────────────────────────────────────
    cardFooterStripe: {
      height: 6,
      backgroundColor: BLUE,
      opacity: 0.8,
    },

    // ── Action buttons ────────────────────────────────────────────────────────
    actionsRow: {
      flexDirection: 'row',
      gap: spacing.md,
      width: '100%',
      maxWidth: 340,
      justifyContent: 'center',
    },
    actionBtn: {
      flex: 1,
      flexDirection: 'column',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: 12,
      paddingHorizontal: spacing.md,
      backgroundColor: palette.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: palette.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    actionBtnActive: {
      backgroundColor: iconBg,
      borderColor: `${BLUE}40`,
    },
    actionBtnLabel: {
      fontSize: 12,
      fontWeight: '500',
      color: palette.textPrimary,
      fontFamily: 'Inter_500Medium',
      textAlign: 'center',
    },
  });
}
