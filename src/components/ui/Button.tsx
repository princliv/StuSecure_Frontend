/**
 * Button — primary and outline variants with loading spinner.
 * Theme-aware (light + dark).
 */
import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  type TouchableOpacityProps,
} from 'react-native';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/radius';

export interface ButtonProps extends TouchableOpacityProps {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'outline';
  rightElement?: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  label,
  loading = false,
  variant = 'primary',
  rightElement,
  style,
  disabled,
  ...rest
}) => {
  const { brand, palette } = useTheme();
  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      style={[
        styles.base,
        isPrimary
          ? { backgroundColor: brand.blue }
          : {
              backgroundColor: palette.surface,
              borderWidth: 1,
              borderColor: palette.border,
            },
        disabled || loading ? styles.disabled : undefined,
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.82}
      {...rest}>
      {loading ? (
        <ActivityIndicator
          color={isPrimary ? '#fff' : brand.blue}
          size="small"
        />
      ) : (
        <View style={styles.row}>
          <Text
            style={[
              styles.label,
              { color: isPrimary ? '#fff' : palette.textPrimary },
            ]}>
            {label}
          </Text>
          {rightElement}
        </View>
      )}
    </TouchableOpacity>
  );
};

export default Button;

const styles = StyleSheet.create({
  base: {
    height: 52,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  disabled: { opacity: 0.55 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.2,
    fontFamily: 'Inter_600SemiBold',
  },
});
