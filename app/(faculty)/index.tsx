import { View, Text, StyleSheet } from 'react-native';
export default function FacultyDashboard() {
  return (
    <View style={styles.c}>
      <Text style={styles.t}>Faculty Dashboard</Text>
      {/* TODO: summary cards — total students, check-ins today, open emergencies */}
    </View>
  );
}
const styles = StyleSheet.create({ c: { flex:1, alignItems:'center', justifyContent:'center', padding:24 }, t: { fontSize:22, fontWeight:'bold' } });
