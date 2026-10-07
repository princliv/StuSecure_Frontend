import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
import { helpApi, type HelpRequest, type HelpRequestType } from '@/services/api/help.api';
import BrandLogo from '@/components/ui/BrandLogo';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

const TYPES: { value: HelpRequestType; label: string }[] = [
  { value: 'TRANSPORTATION', label: 'Transport' },
  { value: 'MEDICAL', label: 'Medical' },
  { value: 'HOSTEL', label: 'Hostel' },
  { value: 'SECURITY', label: 'Security' },
  { value: 'OTHER', label: 'Other' },
];

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

export default function StudentHelpScreen() {
  const { palette, brand, statusBarStyle } = useTheme();
  const [type, setType] = useState<HelpRequestType>('HOSTEL');
  const [description, setDescription] = useState('');
  const [items, setItems] = useState<HelpRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const { data } = await helpApi.listMine({ limit: 50 });
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
    }, [load]),
  );

  const onSubmit = async () => {
    if (!description.trim()) {
      setError('Describe what you need help with.');
      return;
    }
    setSubmitting(true);
    try {
      const { data } = await helpApi.create({
        type,
        description: description.trim(),
        priority: 'NORMAL',
      });
      setItems((prev) => [data, ...prev]);
      setDescription('');
      setError(null);
    } catch (err) {
      setError(apiError(err, 'Could not submit request.'));
    } finally {
      setSubmitting(false);
    }
  };

  const onCancel = async (id: string) => {
    setBusyId(id);
    try {
      const { data } = await helpApi.cancel(id);
      setItems((prev) => prev.map((r) => (r.id === id ? data : r)));
    } catch (err) {
      setError(apiError(err, 'Could not cancel request.'));
    } finally {
      setBusyId(null);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={palette.background} />
      <View style={styles.header}>
        <BrandLogo variant="icon" size={26} />
        <Text style={[styles.title, { color: palette.textPrimary }]}>Help</Text>
      </View>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => void load()} tintColor={brand.blue} />
          }
        >
          {error ? (
            <Text style={{ color: palette.error, textAlign: 'center', marginBottom: spacing.md }}>
              {error}
            </Text>
          ) : null}

          <Text style={[styles.section, { color: palette.textMuted }]}>NEW REQUEST</Text>
          <View style={styles.types}>
            {TYPES.map((t) => {
              const on = type === t.value;
              return (
                <TouchableOpacity
                  key={t.value}
                  onPress={() => setType(t.value)}
                  style={[
                    styles.typeChip,
                    {
                      borderColor: on ? brand.blue : palette.border,
                      backgroundColor: on ? brand.blue : palette.surface,
                    },
                  ]}
                >
                  <Text style={[styles.typeChipText, { color: on ? '#fff' : palette.textPrimary }]}>
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="What do you need help with?"
            placeholderTextColor={palette.textMuted}
            multiline
            style={[
              styles.input,
              {
                color: palette.textPrimary,
                backgroundColor: palette.surface,
                borderColor: palette.border,
              },
            ]}
          />
          <TouchableOpacity
            style={[styles.submit, { backgroundColor: brand.blue }]}
            onPress={() => void onSubmit()}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>Submit request</Text>
            )}
          </TouchableOpacity>

          <Text style={[styles.section, { color: palette.textMuted, marginTop: spacing.xl }]}>
            YOUR REQUESTS
          </Text>
          {loading && items.length === 0 ? (
            <ActivityIndicator color={brand.blue} style={{ marginTop: spacing.lg }} />
          ) : items.length === 0 ? (
            <Text style={{ color: palette.textMuted, textAlign: 'center' }}>
              No help requests yet.
            </Text>
          ) : (
            items.map((item) => (
              <View
                key={item.id}
                style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
              >
                <View style={styles.cardTop}>
                  <Text style={[styles.name, { color: palette.textPrimary }]}>{item.type}</Text>
                  <Text
                    style={[
                      styles.badge,
                      {
                        color:
                          item.status === 'PENDING'
                            ? brand.blue
                            : item.status === 'RESOLVED'
                              ? palette.successText
                              : item.status === 'CANCELLED'
                                ? palette.textMuted
                                : palette.textPrimary,
                      },
                    ]}
                  >
                    {item.status.replace('_', ' ')}
                  </Text>
                </View>
                <Text style={[styles.meta, { color: palette.textPrimary }]}>{item.description}</Text>
                <Text style={[styles.meta, { color: palette.textMuted }]}>
                  {formatWhen(item.createdAt)}
                  {item.assignedTo ? ` · ${item.assignedTo.name}` : ''}
                </Text>
                {item.status === 'PENDING' ? (
                  <TouchableOpacity
                    style={[styles.cancelBtn, { borderColor: palette.border }]}
                    onPress={() => void onCancel(item.id)}
                    disabled={busyId === item.id}
                  >
                    <Text style={[styles.cancelText, { color: palette.error }]}>Cancel</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            ))
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
  section: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    letterSpacing: 0.6,
    marginBottom: spacing.sm,
  },
  types: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  typeChip: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  typeChipText: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  input: {
    minHeight: 96,
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
    textAlignVertical: 'top',
    fontFamily: 'Inter_400Regular',
    fontSize: 15,
  },
  submit: {
    marginTop: spacing.md,
    borderRadius: radius.lg,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
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
  name: { fontSize: 14, fontWeight: '600', fontFamily: 'Inter_600SemiBold', flex: 1 },
  badge: { fontSize: 11, fontWeight: '700', fontFamily: 'Inter_700Bold' },
  meta: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 2 },
  cancelBtn: {
    marginTop: spacing.md,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelText: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
});
