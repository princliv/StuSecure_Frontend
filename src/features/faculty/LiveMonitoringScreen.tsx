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

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { brand } from '@/theme/colors';
import type { AppPalette } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import BrandLogo from '@/components/ui/BrandLogo';
import StudentAvatar from '@/components/ui/StudentAvatar';
import { monitoringApi } from '@/services/api/monitoring.api';
import type { MovementLog } from '@/services/api/movement.api';
import type { Emergency } from '@/services/api/emergency.api';
import { connectSocket, getSocket } from '@/services/socket/socket';
import { auth } from '@/services/firebase/auth';
import { useAuthStore } from '@/store/auth.store';

const SIDE = 20;

function initialsFromName(name?: string | null) {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'FA';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.max(0, Math.floor(diff / 60_000));
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

type FeedKind = 'check-in' | 'check-out' | 'emergency';

interface MovementItem {
  id: string;
  type: FeedKind;
  name: string;
  rollNo: string;
  time: string;
  gate: string;
  hostelName: string | null;
  badge?: string;
}

function logToItem(log: MovementLog): MovementItem {
  const isIn = log.type === 'CHECK_IN';
  return {
    id: log.id,
    type: isIn ? 'check-in' : 'check-out',
    name: log.student.name,
    rollNo: log.student.enrollmentNo,
    time: relativeTime(log.timestamp),
    gate: log.location ?? log.student.hostelName ?? 'Gate',
    hostelName: log.student.hostelName,
  };
}

function emergencyToItem(row: Emergency): MovementItem {
  return {
    id: `sos-${row.id}`,
    type: 'emergency',
    name: row.reportedBy.name,
    rollNo: row.reportedBy.enrollmentNo,
    time: relativeTime(row.createdAt),
    gate: row.location ?? row.reportedBy.hostelName ?? 'Campus',
    hostelName: row.reportedBy.hostelName,
    badge: row.status === 'ACTIVE' ? 'SOS' : row.status,
  };
}

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
  const isLate = item.type === 'emergency';

  const iconBg = isIn
    ? `${brand.blue}1A`
    : isLate
    ? 'rgba(186,26,26,0.18)'
    : 'rgba(186,26,26,0.08)';
  const iconColor = isIn ? brand.blue : palette.error;
  const iconName: React.ComponentProps<typeof MaterialIcons>['name'] = isIn
    ? 'login'
    : isLate
    ? 'warning'
    : 'logout';
  const gateIcon: React.ComponentProps<typeof MaterialIcons>['name'] = isIn
    ? 'door-front'
    : isLate
    ? 'emergency'
    : 'directions-bus';
  const action = isIn ? 'Checked In' : isLate ? 'SOS' : 'Checked Out';

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
  const router = useRouter();
  const profile = useAuthStore((s) => s.profile);
  const orgId = useAuthStore((s) => s.activeOrganizationId ?? s.memberships[0]?.organizationId);

  const [selectedBlock, setSelectedBlock] = useState('All Blocks');
  const [searchQuery, setSearchQuery] = useState('');
  const [blocks, setBlocks] = useState<string[]>(['All Blocks']);
  const [inside, setInside] = useState(0);
  const [outside, setOutside] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [alertSummary, setAlertSummary] = useState('');
  const [feed, setFeed] = useState<MovementItem[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const { data } = await monitoringApi.snapshot();
      setInside(data.insideCount);
      setOutside(data.outsideCount);
      setAlertCount(data.openEmergencyCount);
      setAlertSummary(
        data.alertSummary
          ? `${data.openEmergencyCount} open · ${data.alertSummary}`
          : 'No open emergencies.',
      );
      setBlocks(['All Blocks', ...data.hostels.map((h) => h.name)]);
      setFeed(data.movements.map(logToItem));
    } catch {
      setAlertSummary('Could not load live data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
      let socket: ReturnType<typeof getSocket> | null = null;
      const user = auth.currentUser;
      (async () => {
        if (!user || !orgId) return;
        const token = await user.getIdToken();
        socket = connectSocket(token, orgId);
        socket.on('movement:created', (row: MovementLog) => {
          setFeed((prev) => {
            const next = [logToItem(row), ...prev.filter((i) => i.id !== row.id)];
            return next.slice(0, 50);
          });
          setInside((n) => Math.max(0, n + (row.type === 'CHECK_IN' ? 1 : -1)));
          setOutside((n) => Math.max(0, n + (row.type === 'CHECK_OUT' ? 1 : -1)));
        });
        socket.on('emergency:created', (row: Emergency) => {
          setFeed((prev) => [emergencyToItem(row), ...prev].slice(0, 50));
          setAlertCount((n) => n + 1);
          setAlertSummary((s) => `${row.reportedBy.name}${s ? ` · ${s}` : ''}`);
        });
        socket.on('emergency:updated', (row: Emergency) => {
          const open = row.status === 'ACTIVE' || row.status === 'ACKNOWLEDGED';
          setFeed((prev) => {
            const mapped = emergencyToItem(row);
            const rest = prev.filter((i) => i.id !== mapped.id);
            return open ? [mapped, ...rest] : rest;
          });
          if (!open) {
            setAlertCount((n) => Math.max(0, n - 1));
          }
        });
      })();

      return () => {
        socket?.off('movement:created');
        socket?.off('emergency:created');
        socket?.off('emergency:updated');
      };
    }, [load, orgId]),
  );

  const filteredFeed = feed.filter((item) => {
    if (selectedBlock !== 'All Blocks' && item.hostelName !== selectedBlock) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return item.name.toLowerCase().includes(q) || item.rollNo.toLowerCase().includes(q);
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
        <StudentAvatar size={36} useHeadshot={false} initials={initialsFromName(profile?.displayName)} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={brand.blue} />
        }
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
            <Text style={styles.statusCount}>{inside}</Text>
            <Text style={styles.statusLabel}>Students Inside</Text>
          </View>

          <View style={[styles.statusCard, styles.statusCardHalf]}>
            <View style={styles.statusCardTop}>
              <MaterialIcons name="directions-walk" size={20} color={palette.textMuted} />
              <Text style={styles.totalLabel}>Outside</Text>
            </View>
            <Text style={styles.statusCount}>{outside}</Text>
            <Text style={styles.statusLabel}>Students Outside</Text>
          </View>
        </View>

        {/* ── Emergency alert banner ─────────────────────────────────────── */}
        {alertCount > 0 ? (
          <View style={styles.alertBanner}>
            <View style={styles.alertIconWrap}>
              <MaterialIcons name="warning" size={24} color={palette.error} />
            </View>
            <View style={styles.alertBody}>
              <View style={styles.alertTopRow}>
                <Text style={styles.alertTitle}>{alertCount} Alerts Pending</Text>
                <Text style={styles.alertRequired}>Action Required</Text>
              </View>
              <Text style={styles.alertSummary} numberOfLines={1}>
                {alertSummary}
              </Text>
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.viewAllBtn}
                onPress={() => router.push('/(faculty)/emergency')}
              >
                <Text style={styles.viewAllText}>View All</Text>
                <MaterialIcons name="arrow-forward" size={14} color={palette.error} />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {/* ── Block filter chips ─────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipScrollContent}
          style={styles.chipScroll}
        >
          {blocks.map((block) => {
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
        </View>

        {/* ── Live Movement feed ────────────────────────────────────────── */}
        <View style={styles.feedSection}>
          <Text style={styles.sectionTitle}>Live Movement</Text>

          <View style={styles.feedCard}>
            <View style={styles.feedConnector} />

            {filteredFeed.length === 0 ? (
              <View style={styles.emptyWrap}>
                <MaterialIcons name="search-off" size={32} color={palette.textMuted} />
                <Text style={styles.emptyText}>
                  {loading ? 'Loading…' : 'No live activity yet'}
                </Text>
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
        accessibilityLabel="Open emergencies"
        accessibilityRole="button"
        onPress={() => router.push('/(faculty)/emergency')}
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
