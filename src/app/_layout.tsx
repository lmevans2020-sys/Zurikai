import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { JournalProvider, useJournal } from '@/lib/journal-store';
import { PremiumProvider } from '@/lib/premium';

SplashScreen.preventAutoHideAsync();

// New people go through the welcome interview before they reach the app.
function AppStack() {
  const { ready, profile } = useJournal();
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  // Keep the splash screen up until saved data has loaded, so the interview doesn't flash.
  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={profile !== null}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="guides/[id]" />
        <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
      </Stack.Protected>
      <Stack.Screen name="welcome" options={{ gestureEnabled: profile !== null }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <PremiumProvider>
        <JournalProvider>
          <AppStack />
        </JournalProvider>
      </PremiumProvider>
    </ThemeProvider>
  );
}
