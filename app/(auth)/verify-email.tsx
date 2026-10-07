import React from 'react';
import { View, Text, StyleSheet, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import BrandLogo from '@/components/ui/BrandLogo';
import Button from '@/components/ui/Button';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { palette, brand, isDark, statusBarStyle } = useTheme();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: palette.background }]}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={palette.background} />

      <View style={styles.container}>
        <BrandLogo variant="with-name" height={52} style={{ marginBottom: spacing.xl }} />

        <View
          style={[
            styles.card,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
        >
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: isDark ? 'rgba(56, 189, 248, 0.12)' : 'rgba(21, 94, 239, 0.08)',
                borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(21, 94, 239, 0.2)',
              },
            ]}
          >
            <MaterialIcons name="mark-email-read" size={36} color={isDark ? '#38BDF8' : brand.blue} />
          </View>

          <Text style={[styles.title, { color: palette.textPrimary }]}>Verify Your Email</Text>
          <Text style={[styles.subtitle, { color: palette.textMuted }]}>
            A verification link has been sent to your email address. Please click the link to confirm your account and continue.
          </Text>

          <Button
            label="Back to Login"
            onPress={() => router.replace('/(auth)/login')}
            style={{ width: '100%', marginTop: spacing.md }}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: radius.xxl,
    borderWidth: 1,
    padding: spacing.xl,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  iconWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 21,
    fontFamily: 'Inter_400Regular',
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
});
