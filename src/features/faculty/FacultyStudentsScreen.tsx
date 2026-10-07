import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { studentApi, type Student } from '@/services/api/student.api';
import BrandLogo from '@/components/ui/BrandLogo';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

function formatWhen(iso?: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function FacultyStudentsScreen() {
  const { palette, brand, statusBarStyle } = useTheme();
  const [items, setItems] = useState<Student[]>([]);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (q?: string) => {
    try {
      const { data } = await studentApi.getAll({ limit: 50, search: q || undefined });
      setItems(data.students);
      setError(null);
    } catch {
      setError('Could not load students.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load(search);
    }, [load, search]),
  );

  const openDetail = async (id: string) => {
    try {
      const { data } = await studentApi.getById(id);
      setSelected(data);
    } catch {
      setError('Could not load student.');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={palette.background} />
      <View style={styles.header}>
        <BrandLogo variant="icon" size={26} />
        <Text style={[styles.title, { color: palette.textPrimary }]}>Students</Text>
      </View>
      <View style={[styles.searchWrap, { backgroundColor: palette.surface, borderColor: palette.border }]}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Search name, email, or ID"
          placeholderTextColor={palette.textMuted}
          style={[styles.search, { color: palette.textPrimary }]}
        />
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void load(search)} tintColor={brand.blue} />
        }
      >
        {error ? (
          <Text style={{ color: palette.error, textAlign: 'center', marginBottom: spacing.md }}>{error}</Text>
        ) : null}
        {selected ? (
          <View style={[styles.card, { backgroundColor: palette.surface, borderColor: brand.blue }]}>
            <Text style={[styles.name, { color: palette.textPrimary }]}>{selected.name}</Text>
            <Text style={[styles.meta, { color: palette.textMuted }]}>{selected.enrollmentNo}</Text>
            <Text style={[styles.meta, { color: palette.textMuted }]}>{selected.email}</Text>
            <Text style={[styles.meta, { color: palette.textMuted }]}>
              {selected.hostelName ?? 'No hostel'}
              {selected.roomNumber ? ` · Room ${selected.roomNumber}` : ''}
            </Text>
            <Text style={[styles.meta, { color: palette.textMuted }]}>
              Last: {selected.lastMovement
                ? `${selected.lastMovement.type.replace('_', ' ')} · ${formatWhen(selected.lastMovement.timestamp)}`
                : 'No scans yet'}
            </Text>
            <TouchableOpacity onPress={() => setSelected(null)} style={{ marginTop: spacing.sm }}>
              <Text style={{ color: brand.blue, fontFamily: 'Inter_600SemiBold' }}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : null}
        {loading && items.length === 0 ? (
          <ActivityIndicator color={brand.blue} style={{ marginTop: spacing.xl }} />
        ) : items.length === 0 ? (
          <Text style={{ color: palette.textMuted, textAlign: 'center' }}>No students found.</Text>
        ) : (
          items.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => void openDetail(item.id)}
              style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
            >
              <Text style={[styles.name, { color: palette.textPrimary }]}>{item.name}</Text>
              <Text style={[styles.meta, { color: palette.textMuted }]}>
                {item.enrollmentNo}
                {item.hostelName ? ` · ${item.hostelName}` : ''}
                {item.roomNumber ? ` · ${item.roomNumber}` : ''}
              </Text>
            </TouchableOpacity>
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
  searchWrap: {
    marginHorizontal: 20,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
  },
  search: { height: 44, fontFamily: 'Inter_400Regular', fontSize: 14 },
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
