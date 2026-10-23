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

type NotificationsApi = typeof import('@/lib/notifications');

// Loaded defensively: if this phone's app shell is missing a notifications piece, reminders
// are switched off instead of the whole app failing to open.
function loadNotifications(): NotificationsApi | null {
  if (Platform.OS !== 'ios' && Platform.OS !== 'android') return null;
  try {
    return require('@/lib/notifications') as NotificationsApi;
  } catch (error) {
    console.warn('Reminders are unavailable on this device', error);
    return null;
  }
}

const Notifications = loadNotifications();
const supported = Notifications !== null;

if (Notifications) {
  // Show reminders even while the app is open.
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

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

  const wanted = habits.flatMap((habit) =>
    habit.archived ? [] : reminderTimes(habit.reminders).map((time) => ({ habit, time })),
  );
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
    wanted.slice(0, MAX_SCHEDULED).map(({ habit, time }, index) => {
      const [hour, minute] = time.split(':').map(Number);
      return Notifications.scheduleNotificationAsync({
        content: {
          title: `${habit.emoji} ${habit.name}`,
          body: NUDGES[index % NUDGES.length],
          data: { habitId: habit.id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute, channelId: CHANNEL_ID },
      });
    }),
  );
}
