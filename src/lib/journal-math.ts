// Pure date, streak and summary helpers. No React or native imports, so they run in plain
// Node for the unit tests in __tests__.

import type { Entry, Habit, WeekSummary } from './types.ts';

/** Local calendar date as YYYY-MM-DD. */
export function toDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(key: string, days: number): string {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** Monday of the week that contains `key`. */
export function startOfWeek(key: string): string {
  const day = fromDateKey(key).getDay(); // 0 = Sunday
  return addDays(key, day === 0 ? -6 : 1 - day);
}

/**
 * Consecutive days ending today (or yesterday, so the streak isn't shown as broken before
 * today's check-in) for which `hasDay` is true.
 */
function streakEndingAt(today: string, hasDay: (key: string) => boolean): number {
  let cursor = hasDay(today) ? today : addDays(today, -1);
  let count = 0;
  while (hasDay(cursor)) {
    count += 1;
    cursor = addDays(cursor, -1);
  }
  return count;
}

export function checkInStreak(entries: Record<string, Entry>, today: string): number {
  return streakEndingAt(today, (key) => key in entries);
}

export function habitStreak(entries: Record<string, Entry>, habitId: string, today: string): number {
  return streakEndingAt(today, (key) => entries[key]?.habitIds.includes(habitId) ?? false);
}

export function longestCheckInStreak(entries: Record<string, Entry>): number {
  const keys = Object.keys(entries).sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const key of keys) {
    run = previous !== null && addDays(previous, 1) === key ? run + 1 : 1;
    best = Math.max(best, run);
    previous = key;
  }
  return best;
}

/** The last `count` days ending at `today`, oldest first, with the entry for each if any. */
export function recentDays(
  entries: Record<string, Entry>,
  today: string,
  count: number,
): { date: string; entry: Entry | undefined }[] {
  return Array.from({ length: count }, (_, i) => {
    const date = addDays(today, i - count + 1);
    return { date, entry: entries[date] };
  });
}

export function summarizeWeek(
  entries: Record<string, Entry>,
  habits: Habit[],
  weekStart: string,
): WeekSummary {
  const week = Array.from({ length: 7 }, (_, i) => entries[addDays(weekStart, i)]).filter(
    (entry): entry is Entry => entry !== undefined,
  );

  const byMood = [...week].sort((a, b) => b.mood - a.mood);
  const habitCounts = habits
    .map((habit) => ({
      name: habit.name,
      emoji: habit.emoji,
      count: week.filter((entry) => entry.habitIds.includes(habit.id)).length,
    }))
    .filter((habit) => habit.count > 0)
    .sort((a, b) => b.count - a.count);

  return {
    weekStart,
    daysLogged: week.length,
    averageMood: week.length
      ? Math.round((week.reduce((sum, entry) => sum + entry.mood, 0) / week.length) * 10) / 10
      : null,
    bestDay: byMood[0] ?? null,
    roughestDay: byMood.length > 1 ? byMood[byMood.length - 1] : null,
    habits: habitCounts,
    notes: week
      .filter((entry) => entry.note.trim().length > 0)
      .map((entry) => ({ date: entry.date, mood: entry.mood, note: entry.note.trim() })),
  };
}

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function weekdayName(key: string): string {
  return WEEKDAYS[fromDateKey(key).getDay()];
}

/**
 * A short, warm reflection written without the AI coach. Used when the coach can't be
 * reached (offline, server not set up yet) so the Coach tab is never empty.
 */
export function offlineReflection(summary: WeekSummary): string {
  if (summary.daysLogged === 0) {
    return 'No check-ins this week yet. Even a ten-second check-in counts. Start with how you feel today.';
  }

  const lines: string[] = [];
  lines.push(
    `You checked in ${summary.daysLogged} of 7 days this week` +
      (summary.averageMood !== null ? `, with an average mood of ${summary.averageMood} out of 5.` : '.'),
  );

  if (summary.bestDay && summary.roughestDay && summary.bestDay.mood !== summary.roughestDay.mood) {
    lines.push(
      `${weekdayName(summary.bestDay.date)} felt best and ${weekdayName(summary.roughestDay.date)} was the hardest. ` +
        'What was different about those two days?',
    );
  }

  const top = summary.habits[0];
  if (top) {
    lines.push(`Your most consistent habit was ${top.emoji} ${top.name} (${top.count} of 7 days). Nice work.`);
  }

  lines.push(
    summary.daysLogged < 4
      ? 'For next week, try one small goal: check in four days.'
      : 'For next week, pick one habit to protect on your busiest day.',
  );

  return lines.join('\n\n');
}
