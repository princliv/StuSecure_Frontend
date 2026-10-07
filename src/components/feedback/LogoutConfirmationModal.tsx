import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export interface LogoutConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export default function LogoutConfirmationModal({
  visible,
  onClose,
  onConfirm,
  title = 'Sign Out',
  description = 'Are you sure you want to sign out of StuSecure? You will need to enter your credentials again to access campus safety services.',
  confirmLabel = 'Sign Out',
  cancelLabel = 'Cancel',
}: LogoutConfirmationModalProps) {
  const { palette, isDark } = useTheme();
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    try {
      setLoading(true);
      await onConfirm();
    } catch {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={loading ? undefined : onClose}>
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor: palette.surface,
              borderColor: palette.border,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Decorative Top Accent Stripe */}
          <View
            style={[
              styles.topStripe,
              { backgroundColor: palette.error },
            ]}
          />

          {/* Red/Destructive Warning Icon Chip */}
          <View
            style={[
              styles.iconWrap,
              {
                backgroundColor: isDark
                  ? 'rgba(255, 138, 128, 0.15)'
                  : palette.errorContainer,
                borderColor: `${palette.error}33`,
              },
            ]}
          >
            <MaterialIcons name="logout" size={28} color={palette.error} />
          </View>

          {/* Title & Description */}
          <Text style={[styles.title, { color: palette.textPrimary }]}>
            {title}
          </Text>
          <Text style={[styles.description, { color: palette.textMuted }]}>
            {description}
          </Text>

          {/* Action Buttons Row */}
          <View style={styles.actionsRow}>
            {/* Cancel Button */}
            <TouchableOpacity
              style={[
                styles.btn,
                styles.cancelBtn,
                {
                  backgroundColor: palette.surfaceVariant,
                  borderColor: palette.border,
                },
              ]}
              onPress={onClose}
              disabled={loading}
              activeOpacity={0.75}
            >
              <Text style={[styles.cancelBtnText, { color: palette.textPrimary }]}>
                {cancelLabel}
              </Text>
            </TouchableOpacity>

            {/* Confirm Sign Out Button */}
            <TouchableOpacity
              style={[
                styles.btn,
                styles.confirmBtn,
                { backgroundColor: palette.error },
              ]}
              onPress={() => void handleConfirm()}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View style={styles.btnContent}>
                  <MaterialIcons name="exit-to-app" size={18} color="#fff" />
                  <Text style={styles.confirmBtnText}>{confirmLabel}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    borderRadius: radius.xxl,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    overflow: 'hidden',
  },
  topStripe: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
  },
  btn: {
    flex: 1,
    height: 48,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  confirmBtn: {
    shadowColor: '#ba1a1a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  confirmBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
    fontFamily: 'Inter_600SemiBold',
  },
  btnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
