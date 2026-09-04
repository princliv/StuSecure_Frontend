import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>StuSecure</Text>
      <Text style={styles.subtitle}>Sign in to continue</Text>

      {/* TODO: implement login form using react-hook-form + zod */}
      {/* TODO: call firebaseAuth.signIn then authApi.getProfile */}

      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace('/(student)/')}>
        <Text style={styles.buttonText}>Sign In (placeholder)</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
        <Text style={styles.link}>Don't have an account? Register</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.push('/(auth)/forgot-password')}>
        <Text style={styles.link}>Forgot password?</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 32 },
  button: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 8,
    marginBottom: 16,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  link: { color: '#0a7ea4', marginTop: 8, fontSize: 14 },
});
