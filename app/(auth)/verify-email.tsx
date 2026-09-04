import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function VerifyEmailScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Verify Email</Text>
      <Text style={styles.subtitle}>
        A verification link has been sent to your email. Please check your inbox.
      </Text>

      {/* TODO: listen for Firebase email-verified state, then redirect */}

      <TouchableOpacity style={styles.button} onPress={() => router.replace('/(auth)/login')}>
        <Text style={styles.buttonText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 32, textAlign: 'center' },
  button: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 8,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
});
