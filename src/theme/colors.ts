/**
 * Theme colors — "Secure Modernity" design system (light + dark).
 */

const tintColorLight = '#155EEF';
const tintColorDark = '#6B9BFF';

/** Legacy expo-router tab colours */
export const Colors = {
  light: {
    text: '#1b1b1d',
    background: '#F7F9FC',
    tint: tintColorLight,
    icon: '#75777e',
    tabIconDefault: '#75777e',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#F2F4F7',
    background: '#050B14',
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
  background: '#F7F9FC',
  surface: '#FFFFFF',
  surfaceVariant: '#efedf0',
  surfaceContainer: '#efedf0',
  surfaceContainerLow: '#f5f3f5',
  surfaceLowest: '#FFFFFF',
  border: '#E2E8F0',
  borderVariant: '#c5c6ce',

  textPrimary: '#1b1b1d',
  textMuted: '#75777e',
  textMutedDark: '#44474d',

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
  background: '#050B14',
  surface: '#0B1220',
  surfaceVariant: '#1E2738',
  surfaceContainer: '#151C2C',
  surfaceContainerLow: '#121826',
  surfaceLowest: '#0B1220',
  border: '#2A3447',
  borderVariant: '#374151',

  textPrimary: '#FFFFFF',
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
