import { useColorScheme } from '@/hooks/use-color-scheme';
import {
  brand,
  lightPalette,
  darkPalette,
  Colors,
  type AppPalette,
} from '@/theme/colors';

export function useTheme() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  const isDark = scheme === 'dark';

  return {
    scheme: scheme as 'light' | 'dark',
    isDark,
    brand,
    palette: (isDark ? darkPalette : lightPalette) as AppPalette,
    colors: Colors[scheme],
    statusBarStyle: (isDark ? 'light-content' : 'dark-content') as
      | 'light-content'
      | 'dark-content',
  };
}
