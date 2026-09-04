import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { emergencyApi } from '@/services/api/emergency.api';

export default function EmergencyScreen() {
  const triggerSOS = async () => {
    try {
      await emergencyApi.triggerSOS({ type: 'SOS' });
    } catch (e) {
      // TODO: proper error handling
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency SOS</Text>
      <TouchableOpacity style={styles.sosButton} onPress={triggerSOS}>
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
      {/* TODO: emergency instructions, contact list */}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 32 },
  sosButton: {
    width: 140, height: 140, borderRadius: 70,
    backgroundColor: '#e53e3e',
    alignItems: 'center', justifyContent: 'center',
  },
  sosText: { color: '#fff', fontSize: 28, fontWeight: 'bold' },
});
