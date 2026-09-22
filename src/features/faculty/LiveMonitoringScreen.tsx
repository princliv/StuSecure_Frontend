/**
 * LiveMonitoringScreen — Faculty view.
 *
 * Sections (top → bottom):
 *   1. Sticky header   – BrandLogo + "Faculty Monitoring" | StudentAvatar (FA initials)
 *   2. Status cards    – 2-up grid: Students Inside (live) / Students Outside
 *   3. Emergency alert – pending-alerts banner
 *   4. Block filters   – horizontal chip scroll + search bar with filter icon
 *   5. Live Movement   – timeline feed with entry / exit / alert items
 *   6. Emergency FAB   – fixed bottom-right button
 *
 * Full dark-mode support via useTheme().
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@/hooks/useTheme';
import { brand } from '@/theme/colors';
import type { AppPalette } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import BrandLogo from '@/components/ui/BrandLogo';
import StudentAvatar from '@/components/ui/StudentAvatar';

// ─── Constants ───────────────────────────────────────────────────────────────

const SIDE = 20;

// ─── Mock data ───────────────────────────────────────────────────────────────

const MOCK_INSIDE = 420;
const MOCK_OUTSIDE = 80;
const MOCK_ALERTS_COUNT = 5;
const MOCK_ALERT_SUMMARY = '2 Curfew Violations, 3 Suspicious Activity.';

const BLOCKS = ['All Blocks', 'Hostel Block A', 'Hostel Block B', 'Hostel Block C'];

type MovementType = 'check-in' | 'check-out' | 'late-entry';

interface MovementItem {
  id: string;
  type: MovementType;
  name: string;
  rollNo: string;
  time: string;
  gate: string;
  badge?: string;
}

const MOCK_FEED: MovementItem[] = [
  {
    id: '1',
    type: 'check-in',
    name: 'Rahul Sharma',
    rollNo: '21BCE045',
    time: 'Just now',
    gate: 'Main Gate',
  },
  {
    id: '2',
    type: 'check-out',
    name: 'Priya Patel',
    rollNo: '22BME112',
    time: '2m ago',
    gate: 'North Gate',
  },
  {
    id: '3',
    type: 'late-entry',
    name: 'Arjun Singh',
    rollNo: '20BEE089',
    time: '15m ago',
    gate: 'Hostel Block C',
    badge: 'Late Entry',
  },
  {
    id: '4',
    type: 'check-in',
    name: 'Sneha Reddy',
    rollNo: '23BCS201',
    time: '22m ago',
    gate: 'East Gate',
  },
  {
    id: '5',
    type: 'check-out',
    name: 'Kiran Mehta',
    rollNo: '21BME077',
    time: '31m ago',
    gate: 'Main Gate',
  },
];

// ─── Pulsing "Live" dot ───────────────────────────────────────────────────────

function PulseDot() {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;
  const { palette } = useTheme();

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(scale, { toValue: 1.9, duration: 750, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0, duration: 750, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.7, duration: 0, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scale, opacity]);

  return (
    <View style={pulseDotStyles.wrap}>
      <Animated.View style={[pulseDotStyles.ring, { transform: [{ scale }], opacity, backgroundColor: brand.blue }]} />
      <View style={[pulseDotStyles.core, { backgroundColor: brand.blue }]} />
    </View>
  );
}

const pulseDotStyles = StyleSheet.create({
  wrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center' },
  ring: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  core: { width: 8, height: 8, borderRadius: 4 },
});

// ─── FeedItem ────────────────────────────────────────────────────────────────

function FeedItem({
  item,
  isLast,
}: {
  item: MovementItem;
  isLast: boolean;
}) {
  const { palette } = useTheme();
  const isIn = item.type === 'check-in';
  const isLate = item.type === 'late-entry';

  const iconBg = isIn
    ? `${brand.blue}1A`
    : isLate
    ? 'rgba(186,26,26,0.18)'
    : 'rgba(186,26,26,0.08)';
  const iconColor = isIn ? brand.blue : palette.error;
  const iconName: React.ComponentProps<typeof MaterialIcons>['name'] = isIn
    ? 'login'
    : isLate
    ? 'timer-off'
    : 'logout';
  const gateIcon: React.ComponentProps<typeof MaterialIcons>['name'] = isIn
    ? 'door-front'
    : isLate
    ? 'door-front'
    : 'directions-bus';
  const action = isIn ? 'Checked In' : 'Checked Out';

  return (
    <View style={[feedStyles.row, isLate && { backgroundColor: 'rgba(186,26,26,0.04)' }]}>
      <View style={[feedStyles.iconWrap, { backgroundColor: iconBg }]}>
        <MaterialIcons name={iconName} size={20} color={iconColor} />
      </View>

      <View
        style={[
          feedStyles.content,
          !isLast && feedStyles.contentBorder,
          { borderBottomColor: `${palette.border}59` },
        ]}
      >
        <View style={feedStyles.topRow}>
          <View style={feedStyles.nameRow}>
            <Text style={[feedStyles.name, { color: palette.textPrimary }]} numberOfLines={1}>
              {item.name} ({item.rollNo})
            </Text>
            {item.badge && (
              <View style={[feedStyles.badge, { backgroundColor: palette.error }]}>
                <Text style={feedStyles.badgeText}>{item.badge.toUpperCase()}</Text>
              </View>
            )}
          </View>
          <Text style={[feedStyles.time, { color: palette.textMuted }]}>{item.time}</Text>
        </View>

        <View style={feedStyles.gateRow}>
          <MaterialIcons name={gateIcon} size={14} color={palette.textMuted} />
          <Text style={[feedStyles.gateText, { color: palette.textMuted }]} numberOfLines={1}>
            {action} • {item.gate}
          </Text>
        </View>
      </View>
    </View>
  );
}

const feedStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    zIndex: 10,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  content: {
    flex: 1,
    marginLeft: spacing.md,
    paddingBottom: spacing.md,
  },
  contentBorder: {
    borderBottomWidth: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.xs,
    gap: spacing.sm,
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, flex: 1 },
  name: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: 'Inter_500Medium',
    flexShrink: 1,
  },
  badge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: radius.xs,
  },
  badgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.4,
    fontFamily: 'Inter_700Bold',
  },
  time: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    flexShrink: 0,
  },
  gateRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  gateText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
  },
});

// ─── Main screen ─────────────────────────────────────────────────────────────

export default function LiveMonitoringScreen() {
  const { palette, statusBarStyle } = useTheme();
  const styles = makeStyles(palette);
  const [selectedBlock, setSelectedBlock] = useState('All Blocks');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredFeed = MOCK_FEED.filter((item) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      item.name.toLowerCase().includes(q) ||
      item.rollNo.toLowerCase().includes(q)
    );
  });

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={palette.surface} />

      {/* ── Sticky header ──────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <BrandLogo height={22} />
          <Text style={styles.headerTitle}>Faculty Monitoring</Text>
        </View>
        {/* Faculty avatar — FA initials */}
        <StudentAvatar size={36} useHeadshot={false} initials="FA" />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Status cards (2-up grid) ───────────────────────────────────── */}
        <View style={styles.statusGrid}>
          <View style={[styles.statusCard, styles.statusCardHalf]}>
            <View style={styles.statusCardTop}>
              <MaterialIcons name="how-to-reg" size={20} color={palette.textMuted} />
              <View style={styles.livePill}>
                <PulseDot />
                <Text style={styles.livePillText}>Live</Text>
              </View>
            </View>
            <Text style={styles.statusCount}>{MOCK_INSIDE}</Text>
            <Text style={styles.statusLabel}>Students Inside</Text>
          </View>

          <View style={[styles.statusCard, styles.statusCardHalf]}>
            <View style={styles.statusCardTop}>
              <MaterialIcons name="directions-walk" size={20} color={palette.textMuted} />
              <Text style={styles.totalLabel}>Total</Text>
            </View>
            <Text style={styles.statusCount}>{MOCK_OUTSIDE}</Text>
            <Text style={styles.statusLabel}>Students Outside</Text>
          </View>
        </View>

        {/* ── Emergency alert banner ─────────────────────────────────────── */}
        <View style={styles.alertBanner}>
          <View style={styles.alertIconWrap}>
            <MaterialIcons name="warning" size={24} color={palette.error} />
          </View>
          <View style={styles.alertBody}>
            <View style={styles.alertTopRow}>
              <Text style={styles.alertTitle}>{MOCK_ALERTS_COUNT} Alerts Pending</Text>
              <Text style={styles.alertRequired}>Action Required</Text>
            </View>
            <Text style={styles.alertSummary} numberOfLines={1}>
              {MOCK_ALERT_SUMMARY}
            </Text>
            <TouchableOpacity activeOpacity={0.7} style={styles.viewAllBtn}>
              <Text style={styles.viewAllText}>View All</Text>
              <MaterialIcons name="arrow-forward" size={14} color={palette.error} />
            </TouchableOpacity>
          </View>
        </View>

        {/* ── Block filter chips ─────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScrollContent}
          style={styles.chipScroll}
        >
          {BLOCKS.map((block) => {
            const active = selectedBlock === block;
            return (
              <TouchableOpacity
                key={block}
                activeOpacity={0.75}
                onPress={() => setSelectedBlock(block)}
                style={[
                  styles.chip,
                  active ? styles.chipActive : styles.chipInactive,
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    active ? styles.chipTextActive : styles.chipTextInactive,
                  ]}
                >
                  {block}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Search bar ────────────────────────────────────────────────── */}
        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={20} color={palette.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search student name or ID..."
            placeholderTextColor={palette.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          <TouchableOpacity activeOpacity={0.7} style={styles.filterBtn}>
            <MaterialIcons name="tune" size={20} color={palette.textMuted} />
          </TouchableOpacity>
        </View>

        {/* ── Live Movement feed ────────────────────────────────────────── */}
        <View style={styles.feedSection}>
          <Text style={styles.sectionTitle}>Live Movement</Text>

          <View style={styles.feedCard}>
            <View style={styles.feedConnector} />

            {filteredFeed.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialIcons name="search-off" size={32} color={palette.textMuted} />
                <Text style={styles.emptyText}>No results found</Text>
              </View>
            ) : (
              filteredFeed.map((item, idx) => (
                <FeedItem
                  key={item.id}
                  item={item}
                  isLast={idx === filteredFeed.length - 1}
                />
              ))
            )}
          </View>
        </View>

        <View style={{ height: spacing.xxxl + spacing.xl }} />
      </ScrollView>

      {/* ── Emergency FAB ──────────────────────────────────────────────────── */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.fab}
        accessibilityLabel="Trigger Emergency"
        accessibilityRole="button"
      >
        <MaterialIcons name="emergency" size={30} color="#fff" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ─── Styles factory ──────────────────────────────────────────────────────────

function makeStyles(palette: AppPalette) {
  return StyleSheet.create({
    // ── Layout ────────────────────────────────────────────────────────────────
    safeArea: { flex: 1, backgroundColor: palette.background },
    scroll: { flex: 1 },
    scrollContent: { paddingTop: spacing.md },

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

    // ── Status cards ──────────────────────────────────────────────────────────
    statusGrid: {
      flexDirection: 'row',
      gap: spacing.md,
      paddingHorizontal: SIDE,
      marginBottom: spacing.md,
    },
    statusCard: {
      backgroundColor: palette.surface,
      borderRadius: radius.xl,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: palette.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
      justifyContent: 'space-between',
    },
    statusCardHalf: { flex: 1 },
    statusCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
    },
    livePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    livePillText: {
      fontSize: 11,
      color: palette.textMuted,
      fontFamily: 'Inter_400Regular',
    },
    totalLabel: {
      fontSize: 11,
      color: palette.textMuted,
      fontFamily: 'Inter_400Regular',
    },
    statusCount: {
      fontSize: 36,
      fontWeight: '700',
      color: palette.textPrimary,
      lineHeight: 42,
      fontFamily: 'Inter_700Bold',
    },
    statusLabel: {
      fontSize: 12,
      color: palette.textMuted,
      fontFamily: 'Inter_400Regular',
      marginTop: 2,
    },

    // ── Alert banner ──────────────────────────────────────────────────────────
    alertBanner: {
      marginHorizontal: SIDE,
      marginBottom: spacing.md,
      backgroundColor: palette.errorContainer,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: `${palette.error}22`,
      padding: spacing.md,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      shadowColor: palette.error,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
    },
    alertIconWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: `${palette.error}18`,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    alertBody: { flex: 1 },
    alertTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    alertTitle: {
      fontSize: 14,
      fontWeight: '600',
      color: palette.textPrimary,
      fontFamily: 'Inter_600SemiBold',
    },
    alertRequired: {
      fontSize: 11,
      color: palette.textMuted,
      fontFamily: 'Inter_400Regular',
    },
    alertSummary: {
      fontSize: 13,
      color: palette.textMuted,
      fontFamily: 'Inter_400Regular',
      marginBottom: spacing.xs,
    },
    viewAllBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      alignSelf: 'flex-start',
      marginTop: 2,
    },
    viewAllText: {
      fontSize: 13,
      fontWeight: '600',
      color: palette.error,
      fontFamily: 'Inter_600SemiBold',
    },

    // ── Block filter chips ────────────────────────────────────────────────────
    chipScroll: { marginBottom: spacing.sm },
    chipScrollContent: {
      paddingHorizontal: SIDE,
      gap: spacing.sm,
    },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.full,
    },
    chipActive: {
      backgroundColor: brand.blue,
      shadowColor: brand.blue,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
      elevation: 3,
    },
    chipInactive: {
      backgroundColor: palette.surfaceVariant,
      borderWidth: 1,
      borderColor: palette.border,
    },
    chipText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
    chipTextActive: { color: '#fff', fontWeight: '600' },
    chipTextInactive: { color: palette.textPrimary },

    // ── Search bar ────────────────────────────────────────────────────────────
    searchWrap: {
      marginHorizontal: SIDE,
      marginBottom: spacing.md + 4,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: palette.surfaceVariant,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: spacing.sm,
      height: 44,
    },
    searchIcon: { marginRight: spacing.xs },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: palette.textPrimary,
      fontFamily: 'Inter_400Regular',
      height: '100%',
    },
    filterBtn: {
      padding: spacing.xs,
      marginLeft: spacing.xs,
    },

    // ── Feed section ──────────────────────────────────────────────────────────
    feedSection: { paddingHorizontal: SIDE, marginBottom: spacing.md },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: palette.textPrimary,
      fontFamily: 'Inter_600SemiBold',
      marginBottom: spacing.md,
    },
    feedCard: {
      backgroundColor: palette.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: palette.border,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 2,
      position: 'relative',
    },
    feedConnector: {
      position: 'absolute',
      left: spacing.md + 20 - 1,
      top: spacing.md + 40,
      bottom: spacing.md,
      width: 1,
      borderStyle: 'dashed',
      borderLeftWidth: 1.5,
      borderLeftColor: `${palette.border}80`,
      zIndex: 1,
    },
    emptyWrap: {
      paddingVertical: spacing.xl,
      alignItems: 'center',
      gap: spacing.sm,
    },
    emptyText: {
      fontSize: 14,
      color: palette.textMuted,
      fontFamily: 'Inter_400Regular',
    },

    // ── FAB ───────────────────────────────────────────────────────────────────
    fab: {
      position: 'absolute',
      bottom: spacing.xxl + spacing.md,
      right: SIDE,
      width: 60,
      height: 60,
      borderRadius: 30,
      backgroundColor: palette.error,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: palette.error,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 12,
      elevation: 8,
      zIndex: 40,
    },
  });
}
