import React, { useState } from 'react';
import { View, Text, StyleSheet, StatusBar, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import BrandLogo from '@/components/ui/BrandLogo';
import TextField from '@/components/ui/TextField';
import Button from '@/components/ui/Button';
import { firebaseAuth } from '@/services/firebase/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { palette, brand, isDark, statusBarStyle } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await firebaseAuth.resetPassword(email.trim());
      setSent(true);
    } catch {
      setError('Could not send reset email. Please verify your address and try again.');
    } finally {
      setLoading(false);
    }
  };

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
            <MaterialIcons
              name={sent ? 'check-circle' : 'lock-reset'}
              size={36}
              color={sent ? (isDark ? '#34D399' : '#047857') : isDark ? '#38BDF8' : brand.blue}
            />
          </View>

          <Text style={[styles.title, { color: palette.textPrimary }]}>
            {sent ? 'Reset Link Sent' : 'Reset Password'}
          </Text>

          <Text style={[styles.subtitle, { color: palette.textMuted }]}>
            {sent
              ? `We've sent password reset instructions to ${email}. Check your inbox and follow the link to create a new password.`
              : 'Enter your institutional email address and we will send you a link to reset your account password.'}
          </Text>

          {error ? (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: palette.errorContainer,
                  borderColor: `${palette.error}40`,
                },
              ]}
            >
              <MaterialIcons name="error-outline" size={16} color={palette.error} />
              <Text style={{ color: palette.error, fontSize: 13, flex: 1 }}>{error}</Text>
            </View>
          ) : null}

          {!sent ? (
            <>
              <View style={{ width: '100%', marginBottom: spacing.md }}>
                <TextField
                  label="Registered Email"
                  placeholder="e.g. s1234567@student.edu"
                  leftIconName="email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={(val) => {
                    setEmail(val);
                    setError(null);
                  }}
                />
              </View>

              <Button
                label="Send Reset Link"
                loading={loading}
                onPress={() => void handleSubmit()}
                style={{ width: '100%' }}
              />
            </>
          ) : null}

          <Button
            label="Back to Login"
            variant="outline"
            onPress={() => router.back()}
            style={{ width: '100%', marginTop: spacing.sm }}
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
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.md,
    width: '100%',
  },
});
