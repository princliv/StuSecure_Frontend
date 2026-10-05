/**
 * LoginScreen — "Secure Modernity" design.
 *
 * Features:
 *  • react-hook-form + zod validation
 *  • Firebase email/password sign-in
 *  • Show/hide password toggle
 *  • "Remember me" checkbox
 *  • "Forgot password?" & "Register now" navigation links
 *  • Keyboard-aware scrollable layout (iOS + Android)
 *  • Full dark-mode support via useTheme()
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { firebaseAuth } from '@/services/firebase/auth';
import { authApi } from '@/services/api/auth.api';
import { setAuthToken } from '@/services/api/client';
import { useAuthStore } from '@/store/auth.store';
import { routeByMembership } from '@/features/auth/routeByMembership';
import { useTheme } from '@/hooks/useTheme';
import { brand } from '@/theme/colors';
import type { AppPalette } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import TextField from '@/components/ui/TextField';
import Button from '@/components/ui/Button';
import BrandLogo from '@/components/ui/BrandLogo';

// ─── Validation schema ───────────────────────────────────────────────────────

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  organization: z.string().trim().optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Firebase error → friendly message ──────────────────────────────────────

function friendlyFirebaseError(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return 'Invalid email or password. Please try again.';
    case 'auth/user-disabled':
      return 'This account has been disabled. Contact support.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    default:
      return 'Sign-in failed. Please try again.';
  }
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function LoginScreen() {
  const { palette, statusBarStyle } = useTheme();
  const styles = makeStyles(palette);

  const { setProfile, setMemberships, selectOrg } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', organization: '' },
  });

  const onSubmit = async (data: FormData) => {
    setGlobalError(null);
    try {
      // 1. Firebase sign-in — get the ID token immediately.
      const credential = await firebaseAuth.signIn(data.email.trim(), data.password);
      const token = await firebaseAuth.getIdToken(credential.user);
      setAuthToken(token);

      // 2. Sync with the backend to get the user profile + memberships.
      //    (AppProvider's onAuthStateChanged will do the same, but we need
      //     the memberships right now for routing — don't wait for the listener.)
      const { data: syncData } = await authApi.sync();
      setProfile(syncData.user);
      setMemberships(syncData.memberships);

      // 3. Route by membership.
      const mems = syncData.memberships;
      const typedOrg = data.organization?.trim();

      if (typedOrg) {
        const lower = typedOrg.toLowerCase();
        const matches = mems.filter(
          (m) =>
            m.organizationSlug === typedOrg ||
            m.organizationId === typedOrg ||
            m.organizationName.toLowerCase() === lower,
        );

        if (matches.length === 1) {
          selectOrg(matches[0]);
          routeByMembership(matches[0]);
          return;
        }

        setGlobalError(
          'No membership found for that Organization ID — check with your admin, or leave it blank to choose from a list.',
        );
        return;
      }

      if (mems.length === 0) {
        setGlobalError('No organization found for your account. Contact your admin.');
        return;
      }

      if (mems.length > 1) {
        // Multiple orgs — let the user choose.
        router.replace('/(auth)/select-org');
        return;
      }

      // Single org — select it and route directly.
      selectOrg(mems[0]);
      routeByMembership(mems[0]);
    } catch (err: unknown) {
      const code =
        err != null && typeof err === 'object' && 'code' in err
          ? String((err as { code: unknown }).code)
          : '';
      setGlobalError(friendlyFirebaseError(code));
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={palette.background} />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Logo / hero ───────────────────────────────────────────── */}
          <View style={styles.heroSection}>
            <BrandLogo height={44} style={{ marginBottom: spacing.lg }} />
            <Text style={styles.heroTitle}>Welcome back</Text>
            <Text style={styles.heroSubtitle}>Secure access to your campus life.</Text>
          </View>

          {/* ── Form card ─────────────────────────────────────────────── */}
          <View style={styles.card}>
            {/* Decorative top stripe */}
            <View style={styles.cardTopStripe} />

            {/* Global error banner */}
            {globalError ? (
              <View style={styles.errorBanner}>
                <MaterialIcons name="error-outline" size={16} color={palette.error} />
                <Text style={styles.errorBannerText}>{globalError}</Text>
              </View>
            ) : null}

            {/* Email field */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Email or Student ID"
                  placeholder="e.g. s1234567@student.edu"
                  leftIconName="badge"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  returnKeyType="next"
                  textContentType="emailAddress"
                  autoComplete="email"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.email?.message}
                />
              )}
            />

            {/* Password field — label row has "Forgot password?" on the right */}
            <View style={styles.passwordWrapper}>
              <View style={styles.passwordLabelRow}>
                <Text style={styles.fieldLabel}>Password</Text>
                <TouchableOpacity
                  onPress={() => router.push('/(auth)/forgot-password')}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.forgotLink}>Forgot password?</Text>
                </TouchableOpacity>
              </View>

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    placeholder="••••••••"
                    leftIconName="lock"
                    secureTextEntry={!showPassword}
                    rightIconName={showPassword ? 'visibility' : 'visibility-off'}
                    onRightIconPress={() => setShowPassword((v) => !v)}
                    rightIconColor={showPassword ? brand.blue : palette.textMuted}
                    returnKeyType="done"
                    textContentType="password"
                    autoComplete="current-password"
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                    error={errors.password?.message}
                    onSubmitEditing={handleSubmit(onSubmit)}
                  />
                )}
              />
            </View>

            {/* Organization ID (optional) */}
            <Controller
              control={control}
              name="organization"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Organization ID (optional)"
                  placeholder="e.g. demo-organization-a1b2c3"
                  leftIconName="business"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.organization?.message}
                />
              )}
            />
            <Text style={styles.helperText}>
              Organization ID (optional) — leave blank to choose from a list.
            </Text>

            {/* Remember me */}
            <TouchableOpacity
              style={styles.rememberRow}
              onPress={() => setRememberMe((v) => !v)}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxChecked]}>
                {rememberMe ? (
                  <MaterialIcons name="check" size={14} color="#fff" />
                ) : null}
              </View>
              <Text style={styles.rememberLabel}>Remember me on this device</Text>
            </TouchableOpacity>

            {/* Primary CTA */}
            <Button
              label="Secure Login"
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
              rightElement={
                !isSubmitting ? (
                  <MaterialIcons name="arrow-forward" size={18} color="#fff" />
                ) : undefined
              }
            />

            {/* OR divider */}
            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerLabel}>OR</Text>
              <View style={styles.dividerLine} />
            </View>

            {/* Institutional Sign-In */}
            <Button
              label="Institutional Sign-In"
              variant="outline"
              rightElement={
                <MaterialIcons name="account-balance" size={18} color={palette.textMutedDark} />
              }
              onPress={() =>
                Alert.alert(
                  'Coming soon',
                  'Institutional sign-in is not available yet. Please sign in with your email and password.',
                )
              }
            />
          </View>

          {/* ── Register link ─────────────────────────────────────────── */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => router.push('/(auth)/register')}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              activeOpacity={0.7}
            >
              <Text style={styles.registerLink}>Register now</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles factory ──────────────────────────────────────────────────────────

const SIDE_MARGIN = 20;

function makeStyles(palette: AppPalette) {
  return StyleSheet.create({
    flex: { flex: 1 },

    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },

    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: SIDE_MARGIN,
      paddingTop: spacing.xl,
      paddingBottom: spacing.xxl,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ── Hero ──────────────────────────────────────────────────────────────────

    heroSection: {
      alignItems: 'center',
      marginBottom: spacing.xl,
    },

    heroTitle: {
      fontSize: 26,
      fontWeight: '700',
      color: palette.textPrimary,
      marginBottom: spacing.xs,
      textAlign: 'center',
      fontFamily: 'Inter_700Bold',
    },

    heroSubtitle: {
      fontSize: 14,
      color: palette.textMuted,
      textAlign: 'center',
      fontFamily: 'Inter_400Regular',
    },

    // ── Card ──────────────────────────────────────────────────────────────────

    card: {
      width: '100%',
      backgroundColor: palette.surface,
      borderRadius: radius.xl, // 16
      borderWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: spacing.lg, // 24
      paddingTop: spacing.lg + 4,
      paddingBottom: spacing.lg,
      gap: spacing.md, // 16 between form rows
      // shadow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 16,
      elevation: 4,
      overflow: 'hidden',
    },

    cardTopStripe: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 3,
      backgroundColor: brand.blue,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
    },

    // ── Error banner ──────────────────────────────────────────────────────────

    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: palette.errorContainer,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
    },
    errorBannerText: {
      flex: 1,
      fontSize: 13,
      color: palette.error,
      fontFamily: 'Inter_400Regular',
    },

    // ── Password row ──────────────────────────────────────────────────────────

    passwordWrapper: {
      gap: spacing.xs,
    },
    passwordLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginLeft: 2,
      marginRight: 2,
    },
    fieldLabel: {
      fontSize: 13,
      fontWeight: '500',
      color: palette.textMutedDark,
      fontFamily: 'Inter_500Medium',
    },
    forgotLink: {
      fontSize: 13,
      fontWeight: '500',
      color: brand.blue,
      fontFamily: 'Inter_500Medium',
    },

    helperText: {
      fontSize: 12,
      color: palette.textMuted,
      marginTop: -spacing.xs,
      marginLeft: 2,
      fontFamily: 'Inter_400Regular',
    },

    // ── Remember me ───────────────────────────────────────────────────────────

    rememberRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: -spacing.xs,
    },
    checkbox: {
      width: 20,
      height: 20,
      borderRadius: radius.sm, // 4
      borderWidth: 1.5,
      borderColor: palette.borderVariant,
      backgroundColor: palette.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    checkboxChecked: {
      backgroundColor: brand.blue,
      borderColor: brand.blue,
    },
    rememberLabel: {
      fontSize: 14,
      color: palette.textMutedDark,
      fontFamily: 'Inter_400Regular',
    },

    // ── OR divider ────────────────────────────────────────────────────────────

    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginVertical: -spacing.xs,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: palette.border,
    },
    dividerLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: palette.textMuted,
      letterSpacing: 1,
      fontFamily: 'Inter_600SemiBold',
    },

    // ── Register link ─────────────────────────────────────────────────────────

    registerRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: spacing.lg,
    },
    registerText: {
      fontSize: 14,
      color: palette.textMuted,
      fontFamily: 'Inter_400Regular',
    },
    registerLink: {
      fontSize: 14,
      fontWeight: '600',
      color: brand.blue,
      fontFamily: 'Inter_600SemiBold',
    },
  });
}
