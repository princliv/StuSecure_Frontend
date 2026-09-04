import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

export default function ScannerScreen() {
  const router = useRouter();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>QR Scanner</Text>
      {/* TODO: integrate expo-camera CameraView to scan QR codes */}
      {/* On scan success call movementApi.scan(token) then navigate to scan-result */}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold' },
});
