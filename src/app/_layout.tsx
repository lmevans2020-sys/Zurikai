import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo } from 'react';
import { useColorScheme } from 'react-native';

import { toDateKey } from '@/lib/journal-math';
import { JournalProvider, useJournal } from '@/lib/journal-store';
import { PremiumProvider } from '@/lib/premium';
import { listenForReminderDone, syncReminders } from '@/lib/reminders';
import { refreshHabitsWidget } from '@/widget';

SplashScreen.preventAutoHideAsync();

// New people go through the welcome interview before they reach the app.
function AppStack() {
  const { ready, profile, activeHabits, entries, ticks, restDays, tickHabit } = useJournal();
  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  // Keep the phone's scheduled reminders in step with the habits. Only re-run when a habit's
  // name or reminders change, not on every check-in.
  const reminderKey = useMemo(
    () => JSON.stringify(activeHabits.map(({ id, name, emoji, reminders, days, quit }) => [id, name, emoji, reminders, days, quit])),
    [activeHabits],
  );
  useEffect(() => {
    if (!ready) return;
    syncReminders(activeHabits).catch((error) => console.warn('Could not schedule reminders', error));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, reminderKey]);

  // Keep the home-screen widget in step with the app.
  useEffect(() => {
    if (ready) refreshHabitsWidget();
  }, [ready, activeHabits, entries, ticks, restDays]);

  // "Done" on a reminder ticks that habit off for today.
  useEffect(() => {
    if (!ready) return;
    return listenForReminderDone((habitId) => tickHabit(toDateKey(new Date()), habitId, true));
  }, [ready, tickHabit]);

  // Keep the splash screen up until saved data has loaded, so the interview doesn't flash.
  if (!ready) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={profile !== null}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="guides/[id]" />
        <Stack.Screen name="coach-chat" />
        <Stack.Screen name="breathe" />
        <Stack.Screen name="challenges/[id]" />
        <Stack.Screen name="habits/[id]" />
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
