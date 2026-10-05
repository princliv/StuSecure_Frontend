import React from 'react';
import { Alert, ScrollView, StatusBar, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import BrandLogo from '@/components/ui/BrandLogo';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/auth.store';
import { performSignOut } from '@/features/auth/signOut';

function Row({ icon, label, value }: { icon: React.ComponentProps<typeof MaterialIcons>['name']; label: string; value: string }) {
  const { palette } = useTheme();
  return (
    <View style={[styles.row, { borderBottomColor: palette.border }]}>
      <View style={[styles.rowIconWrap, { backgroundColor: palette.surfaceVariant }]}>
        <MaterialIcons name={icon} size={18} color={palette.textMuted} />
      </View>
      <View style={styles.rowText}>
        <Text style={[styles.rowLabel, { color: palette.textMuted }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: palette.textPrimary }]}>{value}</Text>
      </View>
    </View>
  );
}

export default function FacultyProfileScreen() {
  const { palette, brand, statusBarStyle } = useTheme();
  const profile = useAuthStore((s) => s.profile);
  const membership = useAuthStore((s) => {
    const m = s.activeOrganizationId
      ? s.memberships.find((x) => x.organizationId === s.activeOrganizationId) ?? s.memberships[0]
      : s.memberships[0];
    return m ?? null;
  });

  const handleSignOut = () => {
    Alert.alert('Sign out?', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: () => void performSignOut() },
    ]);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={palette.background} />
      <View style={styles.header}>
        <BrandLogo height={22} />
        <Text style={[styles.title, { color: palette.textPrimary }]}>My Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}>
          <View style={[styles.avatarWrap, { backgroundColor: palette.surfaceVariant }]}>
            <MaterialIcons name="co-present" size={32} color={brand.blue} />
          </View>
          <Text style={[styles.name, { color: palette.textPrimary }]}>{profile?.displayName ?? '—'}</Text>
          <Text style={[styles.sub, { color: palette.textMuted }]}>
            {membership?.role ?? 'FACULTY'} · {membership?.organizationName ?? ''}
          </Text>

          <View style={styles.rows}>
            <Row icon="email" label="Email" value={profile?.email ?? '—'} />
            <Row icon="business" label="Organization" value={membership?.organizationName ?? '—'} />
            <Row icon="verified-user" label="Role" value={membership?.role ?? '—'} />
          </View>
        </View>

        <Button label="Sign Out" variant="outline" onPress={handleSignOut} style={{ marginTop: spacing.xl }} />
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
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  avatarWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  name: { fontSize: 18, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  sub: { fontSize: 13, marginTop: 2, marginBottom: spacing.md, fontFamily: 'Inter_400Regular' },

  rows: { width: '100%', marginTop: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  rowIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: { flex: 1 },
  rowLabel: { fontSize: 11, fontFamily: 'Inter_400Regular' },
  rowValue: { fontSize: 14, fontFamily: 'Inter_500Medium', marginTop: 1 },
});
