import { View, Text, StyleSheet } from 'react-native';

export default function GuardActivityScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Scan Activity</Text>
      {/* TODO: list of today's scans */}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold' },
});
