import { View, Text, StyleSheet } from 'react-native';
export default function FacultyAttendanceScreen() {
  return (
    <View style={styles.c}>
      <Text style={styles.t}>Attendance Records</Text>
      {/* TODO: date-filtered movement logs */}
    </View>
  );
}
const styles = StyleSheet.create({ c: { flex:1, alignItems:'center', justifyContent:'center', padding:24 }, t: { fontSize:22, fontWeight:'bold' } });
