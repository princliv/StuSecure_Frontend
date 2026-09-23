import { View, Text, StyleSheet, TouchableOpacity, StatusBar, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import BrandLogo from '@/components/ui/BrandLogo';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

function DashCard({
  title,
  meta,
  action,
  onPress,
  palette,
  brand,
}: {
  title: string;
  meta: string;
  action: string;
  onPress: () => void;
  palette: { surface: string; border: string; textPrimary: string; textMuted: string };
  brand: { blue: string };
}) {
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: palette.surface, borderColor: palette.border }]}
      onPress={onPress}
    >
      <Text style={[styles.cardTitle, { color: palette.textPrimary }]}>{title}</Text>
      <Text style={[styles.cardMeta, { color: palette.textMuted }]}>{meta}</Text>
      <Text style={[styles.link, { color: brand.blue }]}>{action}</Text>
    </TouchableOpacity>
  );
}

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
      <ScrollView contentContainerStyle={styles.body}>
        <DashCard
          palette={palette}
          brand={brand}
          title="Help requests"
          meta="Assign and resolve student transport, hostel, and medical requests."
          action="Open inbox"
          onPress={() => router.push('/(faculty)/help-requests')}
        />
        <DashCard
          palette={palette}
          brand={brand}
          title="Notifications"
          meta="SOS, help, and system alerts for this campus."
          action="Open alerts"
          onPress={() => router.push('/(faculty)/alerts')}
        />
        <DashCard
          palette={palette}
          brand={brand}
          title="Guards"
          meta="On-duty security staff for this campus."
          action="Open directory"
          onPress={() => router.push('/(faculty)/guards')}
        />
        <DashCard
          palette={palette}
          brand={brand}
          title="Attendance"
          meta="Date-filtered check-in and check-out logs."
          action="Open records"
          onPress={() => router.push('/(faculty)/attendance')}
        />
        <DashCard
          palette={palette}
          brand={brand}
          title="Reports"
          meta="7-day movement totals and daily breakdown."
          action="Open summary"
          onPress={() => router.push('/(faculty)/reports')}
        />
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
  body: { paddingHorizontal: 20, paddingBottom: spacing.xxl, gap: spacing.md },
  card: {
    borderWidth: 1,
    borderRadius: radius.xl,
    padding: spacing.md,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  cardMeta: { fontSize: 13, fontFamily: 'Inter_400Regular', marginTop: 4 },
  link: { fontSize: 13, fontWeight: '600', fontFamily: 'Inter_600SemiBold', marginTop: spacing.md },
});
