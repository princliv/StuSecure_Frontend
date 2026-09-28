/**
 * AcceptInviteScreen — Group G1 pass 4.
 *
 * Deep-linkable at `stusecurefrontend://accept-invite/<token>` (Expo Router
 * derives this automatically from the file path
 * `app/(auth)/accept-invite/[token].tsx`) and reachable in-app via
 * `router.push('/(auth)/accept-invite/' + token)`.
 *
 * Flow:
 *  1. On mount, preview the invite (public `GET /invites/:token`).
 *  2. If the invite isn't PENDING, show a terminal message + "Back to
 *     Login" link — no further action possible.
 *  3. If PENDING and the user is already Firebase-authenticated, show a
 *     single "Join <org>" button.
 *  4. If PENDING and not authenticated, show a minimal email/password form
 *     that tries Firebase sign-in first, falling back to sign-up.
 *  5. Either path ends with `POST /invites/:token/accept`, updating the
 *     auth store the same way `AppProvider`'s `AuthBootstrap` and
 *     `LoginScreen` do, then `routeByMembership()`.
 *
 * Visual style mirrors `select-org.tsx` (same card/spacing/color
 * conventions, same error-banner pattern).
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { useTheme } from '@/hooks/useTheme';
import { brand, type AppPalette } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import BrandLogo from '@/components/ui/BrandLogo';
import Button from '@/components/ui/Button';
import TextField from '@/components/ui/TextField';
import { useAuthStore } from '@/store/auth.store';
import { previewInvite, acceptInvite, type InvitePreview } from '@/features/auth/invites.api';
import { routeByMembership } from '@/features/auth/routeByMembership';
import { firebaseAuth } from '@/services/firebase/auth';
import { setAuthToken } from '@/services/api/client';

const ROLE_ICON: Record<string, React.ComponentProps<typeof MaterialIcons>['name']> = {
  STUDENT: 'school',
  GUARD: 'security',
  FACULTY: 'co-present',
  ADMIN: 'admin-panel-settings',
};

const TERMINAL_MESSAGES: Record<string, string> = {
  ACCEPTED: 'This invite has already been accepted.',
  REVOKED: 'This invite has been revoked by the organization.',
  EXPIRED: 'This invite has expired. Ask your administrator for a new one.',
};

// ─── Sign-in / sign-up form schema ──────────────────────────────────────────

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

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
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    default:
      return 'Sign-in failed. Please try again.';
  }
}

function firebaseErrorCode(err: unknown): string {
  return err != null && typeof err === 'object' && 'code' in err
    ? String((err as { code: unknown }).code)
    : '';
}

export default function AcceptInviteScreen() {
  const { palette, statusBarStyle } = useTheme();
  const styles = makeStyles(palette);

  const { token: rawToken } = useLocalSearchParams<{ token: string }>();
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const { setProfile, setMemberships, selectOrg } = useAuthStore();

  const [loadingPreview, setLoadingPreview] = useState(true);
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!token) {
        setPreviewError('This invite link is missing a token.');
        setLoadingPreview(false);
        return;
      }
      try {
        const result = await previewInvite(token);
        if (cancelled) return;
        setPreview(result);
      } catch {
        if (cancelled) return;
        setPreviewError('This invite is invalid or has expired.');
      } finally {
        if (!cancelled) setLoadingPreview(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (preview?.email) {
      reset({ email: preview.email, password: '' });
    }
  }, [preview?.email, reset]);

  const finishAccept = async () => {
    if (!token) return;
    setError(null);
    setJoining(true);
    try {
      const data = await acceptInvite(token);
      setProfile(data.user);
      setMemberships(data.memberships);

      const activeMembership =
        data.memberships.find(
          (m) => m.organizationName === preview?.organizationName && m.role === preview?.role,
        ) ?? data.memberships[data.memberships.length - 1] ?? data.memberships[0];

      if (!activeMembership) {
        setError('Could not join the organization. Please try again.');
        return;
      }

      selectOrg(activeMembership);
      routeByMembership(activeMembership);
    } catch {
      setError('Could not accept this invite. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setError(null);
    const email = data.email.trim();

    try {
      const credential = await firebaseAuth.signIn(email, data.password);
      const idToken = await firebaseAuth.getIdToken(credential.user);
      setAuthToken(idToken);
    } catch (signInErr) {
      // Sign-in failed — try creating a fresh account instead.
      try {
        const credential = await firebaseAuth.signUp(email, data.password);
        const idToken = await firebaseAuth.getIdToken(credential.user);
        setAuthToken(idToken);
      } catch (signUpErr) {
        const signUpCode = firebaseErrorCode(signUpErr);
        if (signUpCode === 'auth/email-already-in-use') {
          setError('An account already exists for this email. Check your password and try again.');
        } else {
          setError(friendlyFirebaseError(signUpCode || firebaseErrorCode(signInErr)));
        }
        return;
      }
    }

    await finishAccept();
  };

  const handleBackToLogin = () => router.replace('/(auth)/login');

  // ── Loading state ────────────────────────────────────────────────────────
  if (loadingPreview) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar barStyle={statusBarStyle} backgroundColor={palette.background} />
        <View style={styles.centerFill}>
          <ActivityIndicator size="large" color={brand.blue} />
        </View>
      </SafeAreaView>
    );
  }

  // ── Preview failed (invalid/unknown token) ──────────────────────────────
  if (previewError || !preview) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar barStyle={statusBarStyle} backgroundColor={palette.background} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.heroSection}>
            <BrandLogo height={44} style={{ marginBottom: spacing.lg }} />
            <Text style={styles.heroTitle}>Invite unavailable</Text>
          </View>
          <View style={styles.errorBanner}>
            <MaterialIcons name="error-outline" size={16} color={palette.error} />
            <Text style={styles.errorBannerText}>
              {previewError ?? 'This invite is invalid or has expired.'}
            </Text>
          </View>
          <TouchableOpacity style={styles.backLink} onPress={handleBackToLogin} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={16} color={palette.textMuted} />
            <Text style={styles.backLinkText}>Back to Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── Preview OK, but invite is no longer actionable ──────────────────────
  if (preview.status !== 'PENDING') {
    const message = TERMINAL_MESSAGES[preview.status] ?? 'This invite can no longer be used.';
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar barStyle={statusBarStyle} backgroundColor={palette.background} />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.heroSection}>
            <BrandLogo height={44} style={{ marginBottom: spacing.lg }} />
            <Text style={styles.heroTitle}>Invite unavailable</Text>
          </View>

          <View style={styles.listCard}>
            <View style={styles.cardTopStripe} />
            <View style={styles.detailsPad}>
              <Text style={styles.orgName}>{preview.organizationName}</Text>
              <Text style={styles.orgRole}>{preview.role}</Text>
              <Text style={styles.orgEmail}>{preview.email}</Text>
            </View>
          </View>

          <View style={styles.errorBanner}>
            <MaterialIcons name="error-outline" size={16} color={palette.error} />
            <Text style={styles.errorBannerText}>{message}</Text>
          </View>

          <TouchableOpacity style={styles.backLink} onPress={handleBackToLogin} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={16} color={palette.textMuted} />
            <Text style={styles.backLinkText}>Back to Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── PENDING invite — actionable ──────────────────────────────────────────
  const iconName = ROLE_ICON[preview.role?.toUpperCase()] ?? 'business';

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
          <View style={styles.heroSection}>
            <BrandLogo height={44} style={{ marginBottom: spacing.lg }} />
            <Text style={styles.heroTitle}>You're invited</Text>
            <Text style={styles.heroSubtitle}>
              Join {preview.organizationName} on StuSecure.
            </Text>
          </View>

          {error ? (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error-outline" size={16} color={palette.error} />
              <Text style={styles.errorBannerText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.listCard}>
            <View style={styles.cardTopStripe} />
            <View style={styles.orgRow}>
              <View style={styles.orgIconWrap}>
                <MaterialIcons name={iconName} size={22} color={brand.blue} />
              </View>
              <View style={styles.orgText}>
                <Text style={styles.orgName}>{preview.organizationName}</Text>
                <Text style={styles.orgRole}>{preview.role}</Text>
                <Text style={styles.orgEmail}>{preview.email}</Text>
              </View>
            </View>
          </View>

          {firebaseUser ? (
            <Button
              label={joining ? 'Joining…' : `Join ${preview.organizationName}`}
              loading={joining}
              onPress={finishAccept}
              style={{ marginTop: spacing.lg }}
              rightElement={
                !joining ? <MaterialIcons name="arrow-forward" size={18} color="#fff" /> : undefined
              }
            />
          ) : (
            <View style={[styles.formCard]}>
              <Controller
                control={control}
                name="email"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    label="Email"
                    placeholder="you@example.com"
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

              <Controller
                control={control}
                name="password"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextField
                    label="Password"
                    placeholder="••••••••"
                    leftIconName="lock"
                    secureTextEntry
                    returnKeyType="done"
                    textContentType="password"
                    autoComplete="password"
                    onChangeText={onChange}
                    onBlur={onBlur}
                    value={value}
                    error={errors.password?.message}
                    onSubmitEditing={handleSubmit(onSubmit)}
                  />
                )}
              />

              <Text style={styles.helperText}>
                Enter your existing password to sign in, or choose one to create a new
                account for this email.
              </Text>

              <Button
                label="Continue"
                loading={isSubmitting || joining}
                onPress={handleSubmit(onSubmit)}
                style={{ marginTop: spacing.sm }}
                rightElement={
                  !(isSubmitting || joining) ? (
                    <MaterialIcons name="arrow-forward" size={18} color="#fff" />
                  ) : undefined
                }
              />
            </View>
          )}

          <TouchableOpacity style={styles.backLink} onPress={handleBackToLogin} activeOpacity={0.7}>
            <MaterialIcons name="arrow-back" size={16} color={palette.textMuted} />
            <Text style={styles.backLinkText}>Back to Login</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const SIDE_MARGIN = 20;

function makeStyles(palette: AppPalette) {
  return StyleSheet.create({
    flex: { flex: 1 },

    safeArea: {
      flex: 1,
      backgroundColor: palette.background,
    },

    centerFill: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
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

    // ── Error banner ──────────────────────────────────────────────────────────

    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: palette.errorContainer,
      borderRadius: radius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
      width: '100%',
    },
    errorBannerText: {
      flex: 1,
      fontSize: 13,
      color: palette.error,
      fontFamily: 'Inter_400Regular',
    },

    // ── Invite details card ──────────────────────────────────────────────────

    listCard: {
      width: '100%',
      backgroundColor: palette.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: palette.border,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 16,
      elevation: 4,
      marginBottom: spacing.md,
    },

    cardTopStripe: {
      height: 3,
      backgroundColor: brand.blue,
    },

    detailsPad: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },

    orgRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
      gap: spacing.md,
    },

    orgIconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.md,
      backgroundColor: palette.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },

    orgText: {
      flex: 1,
    },
    orgName: {
      fontSize: 15,
      fontWeight: '600',
      color: palette.textPrimary,
      fontFamily: 'Inter_600SemiBold',
    },
    orgRole: {
      fontSize: 12,
      color: palette.textMuted,
      fontFamily: 'Inter_400Regular',
      marginTop: 2,
    },
    orgEmail: {
      fontSize: 12,
      color: palette.textMuted,
      fontFamily: 'Inter_400Regular',
      marginTop: 2,
    },

    // ── Sign-in/sign-up form ──────────────────────────────────────────────────

    formCard: {
      width: '100%',
      backgroundColor: palette.surface,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: palette.border,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.lg,
      gap: spacing.md,
    },
    helperText: {
      fontSize: 12,
      color: palette.textMuted,
      fontFamily: 'Inter_400Regular',
    },

    // ── Back link ─────────────────────────────────────────────────────────────

    backLink: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.xl,
    },
    backLinkText: {
      fontSize: 14,
      color: palette.textMuted,
      fontFamily: 'Inter_400Regular',
    },
  });
}
