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
import { movementApi, type MovementLog } from '@/services/api/movement.api';
import BrandLogo from '@/components/ui/BrandLogo';
import MovementTimeline from '@/features/movements/MovementTimeline';
import { spacing } from '@/theme/spacing';

export default function MovementActivityScreen({
  title,
  source,
}: {
  title: string;
  source: 'me' | 'all';
}) {
  const { palette, brand, statusBarStyle } = useTheme();
  const [logs, setLogs] = useState<MovementLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } =
        source === 'me'
          ? await movementApi.getMyHistory({ limit: 50 })
          : await movementApi.getAll({ limit: 50 });
      setLogs(data.logs);
      setError(null);
    } catch {
      setError('Could not load activity.');
    } finally {
      setLoading(false);
    }
  }, [source]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={palette.background} />
      <View style={styles.header}>
        <BrandLogo variant="icon" size={26} />
        <Text style={[styles.title, { color: palette.textPrimary }]}>{title}</Text>
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={brand.blue} />
        }
      >
        {error ? (
          <Text style={{ color: palette.error, textAlign: 'center' }}>{error}</Text>
        ) : loading && logs.length === 0 ? (
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
  content: { paddingHorizontal: 20, paddingBottom: spacing.xxl },
});
