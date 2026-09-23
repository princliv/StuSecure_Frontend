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
import { guardApi, type Guard } from '@/services/api/guard.api';
import BrandLogo from '@/components/ui/BrandLogo';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export default function FacultyGuardsScreen() {
  const { palette, brand, statusBarStyle } = useTheme();
  const [items, setItems] = useState<Guard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await guardApi.getAll({ limit: 50 });
      setItems(data.guards);
      setError(null);
    } catch {
      setError('Could not load guards.');
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
        <Text style={[styles.title, { color: palette.textPrimary }]}>Guards</Text>
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
        {loading && items.length === 0 ? (
          <ActivityIndicator color={brand.blue} style={{ marginTop: spacing.xl }} />
        ) : items.length === 0 ? (
          <Text style={{ color: palette.textMuted, textAlign: 'center' }}>No guards yet.</Text>
        ) : (
          items.map((item) => (
            <View
              key={item.id}
              style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
            >
              <Text style={[styles.name, { color: palette.textPrimary }]}>{item.name}</Text>
              <Text style={[styles.meta, { color: palette.textMuted }]}>{item.employeeId}</Text>
              <Text style={[styles.meta, { color: palette.textMuted }]}>
                {item.hostelName ?? 'Unassigned hostel'}
                {item.shift ? ` · ${item.shift}` : ''}
              </Text>
              <Text style={[styles.meta, { color: palette.textMuted }]}>{item.email}</Text>
            </View>
          ))
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
  card: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  name: { fontSize: 16, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  meta: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
});
