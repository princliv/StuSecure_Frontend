import React, { useCallback, useState } from 'react';
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
import { notificationApi, type AppNotification } from '@/services/api/notification.api';
import BrandLogo from '@/components/ui/BrandLogo';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function NotificationInboxScreen({ title = 'Alerts' }: { title?: string }) {
  const { palette, brand, statusBarStyle } = useTheme();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await notificationApi.list({ limit: 50 });
      setItems(data.notifications);
      setError(null);
    } catch {
      setError('Could not load notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const onRead = async (item: AppNotification) => {
    if (item.isRead) return;
    try {
      const { data } = await notificationApi.markRead(item.id);
      setItems((prev) => prev.map((n) => (n.id === item.id ? data : n)));
    } catch {
      setError('Could not mark as read.');
    }
  };

  const onReadAll = async () => {
    try {
      await notificationApi.markAllRead();
      setItems((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: n.readAt ?? new Date().toISOString() })),
      );
    } catch {
      setError('Could not mark all as read.');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={palette.background} />
      <View style={styles.header}>
        <BrandLogo height={22} />
        <Text style={[styles.title, { color: palette.textPrimary, flex: 1 }]}>{title}</Text>
        {items.some((n) => !n.isRead) ? (
          <TouchableOpacity onPress={() => void onReadAll()}>
            <Text style={[styles.readAll, { color: brand.blue }]}>Read all</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={brand.blue} />
        }
      >
        {error ? (
          <Text style={{ color: palette.error, textAlign: 'center', marginBottom: spacing.md }}>
            {error}
          </Text>
        ) : null}
        {loading && items.length === 0 ? (
          <ActivityIndicator color={brand.blue} style={{ marginTop: spacing.xl }} />
        ) : items.length === 0 ? (
          <Text style={{ color: palette.textMuted, textAlign: 'center' }}>No notifications yet.</Text>
        ) : (
          items.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => void onRead(item)}
              style={[
                styles.card,
                {
                  backgroundColor: palette.surface,
                  borderColor: item.isRead ? palette.border : brand.blue,
                },
              ]}
            >
              <View style={styles.cardTop}>
                <Text style={[styles.name, { color: palette.textPrimary }]}>{item.title}</Text>
                {!item.isRead ? (
                  <View style={[styles.dot, { backgroundColor: brand.blue }]} />
                ) : null}
              </View>
              <Text style={[styles.meta, { color: palette.textPrimary }]}>{item.body}</Text>
              <Text style={[styles.meta, { color: palette.textMuted }]}>
                {item.type.replace('_', ' ')} · {formatWhen(item.createdAt)}
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
  readAll: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  content: { paddingHorizontal: 20, paddingBottom: spacing.xxl },
  card: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: 4 },
  name: { fontSize: 16, fontWeight: '600', fontFamily: 'Inter_600SemiBold', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  meta: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
});
