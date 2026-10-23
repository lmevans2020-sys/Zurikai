import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { JournalProvider, useJournal } from '@/lib/journal-store';
import { PremiumProvider } from '@/lib/premium';
import { syncReminders } from '@/lib/reminders';

SplashScreen.preventAutoHideAsync();

// New people go through the welcome interview before they reach the app.
function AppStack() {
  const { ready, profile, activeHabits } = useJournal();
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Keep the phone's scheduled reminders in step with the habits. Only re-run when a habit's
  // name or reminders change, not on every check-in.
  const reminderKey = useMemo(
    () => JSON.stringify(activeHabits.map(({ id, name, emoji, reminders }) => [id, name, emoji, reminders])),
    [activeHabits],
  );
  useEffect(() => {
    if (!ready) return;
    syncReminders(activeHabits).catch((error) => console.warn('Could not schedule reminders', error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, reminderKey]);

  // Keep the splash screen up until saved data has loaded, so the interview doesn't flash.
  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={profile !== null}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="guides/[id]" />
        <Stack.Screen name="coach-chat" />
        <Stack.Screen name="reminders/[id]" />
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
