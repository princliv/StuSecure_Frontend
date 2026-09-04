import { View, Text, StyleSheet } from 'react-native';

/** Displays the student's QR code for guard scanning */
export default function QRScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>My QR Code</Text>
      {/* TODO: fetch qrApi.getMyQR, render QR code image */}
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  title: { fontSize: 22, fontWeight: 'bold' },
});
