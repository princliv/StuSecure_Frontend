/**
 * RegisterScreen — claim flow.
 *
 * Membership is never created by self-registration (see G1's security
 * model) — an org admin pre-provisions a Student/Guard/Faculty record, and
 * this screen lets the actual person "claim" it: sign up with Firebase using
 * the same email, type the Organization ID they were given, and the backend
 * swaps the placeholder account for their real Firebase identity.
 *
 * Visual language mirrors LoginScreen.tsx exactly (same components/tokens).
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { router } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import axios from 'axios';

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
  displayName: z.string().trim().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  organization: z.string().trim().min(1, 'Organization ID is required'),
});

type FormData = z.infer<typeof schema>;

// ─── Firebase error → friendly message ──────────────────────────────────────

function friendlyFirebaseError(code: string): string {
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account already exists with this email. Try signing in instead.';
    case 'auth/weak-password':
      return 'Password is too weak. Please choose a stronger password.';
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return 'Registration failed. Please try again.';
  }
}

/** Extract a backend `ApiError` message (`{ error: string }`), matching the
 *  convention used elsewhere in the app (see ScanResultScreen.tsx). */
function apiErrorMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined;
    return data?.error ?? fallback;
  }
  return fallback;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function RegisterScreen() {
  const { palette, statusBarStyle } = useTheme();
  const styles = makeStyles(palette);

  const { setProfile, setMemberships, selectOrg } = useAuthStore();

  const [showPassword, setShowPassword] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { displayName: '', email: '', password: '', organization: '' },
  });

  const onSubmit = async (data: FormData) => {
    setGlobalError(null);
    try {
      // 1. Create the Firebase identity and get a token for the backend call.
      const credential = await firebaseAuth.signUp(data.email.trim(), data.password);
      const token = await firebaseAuth.getIdToken(credential.user);
      setAuthToken(token);

      // 2. Claim the pre-provisioned account.
      const { data: claimData } = await authApi.claim({
        displayName: data.displayName.trim(),
        organization: data.organization.trim(),
      });

      setProfile(claimData.user);
      setMemberships(claimData.memberships);

      const mems = claimData.memberships;

      // Normally exactly one membership (the org just claimed into). Fall
      // back to the same multi/zero-membership handling LoginScreen uses,
      // defensively, in case that ever isn't true.
      if (mems.length === 0) {
        setGlobalError('No organization found for your account. Contact your admin.');
        return;
      }
      if (mems.length > 1) {
        router.replace('/(auth)/select-org');
        return;
      }

      selectOrg(mems[0]);
      routeByMembership(mems[0]);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        setGlobalError(apiErrorMessage(err, 'Could not claim your account. Please try again.'));
        return;
      }
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
            <BrandLogo variant="with-name" height={52} style={{ marginBottom: spacing.lg }} />
            <Text style={styles.heroTitle}>Create your account</Text>
            <Text style={styles.heroSubtitle}>
              Claim the account your organization set up for you.
            </Text>
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

            {/* Name field */}
            <Controller
              control={control}
              name="displayName"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Name"
                  placeholder="Your full name"
                  leftIconName="person-outline"
                  autoCapitalize="words"
                  returnKeyType="next"
                  textContentType="name"
                  autoComplete="name"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.displayName?.message}
                />
              )}
            />

            {/* Email field */}
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Email"
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

            {/* Password field */}
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Password"
                  placeholder="••••••••"
                  leftIconName="lock"
                  secureTextEntry={!showPassword}
                  rightIconName={showPassword ? 'visibility' : 'visibility-off'}
                  onRightIconPress={() => setShowPassword((v) => !v)}
                  rightIconColor={showPassword ? brand.blue : palette.textMuted}
                  returnKeyType="next"
                  textContentType="newPassword"
                  autoComplete="password-new"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.password?.message}
                />
              )}
            />

            {/* Organization ID field */}
            <Controller
              control={control}
              name="organization"
              render={({ field: { onChange, onBlur, value } }) => (
                <TextField
                  label="Organization ID"
                  placeholder="e.g. demo-organization-a1b2c3"
                  leftIconName="business"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onChangeText={onChange}
                  onBlur={onBlur}
                  value={value}
                  error={errors.organization?.message}
                  onSubmitEditing={handleSubmit(onSubmit)}
                />
              )}
            />
            <Text style={styles.helperText}>
              Ask your organization admin for your Organization ID.
            </Text>

            {/* Primary CTA */}
            <Button
              label="Create Account"
              loading={isSubmitting}
              onPress={handleSubmit(onSubmit)}
              rightElement={
                !isSubmitting ? (
                  <MaterialIcons name="arrow-forward" size={18} color="#fff" />
                ) : undefined
              }
            />
          </View>

          {/* ── Sign-in link ──────────────────────────────────────────── */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => router.back()}
              hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
              activeOpacity={0.7}
            >
              <Text style={styles.registerLink}>Sign in</Text>
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

    card: {
      width: '100%',
      backgroundColor: palette.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg + 4,
      paddingBottom: spacing.lg,
      gap: spacing.md,
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

    helperText: {
      fontSize: 12,
      color: palette.textMuted,
      marginTop: -spacing.xs,
      marginLeft: 2,
      fontFamily: 'Inter_400Regular',
    },

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
