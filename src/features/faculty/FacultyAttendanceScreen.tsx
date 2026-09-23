import React, { useCallback, useMemo, useState } from 'react';
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
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { movementApi, type MovementLog } from '@/services/api/movement.api';
import MovementTimeline from '@/features/movements/MovementTimeline';
import BrandLogo from '@/components/ui/BrandLogo';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

type Range = 'today' | '7d' | 'all';

function rangeToParams(range: Range) {
  const to = new Date();
  if (range === 'all') return {};
  if (range === 'today') {
    const from = new Date(to);
    from.setHours(0, 0, 0, 0);
    return { from: from.toISOString(), to: to.toISOString() };
  }
  const from = new Date(to.getTime() - 7 * 24 * 60 * 60 * 1000);
  return { from: from.toISOString(), to: to.toISOString() };
}

export default function FacultyAttendanceScreen() {
  const { palette, brand, statusBarStyle } = useTheme();
  const [range, setRange] = useState<Range>('today');
  const [logs, setLogs] = useState<MovementLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const params = useMemo(() => rangeToParams(range), [range]);

  const load = useCallback(async () => {
    try {
      const { data } = await movementApi.getAll({ limit: 50, ...params });
      setLogs(data.logs);
      setError(null);
    } catch {
      setError('Could not load attendance.');
    } finally {
      setLoading(false);
    }
  }, [params]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={palette.background} />
      <View style={styles.header}>
        <BrandLogo height={22} />
        <Text style={[styles.title, { color: palette.textPrimary }]}>Attendance</Text>
      </View>
      <View style={styles.chips}>
        {(['today', '7d', 'all'] as Range[]).map((r) => {
          const on = range === r;
          const label = r === 'today' ? 'Today' : r === '7d' ? '7 days' : 'All';
          return (
            <TouchableOpacity
              key={r}
              onPress={() => setRange(r)}
              style={[
                styles.chip,
                {
                  backgroundColor: on ? brand.blue : palette.surface,
                  borderColor: on ? brand.blue : palette.border,
                },
              ]}
            >
              <Text style={{ color: on ? '#fff' : palette.textPrimary, fontFamily: 'Inter_600SemiBold' }}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={brand.blue} />
        }
      >
        {error ? (
          <Text style={{ color: palette.error, textAlign: 'center', marginBottom: spacing.md }}>{error}</Text>
        ) : null}
        {loading && logs.length === 0 ? (
          <ActivityIndicator color={brand.blue} style={{ marginTop: spacing.xl }} />
        ) : (
          <MovementTimeline logs={logs} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: 20,
    paddingVertical: spacing.md,
  },
  title: { fontSize: 20, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  chips: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: 20, marginBottom: spacing.md },
  chip: { borderWidth: 1, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 8 },
  content: { paddingHorizontal: 20, paddingBottom: spacing.xxl },
});
