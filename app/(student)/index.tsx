import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/auth.store';

export default function StudentHomeScreen() {
  const { profile } = useAuthStore();

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>
        Welcome, {profile?.displayName ?? 'Student'} 👋
      </Text>
      <Text style={styles.subtitle}>StuSecure — Student Dashboard</Text>
      {/* TODO: render QR preview, recent movement summary, quick-actions */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  greeting: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#666' },
});
