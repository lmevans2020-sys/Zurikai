// Habits ticked off outside the daily check-in (from a reminder's "Done" button or the home-screen
// widget). If today's check-in exists the tick goes straight into it; otherwise it waits in
// `ticks` and is pre-selected on the Today screen until the check-in is saved.
// Pure, so the app and the widget (which runs without the app open) share it.

import type { Entry } from './types.ts';

export type Ticks = Record<string, string[]>;

export function setTick(
  entries: Record<string, Entry>,
  ticks: Ticks,
  date: string,
  habitId: string,
  done: boolean,
): { entries: Record<string, Entry>; ticks: Ticks } {
  const update = (ids: string[]) => (done ? [...new Set([...ids, habitId])] : ids.filter((id) => id !== habitId));
  const entry = entries[date];
  if (entry) {
    return {
      entries: { ...entries, [date]: { ...entry, habitIds: update(entry.habitIds), updatedAt: new Date().toISOString() } },
      ticks,
    };
  }
  const next = update(ticks[date] ?? []);
  const rest = Object.fromEntries(Object.entries(ticks).filter(([key]) => key !== date));
  return { entries, ticks: next.length ? { ...rest, [date]: next } : rest };
}

/** Habits done today so far: from the check-in if there is one, otherwise from ticks. */
export function doneToday(entries: Record<string, Entry>, ticks: Ticks, date: string): string[] {
  return entries[date]?.habitIds ?? ticks[date] ?? [];
}
