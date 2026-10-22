import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { JournalProvider, useJournal } from '@/lib/journal-store';
import { PremiumProvider } from '@/lib/premium';

SplashScreen.preventAutoHideAsync();

function HideSplashWhenReady() {
  const { ready } = useJournal();
  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <PremiumProvider>
        <JournalProvider>
          <HideSplashWhenReady />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="paywall" options={{ presentation: 'modal' }} />
          </Stack>
        </JournalProvider>
      </PremiumProvider>
    </ThemeProvider>
  );
}
