import { View, Text, StyleSheet } from 'react-native';
export default function HelpRequestsScreen() {
  return (
    <View style={styles.c}>
      <Text style={styles.t}>Help Requests</Text>
      {/* TODO: list/manage student help & transport requests */}
    </View>
  );
}
const styles = StyleSheet.create({ c: { flex:1, alignItems:'center', justifyContent:'center', padding:24 }, t: { fontSize:22, fontWeight:'bold' } });
