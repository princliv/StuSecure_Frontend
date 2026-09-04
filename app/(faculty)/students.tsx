import { View, Text, StyleSheet } from 'react-native';
export default function StudentsScreen() {
  return (
    <View style={styles.c}>
      <Text style={styles.t}>Students</Text>
      {/* TODO: student list with search, CRUD actions via studentApi */}
    </View>
  );
}
const styles = StyleSheet.create({ c: { flex:1, alignItems:'center', justifyContent:'center', padding:24 }, t: { fontSize:22, fontWeight:'bold' } });
