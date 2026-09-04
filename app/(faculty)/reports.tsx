import { View, Text, StyleSheet } from 'react-native';
export default function ReportsScreen() {
  return (
    <View style={styles.c}>
      <Text style={styles.t}>Reports</Text>
      {/* TODO: downloadable attendance/movement reports */}
    </View>
  );
}
const styles = StyleSheet.create({ c: { flex:1, alignItems:'center', justifyContent:'center', padding:24 }, t: { fontSize:22, fontWeight:'bold' } });
