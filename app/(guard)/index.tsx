import { View, Text, StyleSheet } from 'react-native';
import { useAuthStore } from '@/store/auth.store';

export default function GuardHomeScreen() {
  const { profile } = useAuthStore();
  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Guard Dashboard</Text>
      <Text style={styles.subtitle}>Welcome, {profile?.displayName ?? 'Guard'}</Text>
      {/* TODO: today's scan count, recent activity summary */}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  greeting: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#666' },
});
