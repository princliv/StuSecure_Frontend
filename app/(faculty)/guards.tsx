import { View, Text, StyleSheet } from 'react-native';
export default function GuardsScreen() {
  return (
    <View style={styles.c}>
      <Text style={styles.t}>Guard Management</Text>
      {/* TODO: guard list, duty schedule */}
    </View>
  );
}
const styles = StyleSheet.create({ c: { flex:1, alignItems:'center', justifyContent:'center', padding:24 }, t: { fontSize:22, fontWeight:'bold' } });
