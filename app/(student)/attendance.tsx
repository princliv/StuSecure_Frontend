import { View, Text, StyleSheet } from 'react-native';

export default function AttendanceScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Attendance</Text>
      {/* TODO: fetch movementApi.getMyHistory, render attendance list */}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold' },
});
