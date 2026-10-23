import { Platform } from 'react-native';

import { reminderTimes } from '@/lib/reminder-times';
import type { Habit } from '@/lib/types';

// Habit reminders are local notifications: the phone schedules them itself, so they work
// offline, need no server and no account. Each reminder time repeats every day.

const CHANNEL_ID = 'habit-reminders';

// iPhones keep at most 64 scheduled notifications per app; stay safely under that.
const MAX_SCHEDULED = 60;

const NUDGES = [
  'A small step now keeps your streak going.',
  'Quick reminder from your coach. You’ve got this.',
  'Future you says thanks.',
  'Two minutes is enough. Start tiny.',
  'Checking in: is now a good moment?',
];

const QUIT_NUDGES = [
  'You’re doing great. One more day free.',
  'Craving? Take three slow breaths and let it pass.',
  'Every day you stay away counts.',
];

type NotificationsApi = typeof import('@/lib/notifications');

// Loaded defensively: if this phone's app shell is missing a notifications piece, reminders
// are switched off instead of the whole app failing to open.
function loadNotifications(): NotificationsApi | null {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;
  try {
    const api = require('@/lib/notifications') as NotificationsApi;
    // Show reminders even while the app is open.
    api.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
    return api;
  } catch (error) {
    console.warn('Reminders are unavailable on this device', error);
    return null;
  }
}

const Notifications = loadNotifications();
const supported = Notifications !== null;

export function remindersSupported() {
  return supported;
}

/** Asks for permission if needed. Returns true when reminders can be shown. */
export async function ensureReminderPermission(): Promise<boolean> {
  if (!Notifications) return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

/**
 * Replaces every scheduled reminder with the ones the habits ask for. Called whenever the
 * habit list changes, so the phone always matches what the app shows.
 */
export function syncReminders(habits: Habit[]): Promise<void> {
  // One sync at a time, so two quick edits can't interleave and leave duplicates behind.
  const run = queue.then(() => replaceScheduled(habits));
  queue = run.catch(() => {});
  return run;
}

let queue: Promise<void> = Promise.resolve();

async function replaceScheduled(habits: Habit[]): Promise<void> {
  if (!Notifications) return;
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Habits planned for some days only get a weekly reminder on each of those days.
  const wanted = habits.flatMap((habit) => {
    if (habit.archived) return [];
    const days = habit.days?.length && habit.days.length < 7 ? habit.days : [null];
    return reminderTimes(habit.reminders).flatMap((time) => days.map((day) => ({ habit, time, day })));
  });
  if (wanted.length === 0) return;

  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Habit reminders',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  await Promise.all(
    wanted.slice(0, MAX_SCHEDULED).map(({ habit, time, day }, index) => {
      const [hour, minute] = time.split(':').map(Number);
      const types = Notifications.SchedulableTriggerInputTypes;
      return Notifications.scheduleNotificationAsync({
        content: {
          title: `${habit.emoji} ${habit.name}`,
          body: habit.quit ? QUIT_NUDGES[index % QUIT_NUDGES.length] : NUDGES[index % NUDGES.length],
          data: { habitId: habit.id },
        },
        // Weekday numbers here run 1 (Sunday) to 7 (Saturday).
        trigger:
          day === null
            ? { type: types.DAILY, hour, minute, channelId: CHANNEL_ID }
            : { type: types.WEEKLY, weekday: day + 1, hour, minute, channelId: CHANNEL_ID },
      });
    }),
  );
}
