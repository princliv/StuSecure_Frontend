import React from 'react';
import { Image, View, StyleSheet, type ImageStyle, type ViewStyle } from 'react-native';
import { Images } from '@/constants/assets';
import { useTheme } from '@/hooks/useTheme';
import { radius } from '@/theme/radius';

type Props = {
  height?: number;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
};

/**
 * StuSecure wordmark + shield logo.
 * On dark backgrounds the PNG's white plate is wrapped in a small white chip
 * so the navy wordmark stays legible.
 */
export default function BrandLogo({ height = 28, style, imageStyle }: Props) {
  const { isDark } = useTheme();
  const width = Math.round(height * 3.2);

  return (
    <View
      style={[
        styles.wrap,
        isDark && styles.darkChip,
        { height: isDark ? height + 8 : height },
        style,
      ]}>
      <Image
        source={Images.logo}
        style={[{ height, width }, imageStyle]}
        resizeMode="contain"
        accessibilityLabel="StuSecure"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  darkChip: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    paddingHorizontal: 6,
  },
});
