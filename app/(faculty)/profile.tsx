import { View, Text, StyleSheet } from 'react-native';
export default function FacultyProfileScreen() {
  return (
    <View style={styles.c}>
      <Text style={styles.t}>My Profile</Text>
      {/* TODO: faculty profile, settings, sign-out */}
    </View>
  );
}
const styles = StyleSheet.create({ c: { flex:1, alignItems:'center', justifyContent:'center', padding:24 }, t: { fontSize:22, fontWeight:'bold' } });
