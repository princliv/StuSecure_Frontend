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
import { emergencyApi, type Emergency } from '@/services/api/emergency.api';
import { connectSocket, getSocket } from '@/services/socket/socket';
import { auth } from '@/services/firebase/auth';
import { useAuthStore } from '@/store/auth.store';
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

export default function FacultyEmergencyInboxScreen({
  canResolve = true,
  title = 'Emergencies',
}: {
  canResolve?: boolean;
  title?: string;
} = {}) {
  const { palette, brand, statusBarStyle } = useTheme();
  const orgId = useAuthStore((s) => s.activeOrganizationId ?? s.memberships[0]?.organizationId);
  const [items, setItems] = useState<Emergency[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await emergencyApi.getAll({ limit: 50 });
      setItems(data.emergencies);
      setError(null);
    } catch {
      setError('Could not load emergencies.');
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
        const upsert = (row: Emergency) => {
          setItems((prev) => {
            const rest = prev.filter((e) => e.id !== row.id);
            return [row, ...rest];
          });
        };
        socket.on('emergency:created', upsert);
        socket.on('emergency:updated', upsert);
      })();

      return () => {
        socket?.off('emergency:created');
        socket?.off('emergency:updated');
      };
    }, [load, orgId]),
  );

  const onAck = async (id: string) => {
    setBusyId(id);
    try {
      const { data } = await emergencyApi.acknowledge(id);
      setItems((prev) => prev.map((e) => (e.id === id ? data : e)));
    } catch {
      setError('Could not acknowledge.');
    } finally {
      setBusyId(null);
    }
  };

  const onResolve = async (id: string) => {
    setBusyId(id);
    try {
      const { data } = await emergencyApi.resolve(id);
      setItems((prev) => prev.map((e) => (e.id === id ? data : e)));
    } catch {
      setError('Could not resolve.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={palette.background} />
      <View style={styles.header}>
        <BrandLogo height={22} />
        <Text style={[styles.title, { color: palette.textPrimary }]}>{title}</Text>
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
          <Text style={{ color: palette.textMuted, textAlign: 'center' }}>No emergencies.</Text>
        ) : (
          items.map((item) => {
            const open = item.status === 'ACTIVE' || item.status === 'ACKNOWLEDGED';
            return (
              <View
                key={item.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: palette.surface,
                    borderColor:
                      item.status === 'ACTIVE' ? palette.error : palette.border,
                  },
                ]}
              >
                <View style={styles.cardTop}>
                  <Text style={[styles.name, { color: palette.textPrimary }]}>
                    {item.reportedBy.name}
                  </Text>
                  <Text
                    style={[
                      styles.badge,
                      {
                        color:
                          item.status === 'ACTIVE'
                            ? palette.error
                            : item.status === 'RESOLVED'
                              ? palette.successText
                              : palette.textMuted,
                      },
                    ]}
                  >
                    {item.status}
                  </Text>
                </View>
                <Text style={[styles.meta, { color: palette.textMuted }]}>
                  {item.reportedBy.enrollmentNo}
                  {item.location ? ` · ${item.location}` : ''}
                </Text>
                <Text style={[styles.meta, { color: palette.textMuted }]}>
                  {item.description} · {formatWhen(item.createdAt)}
                </Text>
                {open ? (
                  <View style={styles.actions}>
                    {item.status === 'ACTIVE' ? (
                      <TouchableOpacity
                        style={[styles.btn, { borderColor: brand.blue }]}
                        onPress={() => void onAck(item.id)}
                        disabled={busyId === item.id}
                      >
                        <Text style={[styles.btnText, { color: brand.blue }]}>Acknowledge</Text>
                      </TouchableOpacity>
                    ) : null}
                    {canResolve ? (
                      <TouchableOpacity
                        style={[styles.btn, { backgroundColor: brand.blue, borderColor: brand.blue }]}
                        onPress={() => void onResolve(item.id)}
                        disabled={busyId === item.id}
                      >
                        <Text style={[styles.btnText, { color: '#fff' }]}>Resolve</Text>
                      </TouchableOpacity>
                    ) : null}
                  </View>
                ) : null}
              </View>
            );
          })
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
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginBottom: 4,
  },
  name: { fontSize: 16, fontWeight: '600', fontFamily: 'Inter_600SemiBold', flex: 1 },
  badge: { fontSize: 11, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  meta: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  btn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: 10,
    alignItems: 'center',
  },
  btnText: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
});
