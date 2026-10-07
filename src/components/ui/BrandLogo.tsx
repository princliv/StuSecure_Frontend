import React from 'react';
import { Image, StyleSheet, type ImageStyle, type StyleProp } from 'react-native';
import { Images } from '@/constants/assets';
import { useTheme } from '@/hooks/useTheme';

export type BrandLogoVariant = 'icon' | 'with-name' | 'app-logo';

export type BrandLogoProps = {
  /**
   * Logo variant:
   *  • 'icon': 1:1 symbol without name (used in topbars/headers)
   *  • 'with-name': Horizontal logo with name next to symbol (used in login / auth screens)
   *  • 'app-logo': Master rich app logo badge
   * Defaults to 'icon' when height <= 36 (topbar scale), else 'with-name'.
   */
  variant?: BrandLogoVariant;
  /** Force 'light' or 'dark' asset. If 'auto' (default), follows active app theme */
  themeMode?: 'light' | 'dark' | 'auto';
  height?: number;
  size?: number;
  style?: StyleProp<ImageStyle>;
  imageStyle?: StyleProp<ImageStyle>;
};

export default function BrandLogo({
  variant,
  themeMode = 'auto',
  height,
  size,
  style,
  imageStyle,
}: BrandLogoProps) {
  const { isDark } = useTheme();

  const effectiveDark =
    themeMode === 'dark' ? true : themeMode === 'light' ? false : isDark;

  const targetHeight = size ?? height ?? 28;
  const effectiveVariant: BrandLogoVariant =
    variant ?? (targetHeight <= 36 ? 'icon' : 'with-name');

  let source;
  let targetWidth = targetHeight;

  if (effectiveVariant === 'icon') {
    // 1:1 symbol/icon without text
    source = effectiveDark ? Images.appIconDark : Images.appIconLight;
    targetWidth = targetHeight;
  } else if (effectiveVariant === 'with-name') {
    // Horizontal lockup: 880x240 (ratio ~3.67)
    source = effectiveDark ? Images.appLogoWithNameDark : Images.appLogoWithNameLight;
    targetWidth = Math.round(targetHeight * 3.67);
  } else {
    // Master App Logo (1:1)
    source = Images.appLogo;
    targetWidth = targetHeight;
  }

  return (
    <Image
      source={source}
      style={[
        styles.image,
        { height: targetHeight, width: targetWidth },
        imageStyle,
        style,
      ]}
      resizeMode="contain"
      accessibilityLabel={effectiveVariant === 'icon' ? 'StuSecure Icon' : 'StuSecure Logo'}
    />
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: 'transparent',
  },
});
