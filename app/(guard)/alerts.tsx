import { View, Text, StyleSheet } from 'react-native';

export default function AlertsScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Emergency Alerts</Text>
      {/* TODO: list active emergencies, Socket.IO live updates */}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold' },
});
