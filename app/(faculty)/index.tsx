import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import BrandLogo from '@/components/ui/BrandLogo';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export default function FacultyDashboard() {
  const { palette, brand, statusBarStyle } = useTheme();
  const router = useRouter();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={palette.background} />
      <View style={styles.header}>
        <BrandLogo height={22} />
        <Text style={[styles.title, { color: palette.textPrimary }]}>Dashboard</Text>
      </View>
      <View style={styles.body}>
        <TouchableOpacity
          style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
          onPress={() => router.push('/(faculty)/help-requests')}
        >
          <Text style={[styles.cardTitle, { color: palette.textPrimary }]}>Help requests</Text>
          <Text style={[styles.cardMeta, { color: palette.textMuted }]}>
            Assign and resolve student transport, hostel, and medical requests.
          </Text>
          <Text style={[styles.link, { color: brand.blue }]}>Open inbox</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.card,
            { backgroundColor: palette.surface, borderColor: palette.border, marginTop: spacing.md },
          ]}
          onPress={() => router.push('/(faculty)/alerts')}
        >
          <Text style={[styles.cardTitle, { color: palette.textPrimary }]}>Notifications</Text>
          <Text style={[styles.cardMeta, { color: palette.textMuted }]}>
            SOS, help, and system alerts for this campus.
          </Text>
          <Text style={[styles.link, { color: brand.blue }]}>Open alerts</Text>
        </TouchableOpacity>
      </View>
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
  body: { paddingHorizontal: 20 },
  card: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  cardMeta: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 4 },
  link: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold', marginTop: spacing.md },
});
