/**
 * GuardDashboardScreen — main landing screen for security guards.
 *
 * Layout (top → bottom):
 *   1. Sticky header     – BrandLogo + "Guard Dashboard" title + initials avatar
 *   2. Active alert      – collapsible error-container banner (mock)
 *   3. Shift info row    – shift name / location + "On Duty" badge
 *   4. Primary CTA       – large "SCAN STUDENT QR" button → /(guard)/scanner
 *   5. Stats grid        – Students Inside (full-width) | Check-ins | Check-outs
 *   6. Recent scans      – timeline list with success / failure states
 *
 * Full dark-mode support via useTheme().
 */

import React, { useState } from 'react';
import {
  Pressable,
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
import { brand } from '@/theme/colors';
import type { AppPalette } from '@/theme/colors';
import { spacing } from '@/theme/spacing';
import { radius } from '@/theme/radius';
import BrandLogo from '@/components/ui/BrandLogo';
import StudentAvatar from '@/components/ui/StudentAvatar';

// ─── Mock data ─────────────────────────────────────────────────────────────────

interface RecentScan {
  id: string;
  name: string;
  studentId: string;
  time: string;
  status: 'granted' | 'denied';
  detail: string;
}

const MOCK_STATS = {
  studentsInside: 214,
  deltaThisHour: '+12 this hour',
  checkIns: 142,
  checkOuts: 89,
};

const MOCK_SHIFT = {
  name: 'Evening Shift',
  location: 'Main Gate',
};

const MOCK_RECENT_SCANS: RecentScan[] = [
  {
    id: '1',
    name: 'Alex Mercer',
    studentId: '884920',
    time: 'Just now',
    status: 'granted',
    detail: 'Entry Granted',
  },
  {
    id: '2',
    name: 'Sarah Jenkins',
    studentId: '902113',
    time: '2m ago',
    status: 'granted',
    detail: 'Entry Granted',
  },
  {
    id: '3',
    name: 'Unknown ID',
    studentId: '—',
    time: '15m ago',
    status: 'denied',
    detail: 'Scan Failed • Invalid QR Code',
  },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function AlertBanner({ onDismiss }: { onDismiss: () => void }) {
  const { palette } = useTheme();
  return (
    <View style={[alertBannerStyles.container, { backgroundColor: palette.errorContainer }]}>
      <MaterialIcons name="warning" size={22} color={palette.error} style={alertBannerStyles.icon} />
      <View style={alertBannerStyles.body}>
        <Text style={[alertBannerStyles.title, { color: palette.onErrorContainer }]}>
          Campus Alert: Library Area
        </Text>
        <Text style={[alertBannerStyles.message, { color: palette.onErrorContainer }]}>
          Unauthorized access reported near the north entrance. Investigate immediately.
        </Text>
      </View>
      <TouchableOpacity
        onPress={onDismiss}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        activeOpacity={0.7}
      >
        <MaterialIcons name="close" size={20} color={palette.error} />
      </TouchableOpacity>
    </View>
  );
}

const alertBannerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.xl,
    shadowColor: '#ba1a1a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
    elevation: 2,
  },
  icon: { marginTop: 1, flexShrink: 0 },
  body: { flex: 1 },
  title: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 2,
  },
  message: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    lineHeight: 18,
    opacity: 0.9,
  },
});

function ShiftRow() {
  const { palette } = useTheme();
  return (
    <View style={[shiftRowStyles.row]}>
      <View>
        <Text style={[shiftRowStyles.shiftName, { color: palette.textPrimary }]}>
          {MOCK_SHIFT.name}
        </Text>
        <View style={shiftRowStyles.locationRow}>
          <MaterialIcons name="location-on" size={14} color={palette.textMuted} />
          <Text style={[shiftRowStyles.location, { color: palette.textMuted }]}>
            {MOCK_SHIFT.location}
          </Text>
        </View>
      </View>
      <View style={[shiftRowStyles.badge, { backgroundColor: brand.navy }]}>
        <View style={shiftRowStyles.dot} />
        <Text style={shiftRowStyles.badgeLabel}>On Duty</Text>
      </View>
    </View>
  );
}

const shiftRowStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  shiftName: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 4,
  },
  location: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
  },
  badgeLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#b6c7e8',
    fontFamily: 'Inter_500Medium',
  },
});

function ScanButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [
        scanBtnStyles.btn,
        { backgroundColor: brand.blue },
        pressed && scanBtnStyles.btnPressed,
      ]}
      onPress={onPress}
      accessibilityLabel="Open QR scanner"
      accessibilityRole="button"
    >
      <View style={scanBtnStyles.iconCircle}>
        <MaterialIcons name="qr-code-scanner" size={48} color="#fff" />
      </View>
      <View style={scanBtnStyles.textGroup}>
        <Text style={scanBtnStyles.title}>SCAN STUDENT QR</Text>
        <Text style={scanBtnStyles.subtitle}>Tap to open scanner</Text>
      </View>
    </Pressable>
  );
}

const scanBtnStyles = StyleSheet.create({
  btn: {
    borderRadius: radius.xxl,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    gap: spacing.md,
    shadowColor: brand.blue,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 10,
  },
  btnPressed: {
    transform: [{ scale: 0.98 }],
    shadowOpacity: 0.18,
  },
  iconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textGroup: { alignItems: 'center' },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.8,
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    fontFamily: 'Inter_400Regular',
    marginTop: 2,
  },
});

function StatsGrid() {
  const { palette } = useTheme();
  return (
    <View style={statsStyles.grid}>
      {/* Hero stat — Students Inside */}
      <View style={[statsStyles.card, statsStyles.cardHero, { backgroundColor: palette.surfaceVariant }]}>
        <View style={statsStyles.heroLeft}>
          <Text style={[statsStyles.label, { color: palette.textMuted }]}>STUDENTS INSIDE</Text>
          <View style={statsStyles.heroValueRow}>
            <Text style={[statsStyles.heroNumber, { color: brand.navy }]}>
              {MOCK_STATS.studentsInside}
            </Text>
            <Text style={[statsStyles.heroDelta, { color: brand.blue }]}>
              {MOCK_STATS.deltaThisHour}
            </Text>
          </View>
        </View>
        <View style={[statsStyles.heroIcon, { backgroundColor: `${brand.blue}12` }]}>
          <MaterialIcons name="groups" size={28} color={brand.blue} />
        </View>
      </View>

      {/* Check-ins */}
      <View style={[statsStyles.card, statsStyles.cardHalf, { backgroundColor: palette.surfaceVariant }]}>
        <MaterialIcons
          name="login"
          size={20}
          color={`${brand.blue}80`}
          style={statsStyles.halfIcon}
        />
        <Text style={[statsStyles.label, { color: palette.textMuted }]}>Check-ins</Text>
        <Text style={[statsStyles.halfNumber, { color: brand.navy }]}>{MOCK_STATS.checkIns}</Text>
      </View>

      {/* Check-outs */}
      <View style={[statsStyles.card, statsStyles.cardHalf, { backgroundColor: palette.surfaceVariant }]}>
        <MaterialIcons
          name="logout"
          size={20}
          color={`${palette.textMuted}99`}
          style={statsStyles.halfIcon}
        />
        <Text style={[statsStyles.label, { color: palette.textMuted }]}>Check-outs</Text>
        <Text style={[statsStyles.halfNumber, { color: brand.navy }]}>{MOCK_STATS.checkOuts}</Text>
      </View>
    </View>
  );
}

const statsStyles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.xs,
  },
  card: {
    borderRadius: radius.xxl,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  cardHero: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.lg - 4,
    paddingHorizontal: spacing.md + 4,
  },
  cardHalf: {
    flex: 1,
    minHeight: 112,
    justifyContent: 'flex-end',
    position: 'relative',
  },
  heroLeft: { gap: 4 },
  heroValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
    marginTop: 4,
  },
  heroNumber: {
    fontSize: 40,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    lineHeight: 44,
  },
  heroDelta: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  heroIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  halfIcon: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
  },
  label: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  halfNumber: {
    fontSize: 28,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginTop: 6,
  },
});

function ScanItem({ scan, isLast }: { scan: RecentScan; isLast: boolean }) {
  const { palette } = useTheme();
  const isGranted = scan.status === 'granted';

  return (
    <View style={scanItemStyles.row}>
      <View
        style={[
          scanItemStyles.iconWrap,
          isGranted ? scanItemStyles.iconWrapSuccess : { backgroundColor: palette.errorContainer },
        ]}
      >
        <MaterialIcons
          name={isGranted ? 'check-circle' : 'cancel'}
          size={24}
          color={isGranted ? '#137333' : palette.error}
        />
      </View>

      <View
        style={[
          scanItemStyles.content,
          { backgroundColor: palette.surface },
          !isGranted && { backgroundColor: `${palette.errorContainer}55` },
          isLast && scanItemStyles.contentLast,
        ]}
      >
        <View style={scanItemStyles.topRow}>
          <Text style={[scanItemStyles.name, { color: palette.textPrimary }]}>{scan.name}</Text>
          <Text style={[scanItemStyles.time, { color: palette.textMuted }]}>{scan.time}</Text>
        </View>
        <Text
          style={[
            scanItemStyles.detail,
            { color: palette.textMuted },
            !isGranted && { color: palette.error },
          ]}
        >
          {scan.studentId !== '—' ? `ID: ${scan.studentId} • ` : ''}
          {scan.detail}
        </Text>
      </View>
    </View>
  );
}

const scanItemStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  iconWrapSuccess: {
    backgroundColor: '#E6F4EA',
  },
  content: {
    flex: 1,
    borderRadius: radius.xl,
    padding: spacing.md - 4,
    paddingHorizontal: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  contentLast: {
    marginBottom: 0,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 2,
  },
  name: {
    fontSize: 13,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
  },
  time: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
  detail: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});

function RecentScans() {
  const { palette } = useTheme();
  return (
    <View style={recentScansStyles.section}>
      <View style={recentScansStyles.header}>
        <Text style={[recentScansStyles.heading, { color: palette.textPrimary }]}>Recent Scans</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Text style={[recentScansStyles.viewAll, { color: brand.blue }]}>View All</Text>
        </TouchableOpacity>
      </View>

      <View style={recentScansStyles.list}>
        <View style={[recentScansStyles.timelineBar, { borderLeftColor: palette.surfaceVariant }]} />
        {MOCK_RECENT_SCANS.map((scan, i) => (
          <ScanItem
            key={scan.id}
            scan={scan}
            isLast={i === MOCK_RECENT_SCANS.length - 1}
          />
        ))}
      </View>
    </View>
  );
}

const recentScansStyles = StyleSheet.create({
  section: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  heading: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  viewAll: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
  },
  list: {
    position: 'relative',
  },
  timelineBar: {
    position: 'absolute',
    left: 23,
    top: 24,
    bottom: 24,
    width: 2,
    borderLeftWidth: 2,
    borderStyle: 'dashed',
    zIndex: 0,
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function GuardDashboardScreen() {
  const router = useRouter();
  const { palette, statusBarStyle } = useTheme();
  const styles = makeStyles(palette);
  const [alertVisible, setAlertVisible] = useState(true);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={palette.background} />

      {/* ── Sticky header ─────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BrandLogo height={22} />
          <Text style={styles.headerTitle}>Guard Dashboard</Text>
        </View>
        {/* Initials avatar OK for guard role */}
        <StudentAvatar size={32} useHeadshot={false} initials="GD" />
      </View>

      {/* ── Scrollable body ───────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {alertVisible && (
          <AlertBanner onDismiss={() => setAlertVisible(false)} />
        )}

        <ShiftRow />

        <ScanButton onPress={() => router.push('/(guard)/scanner')} />

        <StatsGrid />

        <RecentScans />
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Root styles factory ──────────────────────────────────────────────────────

function makeStyles(palette: AppPalette) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: palette.background,
    },
    header: {
      height: 60,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      backgroundColor: palette.surface,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: palette.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    headerTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: palette.textPrimary,
      fontFamily: 'Inter_600SemiBold',
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
      gap: spacing.md,
    },
  });
}
