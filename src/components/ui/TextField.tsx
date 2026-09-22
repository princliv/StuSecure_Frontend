/**
 * TextField — labeled input with left icon, optional right-icon button,
 * and inline validation error. Theme-aware (light + dark).
 */
import React, { forwardRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  type TextInputProps,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/radius';
import { spacing } from '@/theme/spacing';

export interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIconName?: keyof typeof MaterialIcons.glyphMap;
  rightIconName?: keyof typeof MaterialIcons.glyphMap;
  onRightIconPress?: () => void;
  rightIconColor?: string;
}

const TextField = forwardRef<TextInput, TextFieldProps>(
  (
    {
      label,
      error,
      leftIconName,
      rightIconName,
      onRightIconPress,
      rightIconColor,
      style,
      ...rest
    },
    ref,
  ) => {
    const { palette, brand } = useTheme();

    return (
      <View style={styles.wrapper}>
        {label ? (
          <Text style={[styles.label, { color: palette.textMutedDark }]}>
            {label}
          </Text>
        ) : null}

        <View
          style={[
            styles.inputRow,
            {
              backgroundColor: palette.surface,
              borderColor: error ? palette.error : palette.border,
              borderWidth: error ? 1.5 : 1,
            },
          ]}>
          {leftIconName ? (
            <MaterialIcons
              name={leftIconName}
              size={20}
              color={palette.textMuted}
              style={styles.leftIcon}
            />
          ) : null}

          <TextInput
            ref={ref}
            style={[
              styles.input,
              { color: palette.textPrimary },
              leftIconName ? styles.inputPaddingLeft : undefined,
              rightIconName ? styles.inputPaddingRight : undefined,
              style,
            ]}
            placeholderTextColor={palette.textMuted}
            selectionColor={brand.blue}
            {...rest}
          />

          {rightIconName ? (
            <TouchableOpacity
              onPress={onRightIconPress}
              style={styles.rightIconBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}>
              <MaterialIcons
                name={rightIconName}
                size={20}
                color={rightIconColor ?? palette.textMuted}
              />
            </TouchableOpacity>
          ) : null}
        </View>

        {error ? (
          <Text style={[styles.errorText, { color: palette.error }]}>
            {error}
          </Text>
        ) : null}
      </View>
    );
  },
);

TextField.displayName = 'TextField';
export default TextField;

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 2,
    fontFamily: 'Inter_500Medium',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  leftIcon: {
    position: 'absolute',
    left: spacing.md,
    zIndex: 1,
  },
  inputPaddingLeft: { paddingLeft: spacing.md + 28 },
  inputPaddingRight: { paddingRight: spacing.md + 28 },
  input: {
    flex: 1,
    height: '100%',
    paddingHorizontal: spacing.md,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  rightIconBtn: {
    position: 'absolute',
    right: spacing.md,
    zIndex: 1,
    padding: 2,
  },
  errorText: {
    fontSize: 12,
    marginLeft: 2,
    fontFamily: 'Inter_400Regular',
  },
});
