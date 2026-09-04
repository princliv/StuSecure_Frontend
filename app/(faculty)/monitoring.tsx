import { View, Text, StyleSheet } from 'react-native';
export default function MonitoringScreen() {
  return (
    <View style={styles.c}>
      <Text style={styles.t}>Live Monitoring</Text>
      {/* TODO: real-time movement feed via Socket.IO */}
    </View>
  );
}
const styles = StyleSheet.create({ c: { flex:1, alignItems:'center', justifyContent:'center', padding:24 }, t: { fontSize:22, fontWeight:'bold' } });
