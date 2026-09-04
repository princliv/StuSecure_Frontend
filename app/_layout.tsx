import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';

import { AppProvider } from '@/providers/AppProvider';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const unstable_settings = {
  // Keep (tabs) as the initial group for the Expo default demo screens.
  // The new StuSecure groups ((auth), (student), (guard), (faculty)) are
  // registered below and will take over once auth routing is wired up in app/index.tsx.
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <AppProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack>
          {/* Existing demo tabs (kept for reference) */}
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

          {/* StuSecure route groups */}
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(student)" options={{ headerShown: false }} />
          <Stack.Screen name="(guard)" options={{ headerShown: false }} />
          <Stack.Screen name="(faculty)" options={{ headerShown: false }} />

          {/* Modals */}
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </AppProvider>
  );
}
