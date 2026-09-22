import React from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { Images } from '@/constants/assets';
import { useTheme } from '@/hooks/useTheme';

type Props = {
  size?: number;
  onPress?: () => void;
  /** When true, show the Stitch demo headshot; otherwise initials if provided */
  useHeadshot?: boolean;
  initials?: string;
  style?: ViewStyle;
};

export default function StudentAvatar({
  size = 32,
  onPress,
  useHeadshot = true,
  initials,
  style,
}: Props) {
  const { palette, brand } = useTheme();
  const radius = size / 2;

  const content = useHeadshot ? (
    <Image
      source={Images.headshot}
      style={{ width: size, height: size, borderRadius: radius }}
      resizeMode="cover"
      accessibilityLabel="Student photo"
    />
  ) : (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: radius,
          backgroundColor: brand.blue,
        },
      ]}>
      <Text style={[styles.initials, { fontSize: size * 0.35 }]}>
        {(initials ?? 'ST').slice(0, 2).toUpperCase()}
      </Text>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={[
          styles.ring,
          {
            borderRadius: radius,
            borderColor: palette.border,
            width: size,
            height: size,
          },
          style,
        ]}
        accessibilityRole="button">
        {content}
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.ring,
        {
          borderRadius: radius,
          borderColor: palette.border,
          width: size,
          height: size,
        },
        style,
      ]}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  ring: {
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
  },
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: '#fff',
    fontWeight: '700',
  },
});
