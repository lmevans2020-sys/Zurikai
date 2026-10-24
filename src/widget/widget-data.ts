import AsyncStorage from '@react-native-async-storage/async-storage';

import { checkInStreak, isPlannedOn, toDateKey } from '@/lib/journal-math';
import { STORAGE_KEY } from '@/lib/journal-store';
import { doneToday, setTick, type Ticks } from '@/lib/ticks';
import type { Entry, Habit, RestDays } from '@/lib/types';
import type { WidgetHabit } from '@/widget/habits-widget';

// Reads and changes the saved journal directly, because the widget runs without the app open.

type Saved = { habits?: Habit[]; entries?: Record<string, Entry>; ticks?: Ticks; restDays?: RestDays };

async function load(): Promise<Saved> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? (JSON.parse(raw) as Saved) : {};
}

export async function widgetState(): Promise<{ habits: WidgetHabit[]; streak: number }> {
  const saved = await load();
  const today = toDateKey(new Date());
  const entries = saved.entries ?? {};
  const done = doneToday(entries, saved.ticks ?? {}, today);
  const habits = (saved.habits ?? [])
    .filter((habit) => !habit.archived && isPlannedOn(habit, today))
    .map((habit) => ({ id: habit.id, emoji: habit.emoji, name: habit.name, done: done.includes(habit.id) }));
  return { habits, streak: checkInStreak(entries, today, saved.restDays ?? {}) };
}

/** Flips one habit for today and saves it. */
export async function toggleFromWidget(habitId: string): Promise<void> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return;
  const saved = JSON.parse(raw) as Saved & Record<string, unknown>;
  const today = toDateKey(new Date());
  const entries = saved.entries ?? {};
  const ticks = saved.ticks ?? {};
  const isDone = doneToday(entries, ticks, today).includes(habitId);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify({ ...saved, ...setTick(entries, ticks, today, habitId, !isDone) }));
}
