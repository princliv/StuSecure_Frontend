/**
 * EmergencyScreen — "Emergency Help" screen.
 *
 * Flow:
 *   Idle ──[tap SOS]──► Confirm Modal ──[confirm]──► API call ──► Active Alert
 *                                      └─[cancel]──► Idle
 *   Active Alert ──[cancel request]──► Idle
 *
 * Full dark-mode support via useTheme().
 */

import React, { useCallback, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useRouter } from 'expo-router';
import { emergencyApi } from '@/services/api/emergency.api';
import { useTheme } from '@/hooks/useTheme';
import { brand } from '@/theme/colors';
import type { AppPalette } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import StudentAvatar from '@/components/ui/StudentAvatar';

type ScreenState = 'idle' | 'confirming' | 'sending' | 'active';

// ─── Quick contact data ───────────────────────────────────────────────────────

const CONTACTS = [
  {
    id: 'security',
    name: 'Campus Security',
    subtitle: 'Available 24/7',
    icon: 'local-police' as const,
    iconBgColor: 'rgba(42,105,250,0.15)',
    iconColorValue: brand.blue,
  },
  {
    id: 'health',
    name: 'Health Center',
    subtitle: 'Medical Assistance',
    icon: 'health-and-safety' as const,
    iconBgColor: 'rgba(186,26,26,0.12)',
    iconColorIsError: true,
  },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function EmergencyScreen() {
  const router = useRouter();
  const { palette, statusBarStyle } = useTheme();
  const styles = makeStyles(palette);

  const [state, setState] = useState<ScreenState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Pulse animation for the SOS button rings
  const pulse1 = useRef(new Animated.Value(1)).current;
  const pulse2 = useRef(new Animated.Value(1)).current;
  const pulse1Opacity = useRef(new Animated.Value(0.8)).current;
  const pulse2Opacity = useRef(new Animated.Value(0.6)).current;

  // Modal scale animation
  const modalScale = useRef(new Animated.Value(0.9)).current;
  const modalOpacity = useRef(new Animated.Value(0)).current;

  // Active state fade-in
  const activeFade = useRef(new Animated.Value(0)).current;

  // Start pulsing when component mounts
  React.useEffect(() => {
    const loopPulse = (anim: Animated.Value, opAnim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim, {
              toValue: 1.35,
              duration: 1400,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
            Animated.timing(opAnim, {
              toValue: 0,
              duration: 1400,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.parallel([
            Animated.timing(anim, { toValue: 1, duration: 0, useNativeDriver: true }),
            Animated.timing(opAnim, { toValue: 0.7, duration: 0, useNativeDriver: true }),
          ]),
        ])
      );

    const a1 = loopPulse(pulse1, pulse1Opacity, 0);
    const a2 = loopPulse(pulse2, pulse2Opacity, 700);
    a1.start();
    a2.start();
    return () => {
      a1.stop();
      a2.stop();
    };
  }, []);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const openConfirm = useCallback(() => {
    setState('confirming');
    Animated.parallel([
      Animated.spring(modalScale, { toValue: 1, useNativeDriver: true, tension: 200, friction: 20 }),
      Animated.timing(modalOpacity, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  }, []);

  const closeConfirm = useCallback(() => {
    Animated.parallel([
      Animated.timing(modalScale, { toValue: 0.9, duration: 180, useNativeDriver: true }),
      Animated.timing(modalOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
    ]).start(() => setState('idle'));
  }, []);

  const triggerSOS = useCallback(async () => {
    setState('sending');
    setErrorMsg(null);
    try {
      await emergencyApi.triggerSOS({
        type: 'SOS',
        location: 'North Campus Library, Floor 2',
      });
      activeFade.setValue(0);
      setState('active');
      Animated.timing(activeFade, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (err: any) {
      setState('idle');
      const msg =
        err?.response?.data?.error ?? err?.message ?? 'Failed to send SOS. Please try again.';
      setErrorMsg(msg);
    }
  }, []);

  const cancelActive = useCallback(() => {
    Animated.timing(activeFade, {
      toValue: 0,
      duration: 280,
      useNativeDriver: true,
    }).start(() => setState('idle'));
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar barStyle={statusBarStyle} backgroundColor={palette.surface} />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()} hitSlop={8}>
          <MaterialIcons name="arrow-back" size={24} color={palette.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Emergency Help</Text>
        <StudentAvatar size={32} useHeadshot />
      </View>

      {/* ── Main scroll ─────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Title + subtitle */}
        <View style={styles.titleSection}>
          <Text style={styles.screenTitle}>Emergency Help</Text>
          <Text style={styles.screenSubtitle}>
            Tap the button below for immediate assistance.{'\n'}Your location will be shared
            automatically.
          </Text>
        </View>

        {/* ── SOS Button ────────────────────────────────────────────────── */}
        <View style={styles.sosContainer}>
          <Animated.View
            style={[
              styles.ring,
              styles.ring1,
              { transform: [{ scale: pulse1 }], opacity: pulse1Opacity },
            ]}
          />
          <Animated.View
            style={[
              styles.ring,
              styles.ring2,
              { transform: [{ scale: pulse2 }], opacity: pulse2Opacity },
            ]}
          />

          <TouchableOpacity
            style={[styles.sosButton, state === 'sending' && styles.sosButtonDisabled]}
            onPress={openConfirm}
            disabled={state === 'sending' || state === 'active'}
            activeOpacity={0.85}
          >
            <MaterialIcons name="sos" size={56} color={palette.onError} />
            <Text style={styles.sosLabel}>GET HELP</Text>
          </TouchableOpacity>
        </View>

        {/* Error message */}
        {errorMsg && (
          <View style={styles.errorBanner}>
            <MaterialIcons name="error-outline" size={16} color={palette.error} />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        {/* ── Location Card ─────────────────────────────────────────────── */}
        <View style={styles.locationCard}>
          <View style={styles.locationIconWrap}>
            <MaterialIcons name="my-location" size={22} color={palette.textMuted} />
          </View>
          <View style={styles.locationText}>
            <Text style={styles.locationLabel}>CURRENT LOCATION</Text>
            <Text style={styles.locationValue}>North Campus Library, Floor 2</Text>
          </View>
        </View>

        {/* ── Quick Contacts ────────────────────────────────────────────── */}
        <View style={styles.contactsSection}>
          <Text style={styles.contactsHeading}>Quick Contacts</Text>
          <View style={styles.contactsList}>
            {CONTACTS.map((c) => (
              <TouchableOpacity key={c.id} style={styles.contactCard} activeOpacity={0.8}>
                <View style={styles.contactLeft}>
                  <View style={[styles.contactIconWrap, { backgroundColor: c.iconBgColor }]}>
                    <MaterialIcons
                      name={c.icon}
                      size={22}
                      color={'iconColorIsError' in c && c.iconColorIsError ? palette.error : c.iconColorValue}
                    />
                  </View>
                  <View>
                    <Text style={styles.contactName}>{c.name}</Text>
                    <Text style={styles.contactSub}>{c.subtitle}</Text>
                  </View>
                </View>
                <MaterialIcons name="call" size={22} color={palette.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* ── Confirm Modal ────────────────────────────────────────────────── */}
      <Modal
        visible={state === 'confirming' || state === 'sending'}
        transparent
        animationType="none"
        onRequestClose={closeConfirm}
        statusBarTranslucent
      >
        <Pressable style={styles.modalBackdrop} onPress={closeConfirm}>
          <Animated.View
            style={[
              styles.modalCard,
              { transform: [{ scale: modalScale }], opacity: modalOpacity },
            ]}
          >
            <Pressable onPress={() => {}}>
              <View style={styles.modalIconWrap}>
                <MaterialIcons name="warning" size={32} color={palette.error} />
              </View>
              <Text style={styles.modalTitle}>Confirm Alert</Text>
              <Text style={styles.modalBody}>
                Are you sure you want to trigger a campus-wide emergency alert? Security will be
                dispatched to your location.
              </Text>
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.modalBtnCancel]}
                  onPress={closeConfirm}
                  disabled={state === 'sending'}
                >
                  <Text style={styles.modalBtnCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.modalBtn,
                    styles.modalBtnConfirm,
                    state === 'sending' && styles.sosButtonDisabled,
                  ]}
                  onPress={triggerSOS}
                  disabled={state === 'sending'}
                >
                  {state === 'sending' ? (
                    <MaterialIcons name="refresh" size={18} color={palette.onError} />
                  ) : (
                    <MaterialIcons name="send" size={18} color={palette.onError} />
                  )}
                  <Text style={styles.modalBtnConfirmText}>
                    {state === 'sending' ? 'Sending…' : 'Send Alert'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

      {/* ── Active Alert Overlay ─────────────────────────────────────────── */}
      {state === 'active' && (
        <Animated.View style={[styles.activeOverlay, { opacity: activeFade }]}>
          <SafeAreaView style={styles.activeInner} edges={['top', 'bottom']}>
            <ScrollView
              contentContainerStyle={styles.activeScroll}
              showsVerticalScrollIndicator={false}
            >
              {/* Sending icon with pulse */}
              <View style={styles.activeIconContainer}>
                <Animated.View style={styles.activeRing} />
                <View style={styles.activeIconCircle}>
                  <MaterialIcons name="cell-wifi" size={48} color={palette.onError} />
                </View>
              </View>

              <Text style={styles.activeHeadline}>{'Help is on\nthe way'}</Text>
              <Text style={styles.activeSubtext}>
                Stay calm and remain in your location if it is safe to do so.
              </Text>

              {/* ETA Card */}
              <View style={styles.etaCard}>
                <Text style={styles.etaLabel}>ESTIMATED ARRIVAL</Text>
                <View style={styles.etaRow}>
                  <Text style={styles.etaNumber}>3</Text>
                  <Text style={styles.etaUnit}>minutes</Text>
                </View>
                <View style={styles.etaProgressTrack}>
                  <View style={styles.etaProgressBar} />
                </View>
              </View>

              {/* Responding officer */}
              <View style={styles.officerCard}>
                <View style={styles.officerAvatar}>
                  <MaterialIcons name="person" size={24} color={palette.textMuted} />
                </View>
                <View style={styles.officerInfo}>
                  <Text style={styles.officerLabel}>Responding Officer</Text>
                  <Text style={styles.officerName}>Officer J. Davis</Text>
                </View>
                <TouchableOpacity style={styles.officerCallBtn}>
                  <MaterialIcons name="call" size={20} color={palette.onError} />
                </TouchableOpacity>
              </View>
            </ScrollView>

            {/* Cancel button */}
            <View style={styles.cancelWrap}>
              <TouchableOpacity style={styles.cancelActiveBtn} onPress={cancelActive}>
                <Text style={styles.cancelActiveBtnText}>Cancel Request</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

// ─── Styles factory ───────────────────────────────────────────────────────────

const SOS_BTN = 192;
const SOS_RING1 = SOS_BTN + 64;
const SOS_RING2 = SOS_BTN + 32;

function makeStyles(palette: AppPalette) {
  const RING1_COLOR = 'rgba(186,26,26,0.10)';
  const RING2_COLOR = 'rgba(186,26,26,0.20)';
  const SURFACE_CONTAINER = palette.surfaceContainer;
  const SURFACE_CONTAINER_LOW = palette.surfaceContainerLow;

  return StyleSheet.create({
    safeArea: {
      flex: 1,
      backgroundColor: palette.surface,
    },

    // ── Header
    header: {
      height: 64,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.md,
      backgroundColor: palette.surface,
      borderBottomWidth: 1,
      borderBottomColor: palette.border,
      ...Platform.select({
        android: { elevation: 2 },
        ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4 },
      }),
    },
    backButton: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '600',
      color: palette.textPrimary,
      fontFamily: 'Inter_600SemiBold',
    },

    // ── Scroll
    scroll: { flex: 1 },
    scrollContent: {
      paddingBottom: spacing.xl,
      flexGrow: 1,
    },

    // ── Title section
    titleSection: {
      alignItems: 'center',
      paddingTop: spacing.xl,
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.lg,
    },
    screenTitle: {
      fontSize: 26,
      fontWeight: '700',
      color: palette.textPrimary,
      marginBottom: spacing.xs,
      textAlign: 'center',
      fontFamily: 'Inter_700Bold',
    },
    screenSubtitle: {
      fontSize: 14,
      lineHeight: 20,
      color: palette.textMuted,
      textAlign: 'center',
      maxWidth: 280,
      fontFamily: 'Inter_400Regular',
    },

    // ── SOS button
    sosContainer: {
      width: SOS_RING1,
      height: SOS_RING1,
      alignSelf: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xl,
      marginTop: spacing.sm,
    },
    ring: {
      position: 'absolute',
      borderRadius: radius.full,
      backgroundColor: RING1_COLOR,
    },
    ring1: {
      width: SOS_RING1,
      height: SOS_RING1,
    },
    ring2: {
      width: SOS_RING2,
      height: SOS_RING2,
      backgroundColor: RING2_COLOR,
    },
    sosButton: {
      width: SOS_BTN,
      height: SOS_BTN,
      borderRadius: SOS_BTN / 2,
      backgroundColor: palette.error,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: palette.error,
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.35,
          shadowRadius: 16,
        },
        android: { elevation: 10 },
      }),
    },
    sosButtonDisabled: {
      opacity: 0.65,
    },
    sosLabel: {
      fontSize: 13,
      fontWeight: '700',
      color: palette.onError,
      letterSpacing: 1.4,
      marginTop: spacing.xs,
      fontFamily: 'Inter_700Bold',
    },

    // ── Error banner
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      backgroundColor: palette.errorContainer,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.lg,
    },
    errorText: {
      flex: 1,
      fontSize: 13,
      color: palette.error,
      lineHeight: 18,
      fontFamily: 'Inter_400Regular',
    },

    // ── Location card
    locationCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      marginHorizontal: spacing.md,
      backgroundColor: SURFACE_CONTAINER,
      borderRadius: radius.xl,
      padding: spacing.md,
      marginBottom: spacing.xl,
    },
    locationIconWrap: {
      width: 48,
      height: 48,
      borderRadius: radius.lg,
      backgroundColor: palette.surfaceVariant,
      alignItems: 'center',
      justifyContent: 'center',
    },
    locationText: { flex: 1 },
    locationLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: palette.textMuted,
      letterSpacing: 0.8,
      marginBottom: 2,
      textTransform: 'uppercase',
      fontFamily: 'Inter_600SemiBold',
    },
    locationValue: {
      fontSize: 14,
      fontWeight: '500',
      color: palette.textPrimary,
      fontFamily: 'Inter_500Medium',
    },

    // ── Quick contacts
    contactsSection: {
      backgroundColor: SURFACE_CONTAINER_LOW,
      borderTopLeftRadius: radius.xxl,
      borderTopRightRadius: radius.xxl,
      paddingTop: spacing.lg,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.xl,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
        },
        android: { elevation: 3 },
      }),
    },
    contactsHeading: {
      fontSize: 17,
      fontWeight: '600',
      color: palette.textPrimary,
      marginBottom: spacing.md,
      paddingLeft: spacing.xs,
      fontFamily: 'Inter_600SemiBold',
    },
    contactsList: { gap: spacing.sm },
    contactCard: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: palette.surface,
      borderRadius: radius.xl,
      padding: spacing.md,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.06,
          shadowRadius: 4,
        },
        android: { elevation: 1 },
      }),
    },
    contactLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    contactIconWrap: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
    },
    contactName: {
      fontSize: 14,
      fontWeight: '500',
      color: palette.textPrimary,
      fontFamily: 'Inter_500Medium',
    },
    contactSub: {
      fontSize: 12,
      color: palette.textMuted,
      marginTop: 1,
      fontFamily: 'Inter_400Regular',
    },

    // ── Confirm Modal
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(48,48,50,0.60)',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
    },
    modalCard: {
      width: '100%',
      maxWidth: 380,
      backgroundColor: palette.surface,
      borderRadius: radius.xxl + 4,
      padding: spacing.lg,
      ...Platform.select({
        ios: {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 16 },
          shadowOpacity: 0.25,
          shadowRadius: 32,
        },
        android: { elevation: 20 },
      }),
    },
    modalIconWrap: {
      width: 64,
      height: 64,
      borderRadius: radius.full,
      backgroundColor: palette.errorContainer,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    modalTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: palette.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.xs,
      fontFamily: 'Inter_700Bold',
    },
    modalBody: {
      fontSize: 14,
      lineHeight: 20,
      color: palette.textMuted,
      textAlign: 'center',
      marginBottom: spacing.lg,
      fontFamily: 'Inter_400Regular',
    },
    modalActions: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    modalBtn: {
      flex: 1,
      paddingVertical: spacing.sm + 4,
      paddingHorizontal: spacing.md,
      borderRadius: radius.xl,
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'row',
      gap: spacing.xs,
    },
    modalBtnCancel: {
      backgroundColor: SURFACE_CONTAINER,
    },
    modalBtnCancelText: {
      fontSize: 14,
      fontWeight: '500',
      color: palette.textPrimary,
      fontFamily: 'Inter_500Medium',
    },
    modalBtnConfirm: {
      backgroundColor: palette.error,
    },
    modalBtnConfirmText: {
      fontSize: 14,
      fontWeight: '500',
      color: palette.onError,
      fontFamily: 'Inter_500Medium',
    },

    // ── Active alert overlay
    activeOverlay: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: palette.surface,
      zIndex: 90,
    },
    activeInner: {
      flex: 1,
    },
    activeScroll: {
      flexGrow: 1,
      paddingTop: spacing.xl,
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
      alignItems: 'center',
    },
    activeIconContainer: {
      width: 128,
      height: 128,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    activeRing: {
      position: 'absolute',
      width: 128,
      height: 128,
      borderRadius: radius.full,
      backgroundColor: RING2_COLOR,
    },
    activeIconCircle: {
      width: 96,
      height: 96,
      borderRadius: radius.full,
      backgroundColor: palette.error,
      alignItems: 'center',
      justifyContent: 'center',
      ...Platform.select({
        ios: {
          shadowColor: palette.error,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.3,
          shadowRadius: 12,
        },
        android: { elevation: 8 },
      }),
    },
    activeHeadline: {
      fontSize: 28,
      fontWeight: '700',
      color: palette.error,
      textAlign: 'center',
      lineHeight: 36,
      marginBottom: spacing.sm,
      fontFamily: 'Inter_700Bold',
    },
    activeSubtext: {
      fontSize: 15,
      lineHeight: 22,
      color: palette.textMuted,
      textAlign: 'center',
      marginBottom: spacing.xl,
      maxWidth: 300,
      fontFamily: 'Inter_400Regular',
    },
    etaCard: {
      width: '100%',
      backgroundColor: SURFACE_CONTAINER,
      borderRadius: radius.xxl,
      padding: spacing.lg,
      marginBottom: spacing.md,
    },
    etaLabel: {
      fontSize: 11,
      fontWeight: '600',
      color: palette.textMuted,
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      marginBottom: spacing.xs,
      fontFamily: 'Inter_600SemiBold',
    },
    etaRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    etaNumber: {
      fontSize: 40,
      fontWeight: '800',
      color: palette.textPrimary,
      lineHeight: 44,
      fontFamily: 'Inter_700Bold',
    },
    etaUnit: {
      fontSize: 15,
      fontWeight: '500',
      color: palette.textMuted,
      marginBottom: 4,
      fontFamily: 'Inter_500Medium',
    },
    etaProgressTrack: {
      height: 8,
      backgroundColor: palette.surfaceVariant,
      borderRadius: radius.full,
      overflow: 'hidden',
    },
    etaProgressBar: {
      width: '25%',
      height: '100%',
      backgroundColor: palette.error,
      borderRadius: radius.full,
    },
    officerCard: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      backgroundColor: palette.surfaceVariant,
      borderRadius: radius.xxl,
      padding: spacing.md,
    },
    officerAvatar: {
      width: 48,
      height: 48,
      borderRadius: radius.full,
      backgroundColor: palette.surfaceContainer,
      alignItems: 'center',
      justifyContent: 'center',
    },
    officerInfo: { flex: 1 },
    officerLabel: {
      fontSize: 11,
      color: palette.textMuted,
      marginBottom: 2,
      fontWeight: '500',
      fontFamily: 'Inter_500Medium',
    },
    officerName: {
      fontSize: 14,
      fontWeight: '500',
      color: palette.textPrimary,
      fontFamily: 'Inter_500Medium',
    },
    officerCallBtn: {
      width: 40,
      height: 40,
      borderRadius: radius.full,
      backgroundColor: brand.blue,
      alignItems: 'center',
      justifyContent: 'center',
    },

    // ── Cancel active
    cancelWrap: {
      paddingHorizontal: spacing.md,
      paddingBottom: spacing.md,
    },
    cancelActiveBtn: {
      paddingVertical: spacing.md,
      borderRadius: radius.xl,
      backgroundColor: palette.surfaceVariant,
      alignItems: 'center',
    },
    cancelActiveBtnText: {
      fontSize: 14,
      fontWeight: '500',
      color: palette.textPrimary,
      fontFamily: 'Inter_500Medium',
    },
  });
}
