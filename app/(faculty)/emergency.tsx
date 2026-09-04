import { View, Text, StyleSheet } from 'react-native';
export default function FacultyEmergencyScreen() {
  return (
    <View style={styles.c}>
      <Text style={styles.t}>Emergency Dashboard</Text>
      {/* TODO: active SOS list, acknowledge/resolve via emergencyApi */}
    </View>
  );
}
const styles = StyleSheet.create({ c: { flex:1, alignItems:'center', justifyContent:'center', padding:24 }, t: { fontSize:22, fontWeight:'bold' } });
