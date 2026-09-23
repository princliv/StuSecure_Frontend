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
import { helpApi, type HelpRequest } from '@/services/api/help.api';
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

function apiError(err: unknown, fallback: string) {
  const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
  return msg ?? fallback;
}

export default function FacultyHelpInboxScreen() {
  const { palette, brand, statusBarStyle } = useTheme();
  const orgId = useAuthStore((s) => s.activeOrganizationId ?? s.memberships[0]?.organizationId);
  const [items, setItems] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await helpApi.list({ limit: 50 });
      setItems(data.requests);
      setError(null);
    } catch (err) {
      setError(apiError(err, 'Could not load help requests.'));
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
        const upsert = (row: HelpRequest) => {
          setItems((prev) => {
            const rest = prev.filter((e) => e.id !== row.id);
            return [row, ...rest];
          });
        };
        socket.on('help:created', upsert);
        socket.on('help:updated', upsert);
      })();

      return () => {
        socket?.off('help:created');
        socket?.off('help:updated');
      };
    }, [load, orgId]),
  );

  const onAssign = async (id: string) => {
    setBusyId(id);
    try {
      const { data } = await helpApi.assign(id);
      setItems((prev) => prev.map((e) => (e.id === id ? data : e)));
    } catch (err) {
      setError(apiError(err, 'Could not assign request.'));
    } finally {
      setBusyId(null);
    }
  };

  const onResolve = async (id: string) => {
    setBusyId(id);
    try {
      const { data } = await helpApi.resolve(id);
      setItems((prev) => prev.map((e) => (e.id === id ? data : e)));
    } catch (err) {
      setError(apiError(err, 'Could not resolve request.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={palette.background} />
      <View style={styles.header}>
        <BrandLogo height={22} />
        <Text style={[styles.title, { color: palette.textPrimary }]}>Help requests</Text>
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
          <Text style={{ color: palette.textMuted, textAlign: 'center' }}>No help requests.</Text>
        ) : (
          items.map((item) => {
            const open = item.status === 'PENDING' || item.status === 'IN_PROGRESS';
            return (
              <View
                key={item.id}
                style={[
                  styles.card,
                  {
                    backgroundColor: palette.surface,
                    borderColor: item.status === 'PENDING' ? brand.blue : palette.border,
                  },
                ]}
              >
                <View style={styles.cardTop}>
                  <Text style={[styles.name, { color: palette.textPrimary }]}>
                    {item.student.name}
                  </Text>
                  <Text
                    style={[
                      styles.badge,
                      {
                        color:
                          item.status === 'PENDING'
                            ? brand.blue
                            : item.status === 'RESOLVED'
                              ? palette.successText
                              : palette.textMuted,
                      },
                    ]}
                  >
                    {item.status.replace('_', ' ')}
                  </Text>
                </View>
                <Text style={[styles.meta, { color: palette.textMuted }]}>
                  {item.student.enrollmentNo}
                  {item.student.roomNumber ? ` · Room ${item.student.roomNumber}` : ''}
                </Text>
                <Text style={[styles.meta, { color: palette.textPrimary }]}>
                  {item.type} · {item.description}
                </Text>
                <Text style={[styles.meta, { color: palette.textMuted }]}>
                  {formatWhen(item.createdAt)}
                  {item.assignedTo ? ` · ${item.assignedTo.name}` : ''}
                </Text>
                {open ? (
                  <View style={styles.actions}>
                    {item.status === 'PENDING' ? (
                      <TouchableOpacity
                        style={[styles.btn, { borderColor: brand.blue }]}
                        onPress={() => void onAssign(item.id)}
                        disabled={busyId === item.id}
                      >
                        <Text style={[styles.btnText, { color: brand.blue }]}>Assign to me</Text>
                      </TouchableOpacity>
                    ) : null}
                    <TouchableOpacity
                      style={[styles.btn, { backgroundColor: brand.blue, borderColor: brand.blue }]}
                      onPress={() => void onResolve(item.id)}
                      disabled={busyId === item.id}
                    >
                      <Text style={[styles.btnText, { color: '#fff' }]}>Resolve</Text>
                    </TouchableOpacity>
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
