import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@/hooks/useTheme';
import { movementApi, type MovementLog } from '@/services/api/movement.api';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import axios from 'axios';

function errorMessage(err: unknown) {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined;
    return data?.error ?? err.message;
  }
  return 'Scan failed.';
}

export default function ScanResultScreen() {
  const { token } = useLocalSearchParams<{ token?: string }>();
  const router = useRouter();
  const { palette, brand, statusBarStyle } = useTheme();
  const [log, setLog] = useState<MovementLog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setError('No QR token provided.');
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data } = await movementApi.scan(token);
        if (!cancelled) setLog(data);
      } catch (err) {
        if (!cancelled) setError(errorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const isIn = log?.type === 'CHECK_IN';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]} edges={['top']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={palette.background} />
      <View style={styles.body}>
        {loading ? (
          <ActivityIndicator size="large" color={brand.blue} />
        ) : error ? (
          <>
            <View style={[styles.iconWrap, { backgroundColor: palette.errorContainer }]}>
              <MaterialIcons name="error-outline" size={40} color={palette.error} />
            </View>
            <Text style={[styles.heading, { color: palette.textPrimary }]}>Scan failed</Text>
            <Text style={[styles.sub, { color: palette.textMuted }]}>{error}</Text>
          </>
        ) : log ? (
          <>
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: isIn ? palette.secondaryFixed : palette.errorContainer },
              ]}
            >
              <MaterialIcons
                name={isIn ? 'login' : 'logout'}
                size={40}
                color={isIn ? palette.onSecondaryFixed : palette.error}
              />
            </View>
            <Text style={[styles.heading, { color: palette.textPrimary }]}>
              {isIn ? 'Checked in' : 'Checked out'}
            </Text>
            <Text style={[styles.name, { color: palette.textPrimary }]}>{log.student.name}</Text>
            <Text style={[styles.sub, { color: palette.textMuted }]}>
              {log.student.enrollmentNo}
              {log.student.hostelName ? ` · ${log.student.hostelName}` : ''}
              {log.student.roomNumber ? ` · Room ${log.student.roomNumber}` : ''}
            </Text>
            <Text style={[styles.sub, { color: palette.textMuted, marginTop: spacing.sm }]}>
              {new Date(log.timestamp).toLocaleTimeString([], {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          </>
        ) : null}

        <TouchableOpacity
          style={[styles.btn, { backgroundColor: brand.blue }]}
          onPress={() => router.replace('/(guard)/scanner')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnText}>Scan again</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  iconWrap: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: spacing.sm,
  },
  name: { fontSize: 18, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
  sub: { fontSize: 14, textAlign: 'center', fontFamily: 'Inter_400Regular', marginTop: 4 },
  btn: {
    marginTop: spacing.xl,
    borderRadius: radius.xl,
    paddingVertical: 14,
    paddingHorizontal: 32,
    minWidth: 200,
    alignItems: 'center',
  },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600', fontFamily: 'Inter_600SemiBold' },
});
