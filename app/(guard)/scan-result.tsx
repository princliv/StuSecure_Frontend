import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function ScanResultScreen() {
  const params = useLocalSearchParams();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan Result</Text>
      {/* TODO: display student name, photo, CHECK_IN/CHECK_OUT status, timestamp */}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold' },
});
