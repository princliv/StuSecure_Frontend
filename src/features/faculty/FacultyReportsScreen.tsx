import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { reportsApi, type ReportSummary } from '@/services/api/reports.api';
import BrandLogo from '@/components/ui/BrandLogo';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export default function FacultyReportsScreen() {
  const { palette, brand, statusBarStyle } = useTheme();
  const [data, setData] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data: summary } = await reportsApi.summary();
      setData(summary);
      setError(null);
    } catch {
      setError('Could not load report.');
    } finally {
      setLoading(false);
    }
  }, []);

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
        <Text style={[styles.title, { color: palette.textPrimary }]}>Reports</Text>
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
        {loading && !data ? (
          <ActivityIndicator color={brand.blue} style={{ marginTop: spacing.xl }} />
        ) : data ? (
          <>
            <Text style={[styles.range, { color: palette.textMuted }]}>Last 7 days</Text>
            <View style={styles.grid}>
              <Stat palette={palette} label="Check-ins" value={data.checkIns} />
              <Stat palette={palette} label="Check-outs" value={data.checkOuts} />
              <Stat palette={palette} label="Active students" value={data.uniqueStudents} />
              <Stat palette={palette} label="Inside now" value={data.insideCount} />
            </View>
            {data.byDay.length === 0 ? (
              <Text style={{ color: palette.textMuted, textAlign: 'center' }}>No movement in this period.</Text>
            ) : (
              data.byDay.map((day) => (
                <View
                  key={day.date}
                  style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
                >
                  <Text style={[styles.name, { color: palette.textPrimary }]}>{day.date}</Text>
                  <Text style={[styles.meta, { color: palette.textMuted }]}>
                    In {day.checkIns} · Out {day.checkOuts}
                  </Text>
                </View>
              ))
            )}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({
  palette,
  label,
  value,
}: {
  palette: { surface: string; border: string; textPrimary: string; textMuted: string };
  label: string;
  value: number;
}) {
  return (
    <View style={[styles.stat, { backgroundColor: palette.surface, borderColor: palette.border }]}>
      <Text style={[styles.statValue, { color: palette.textPrimary }]}>{value}</Text>
      <Text style={[styles.meta, { color: palette.textMuted }]}>{label}</Text>
    </View>
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
  content: { paddingHorizontal: 20, paddingBottom: spacing.xxl },
  range: { fontSize: 13, fontFamily: 'Inter_400Regular', marginBottom: spacing.md },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.lg },
  stat: {
    width: '48%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  statValue: { fontSize: 28, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  card: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  name: { fontSize: 16, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  meta: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
});
