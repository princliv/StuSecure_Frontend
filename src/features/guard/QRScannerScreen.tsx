/**
 * QRScannerScreen — Guard camera-based QR code scanner.
 *
 * Layout (top → bottom, layered over full-screen camera):
 *   1. Sticky header   – back chevron + BrandLogo + "Guard Scan" title + avatar
 *   2. Full-screen CameraView (expo-camera CameraView)
 *   3. Darkened overlay with transparent scan-frame cutout
 *   4. Blue corner brackets at the four scan-frame corners
 *   5. Animated blue scan line bouncing inside the frame
 *   6. Instruction pill below the frame
 *   7. Last-scan preview card (shows most recent successful scan)
 *   8. Bottom action row: torch toggle | manual entry | gallery (placeholder)
 *
 * On successful QR scan → router.push('/(guard)/scan-result', { token })
 *
 * Camera overlay stays dark; header chrome is themed via useTheme().
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@/hooks/useTheme';
import { brand } from '@/theme/colors';
import type { AppPalette } from '@/theme/colors';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';
import BrandLogo from '@/components/ui/BrandLogo';
import StudentAvatar from '@/components/ui/StudentAvatar';

// ─── Design tokens ────────────────────────────────────────────────────────────

/** Brand blue matches Stitch secondary: #0050d7 */
const BLUE = brand.blue;           // #155EEF — matches brand token
const FRAME_SIZE = 256;            // scan frame size (px)
const HEADER_HEIGHT = 56;

// ─── Animated scan line ───────────────────────────────────────────────────────

function ScanLine({ size }: { size: number }) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: size - 4,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [translateY, size]);

  return (
    <Animated.View
      style={[
        scanLineStyles.line,
        { transform: [{ translateY }] },
      ]}
      pointerEvents="none"
    />
  );
}

const scanLineStyles = StyleSheet.create({
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: BLUE,
    shadowColor: BLUE,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
    opacity: 0.75,
  },
});

// ─── Corner brackets ──────────────────────────────────────────────────────────

function CornerBrackets() {
  const ARM = 28;
  const T   = 4;
  const R   = 6;

  type CornerStyle = {
    top?: number; bottom?: number; left?: number; right?: number;
    borderTopWidth?: number; borderBottomWidth?: number;
    borderLeftWidth?: number; borderRightWidth?: number;
    borderTopLeftRadius?: number; borderTopRightRadius?: number;
    borderBottomLeftRadius?: number; borderBottomRightRadius?: number;
  };

  const corners: CornerStyle[] = [
    { top: 0, left: 0, borderTopWidth: T, borderLeftWidth: T, borderTopLeftRadius: R },
    { top: 0, right: 0, borderTopWidth: T, borderRightWidth: T, borderTopRightRadius: R },
    { bottom: 0, left: 0, borderBottomWidth: T, borderLeftWidth: T, borderBottomLeftRadius: R },
    { bottom: 0, right: 0, borderBottomWidth: T, borderRightWidth: T, borderBottomRightRadius: R },
  ];

  return (
    <>
      {corners.map((c, i) => (
        <View
          key={i}
          style={[
            {
              position: 'absolute',
              width: ARM,
              height: ARM,
              borderColor: BLUE,
              shadowColor: BLUE,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.55,
              shadowRadius: 6,
            },
            c,
          ]}
        />
      ))}
    </>
  );
}

// ─── Dimmed overlay with transparent window ───────────────────────────────────

function ScanOverlay({ frameSize }: { frameSize: number }) {
  const { width: W, height: H } = Dimensions.get('window');
  const DIM = 'rgba(0,0,0,0.60)';
  const fX = (W - frameSize) / 2;
  const fY = (H - frameSize) / 2;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: fY, backgroundColor: DIM }} />
      <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, top: fY + frameSize, backgroundColor: DIM }} />
      <View style={{ position: 'absolute', top: fY, left: 0, width: fX, height: frameSize, backgroundColor: DIM }} />
      <View style={{ position: 'absolute', top: fY, right: 0, left: fX + frameSize, height: frameSize, backgroundColor: DIM }} />
    </View>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface LastScan {
  label: string;
  token: string;
  valid: boolean;
}

// ─── Permission denied UI ─────────────────────────────────────────────────────

function PermissionDenied({ onRequest }: { onRequest: () => void }) {
  const { palette } = useTheme();
  return (
    <View style={[permStyles.container, { backgroundColor: palette.background }]}>
      <MaterialIcons name="no-photography" size={56} color={palette.textMuted} />
      <Text style={[permStyles.title, { color: palette.textPrimary }]}>Camera access needed</Text>
      <Text style={[permStyles.body, { color: palette.textMuted }]}>
        StuSecure needs camera permission to scan student QR codes. Please grant
        access to continue.
      </Text>
      <TouchableOpacity style={permStyles.btn} onPress={onRequest} activeOpacity={0.8}>
        <Text style={permStyles.btnLabel}>Grant Permission</Text>
      </TouchableOpacity>
    </View>
  );
}

const permStyles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
    textAlign: 'center',
  },
  body: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    fontFamily: 'Inter_400Regular',
    maxWidth: 300,
  },
  btn: {
    marginTop: spacing.sm,
    backgroundColor: BLUE,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.full,
  },
  btnLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});

// ─── Manual entry bar ─────────────────────────────────────────────────────────

function ManualEntryBar({
  onSubmit,
  onDismiss,
}: {
  onSubmit: (token: string) => void;
  onDismiss: () => void;
}) {
  const [value, setValue] = useState('');
  const { palette } = useTheme();

  return (
    <View style={meStyles.bar}>
      <TextInput
        style={[meStyles.input, { color: palette.textPrimary }]}
        placeholder="Paste or type token…"
        placeholderTextColor={palette.textMuted}
        value={value}
        onChangeText={setValue}
        autoFocus
        returnKeyType="go"
        onSubmitEditing={() => value.trim() && onSubmit(value.trim())}
      />
      <TouchableOpacity
        style={meStyles.goBtn}
        onPress={() => value.trim() && onSubmit(value.trim())}
        activeOpacity={0.8}
      >
        <Text style={meStyles.goBtnLabel}>Go</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDismiss} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <MaterialIcons name="close" size={20} color={palette.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const meStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.xl,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    paddingVertical: Platform.OS === 'ios' ? spacing.xs : 0,
  },
  goBtn: {
    backgroundColor: BLUE,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.lg,
  },
  goBtnLabel: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
});

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function QRScannerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { palette } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();

  const [torchOn, setTorchOn] = useState(false);
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [lastScan, setLastScan] = useState<LastScan | null>(null);
  const [scanning, setScanning] = useState(true);

  const cooldown = useRef(false);

  const handleScan = useCallback(
    (token: string) => {
      if (!scanning || cooldown.current) return;
      cooldown.current = true;
      setScanning(false);

      setLastScan({ label: token.slice(0, 20), token, valid: true });

      router.push({ pathname: '/(guard)/scan-result', params: { token } });

      const t = setTimeout(() => {
        cooldown.current = false;
        setScanning(true);
      }, 2500);

      return () => clearTimeout(t);
    },
    [scanning, router],
  );

  const handleManualSubmit = useCallback(
    (token: string) => {
      setManualEntryOpen(false);
      handleScan(token);
    },
    [handleScan],
  );

  // ── Permission not yet determined ─────────────────────────────────────────
  if (!permission) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  // ── Permission denied ─────────────────────────────────────────────────────
  if (!permission.granted) {
    return (
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <PermissionDenied onRequest={requestPermission} />
      </SafeAreaView>
    );
  }

  // ── Camera active ─────────────────────────────────────────────────────────
  const { width: W, height: H } = Dimensions.get('window');
  const fX = (W - FRAME_SIZE) / 2;
  const fY = (H - FRAME_SIZE) / 2;

  return (
    <View style={styles.root}>
      {/* ── Full-screen camera ──────────────────────────────────────────── */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        enableTorch={torchOn}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={scanning ? (e) => handleScan(e.data) : undefined}
      />

      {/* ── Dark overlay ────────────────────────────────────────────────── */}
      <ScanOverlay frameSize={FRAME_SIZE} />

      {/* ── Scan frame: corner brackets + scan line ─────────────────────── */}
      <View
        style={[
          styles.frame,
          { width: FRAME_SIZE, height: FRAME_SIZE, left: fX, top: fY },
        ]}
        pointerEvents="none"
      >
        <CornerBrackets />
        <ScanLine size={FRAME_SIZE} />
      </View>

      {/* ── Instruction pill ────────────────────────────────────────────── */}
      <View
        style={[styles.instructionWrap, { top: fY + FRAME_SIZE + spacing.xl }]}
        pointerEvents="none"
      >
        <Text style={styles.instructionText}>Align the QR code inside the frame</Text>
      </View>

      {/* ── Header (themed chrome over camera) ──────────────────────────── */}
      <SafeAreaView
        edges={['top']}
        style={styles.headerSafe}
        pointerEvents="box-none"
      >
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerIconBtn}
            onPress={() => router.canGoBack() ? router.back() : undefined}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>

          <View style={styles.headerTitleRow}>
            <BrandLogo variant="icon" size={24} />
            <Text style={styles.headerTitle}>Guard Scan</Text>
          </View>

          {/* Initials avatar OK for guard */}
          <StudentAvatar size={32} useHeadshot={false} initials="GD"
            style={{ borderColor: 'rgba(255,255,255,0.5)' }}
          />
        </View>
      </SafeAreaView>

      {/* ── Bottom controls ──────────────────────────────────────────────── */}
      <View
        style={[
          styles.bottomControls,
          { paddingBottom: insets.bottom + spacing.md },
        ]}
      >
        {/* Last scan preview */}
        {lastScan && (
          <TouchableOpacity
            style={styles.lastScanCard}
            onPress={() =>
              router.push({ pathname: '/(guard)/scan-result', params: { token: lastScan.token } })
            }
            activeOpacity={0.85}
          >
            <View style={styles.lastScanIcon}>
              <MaterialIcons
                name="check-circle"
                size={22}
                color={lastScan.valid ? BLUE : palette.error}
              />
            </View>
            <View style={styles.lastScanInfo}>
              <Text style={styles.lastScanLabel}>Last Scan</Text>
              <Text style={styles.lastScanValue} numberOfLines={1}>
                {lastScan.label}
              </Text>
            </View>
            <View style={[styles.lastScanBadge, !lastScan.valid && styles.lastScanBadgeInvalid]}>
              <Text style={[styles.lastScanBadgeText, !lastScan.valid && { color: palette.error }]}>
                {lastScan.valid ? 'Valid' : 'Invalid'}
              </Text>
            </View>
            <MaterialIcons name="chevron-right" size={20} color="rgba(255,255,255,0.4)" />
          </TouchableOpacity>
        )}

        {/* Manual entry bar */}
        {manualEntryOpen && (
          <ManualEntryBar
            onSubmit={handleManualSubmit}
            onDismiss={() => setManualEntryOpen(false)}
          />
        )}

        {/* Action row */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionIconBtn, torchOn && styles.actionIconBtnActive]}
            onPress={() => setTorchOn((v) => !v)}
            activeOpacity={0.8}
          >
            <MaterialIcons
              name="bolt"
              size={24}
              color={torchOn ? BLUE : '#fff'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.manualEntryBtn}
            onPress={() => setManualEntryOpen((v) => !v)}
            activeOpacity={0.8}
          >
            <MaterialIcons name="keyboard" size={20} color="rgba(255,255,255,0.85)" />
            <Text style={styles.manualEntryLabel}>Manual Entry</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionIconBtn}
            onPress={() => Alert.alert('Gallery', 'QR scanning from gallery coming soon.')}
            activeOpacity={0.8}
          >
            <MaterialIcons name="collections" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
// Camera chrome stays dark — no palette theming needed in these styles.

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },

  // ── Scan frame ────────────────────────────────────────────────────────────
  frame: {
    position: 'absolute',
    borderRadius: radius.md,
    overflow: 'visible',
  },

  // ── Instruction ───────────────────────────────────────────────────────────
  instructionWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  } as any,
  instructionText: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.90)',
    fontFamily: 'Inter_500Medium',
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
    overflow: 'hidden',
  },

  // ── Header (dark chrome overlay over camera) ──────────────────────────────
  headerSafe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  headerIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
    backgroundColor: 'rgba(0,0,0,0.30)',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    fontFamily: 'Inter_600SemiBold',
    textShadowColor: 'rgba(0,0,0,0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // ── Bottom controls ────────────────────────────────────────────────────────
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    gap: spacing.md,
    paddingHorizontal: spacing.md,
  },

  // ── Last scan card ────────────────────────────────────────────────────────
  lastScanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: 'rgba(30,30,30,0.88)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.10)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  lastScanIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: `${BLUE}22`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  lastScanInfo: { flex: 1, minWidth: 0 },
  lastScanLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.50)',
    fontFamily: 'Inter_400Regular',
    marginBottom: 2,
  },
  lastScanValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#fff',
    fontFamily: 'Inter_500Medium',
  },
  lastScanBadge: {
    backgroundColor: `${BLUE}33`,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.md,
    flexShrink: 0,
  },
  lastScanBadgeInvalid: {
    backgroundColor: 'rgba(186,26,26,0.22)',
  },
  lastScanBadgeText: {
    fontSize: 12,
    fontWeight: '500',
    color: BLUE,
    fontFamily: 'Inter_500Medium',
  },

  // ── Action row ────────────────────────────────────────────────────────────
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(30,30,30,0.80)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  actionIconBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.full,
  },
  actionIconBtnActive: {
    backgroundColor: `${BLUE}22`,
  },
  manualEntryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.10)',
    borderRadius: radius.full,
  },
  manualEntryLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.85)',
    fontFamily: 'Inter_500Medium',
  },
});
