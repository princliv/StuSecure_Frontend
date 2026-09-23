/**
 * Theme colors — "Secure Modernity" design system (light + dark).
 */

const tintColorLight = '#155EEF';
const tintColorDark = '#6B9BFF';

/** Legacy expo-router tab colours */
export const Colors = {
    light: {
    text: '#071A33',
    background: '#F5F7FA',
    tint: tintColorLight,
    icon: '#6B7A99',
    tabIconDefault: '#6B7A99',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F2F4F7',
    background: '#0B1220',
    tint: tintColorDark,
    icon: '#9AA3B2',
    tabIconDefault: '#9AA3B2',
    tabIconSelected: tintColorDark,
  },
};

export const brand = {
  /** Primary navy — logo, headings */
  navy: '#071A33',
  /** Action / royal blue — buttons, links, focus rings */
  blue: '#155EEF',
  /** Slightly brighter blue for dark-mode accents */
  blueBright: '#2A69FA',
} as const;

export const lightPalette = {
  background: '#F5F7FA',
  surface: '#FFFFFF',
  surfaceVariant: '#EEF1F7',
  surfaceContainer: '#EEF1F7',
  surfaceContainerLow: '#F5F7FA',
  surfaceLowest: '#FFFFFF',
  border: '#D0D7E5',
  borderVariant: '#E5EAF3',

  textPrimary: '#071A33',
  textMuted: '#6B7A99',
  textMutedDark: '#4A5568',

  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onError: '#ffffff',
  onErrorContainer: '#93000a',

  success: '#10B981',
  successText: '#047857',
  successContainer: '#E6F4EA',

  secondaryFixed: '#dbe1ff',
  onSecondaryFixed: '#00174b',
} as const;

/** Stitch dark tokens (Login Dark / Secure Modernity) */
export const darkPalette = {
  background: '#0B1220',
  surface: '#151C2C',
  surfaceVariant: '#1E2738',
  surfaceContainer: '#151C2C',
  surfaceContainerLow: '#121826',
  surfaceLowest: '#0B1220',
  border: '#2A3447',
  borderVariant: '#1E2738',

  textPrimary: '#F2F4F7',
  textMuted: '#9AA3B2',
  textMutedDark: '#C5CAD3',

  error: '#FF8A80',
  errorContainer: '#4A1515',
  onError: '#ffffff',
  onErrorContainer: '#ffdad6',

  success: '#34D399',
  successText: '#6EE7B7',
  successContainer: '#064E3B',

  secondaryFixed: '#1E3A5F',
  onSecondaryFixed: '#dbe1ff',
} as const;

export type AppPalette = typeof lightPalette;

/** @deprecated Prefer useTheme().palette — defaults to light for legacy imports */
export const palette = lightPalette;
