// Pure date, streak and summary helpers. No React or native imports, so they run in plain
// Node for the unit tests in __tests__.

import type { Entry, Habit, RestDays, WeekSummary } from './types.ts';

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

// Streaks only look back this far, which keeps them fast and bounded.
const MAX_STREAK_LOOKBACK = 3660;

/** Most rest days allowed in one Monday-to-Sunday week. */
export const REST_DAYS_PER_WEEK = 2;

/**
 * Counts consecutive days ending today. Each day is "done" (counts), "skip" (neither counts nor
 * breaks the streak, e.g. a rest day) or "missed" (ends it). Today only counts once it's done,
 * so the streak isn't shown as broken before today's check-in.
 */
function streakEndingAt(today: string, dayStatus: (key: string) => 'done' | 'skip' | 'missed'): number {
  let count = 0;
  for (let i = 0; i < MAX_STREAK_LOOKBACK; i++) {
    const key = addDays(today, -i);
    const status = dayStatus(key);
    if (status === 'done') count += 1;
    else if (status === 'missed' && i > 0) break;
  }
  return count;
}

export function checkInStreak(entries: Record<string, Entry>, today: string, restDays: RestDays = {}): number {
  return streakEndingAt(today, (key) => (key in entries ? 'done' : restDays[key] ? 'skip' : 'missed'));
}

/** Whether a habit is planned for this day of the week. */
export function isPlannedOn(habit: Habit, key: string): boolean {
  return !habit.days || habit.days.length === 0 || habit.days.includes(fromDateKey(key).getDay());
}

export function habitStreak(
  entries: Record<string, Entry>,
  habit: Habit,
  today: string,
  restDays: RestDays = {},
): number {
  const started = toDateKey(new Date(habit.createdAt));
  return streakEndingAt(today, (key) => {
    if (entries[key]?.habitIds.includes(habit.id)) return 'done';
    if (key < started) return 'missed';
    return restDays[key] || !isPlannedOn(habit, key) ? 'skip' : 'missed';
  });
}

export function longestCheckInStreak(entries: Record<string, Entry>, restDays: RestDays = {}): number {
  const keys = Object.keys(entries).sort();
  let best = 0;
  let run = 0;
  let previous: string | null = null;
  for (const key of keys) {
    let bridged = previous !== null;
    for (let gap = previous ? addDays(previous, 1) : key; bridged && gap < key; gap = addDays(gap, 1)) {
      if (!restDays[gap]) bridged = false;
    }
    run = bridged ? run + 1 : 1;
    best = Math.max(best, run);
    previous = key;
  }
  return best;
}

/** Rest days already used in the week (Monday to Sunday) that contains `key`. */
export function restDaysUsedInWeek(restDays: RestDays, key: string): number {
  const monday = startOfWeek(key);
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i)).filter((day) => restDays[day]).length;
}

export type MoodTrend = {
  habit: Habit;
  /** Average mood (1-5) on check-in days with and without the habit. */
  withHabit: number;
  withoutHabit: number;
  daysWith: number;
  daysWithout: number;
};

/** Days of each kind needed before a trend is shown, so one odd day doesn't decide it. */
export const MIN_TREND_DAYS = 3;

/**
 * For each habit, compares mood on check-in days when it was done against planned days when it
 * wasn't, over the last `windowDays`. Strongest positive link first.
 */
export function moodTrends(
  entries: Record<string, Entry>,
  habits: Habit[],
  today: string,
  windowDays = 60,
): MoodTrend[] {
  const from = addDays(today, -windowDays + 1);
  const recent = Object.values(entries).filter((entry) => entry.date >= from && entry.date <= today);
  const average = (list: Entry[]) => list.reduce((sum, entry) => sum + entry.mood, 0) / list.length;

  return habits
    .flatMap((habit) => {
      const planned = recent.filter((entry) => isPlannedOn(habit, entry.date));
      const done = planned.filter((entry) => entry.habitIds.includes(habit.id));
      const notDone = planned.filter((entry) => !entry.habitIds.includes(habit.id));
      if (done.length < MIN_TREND_DAYS || notDone.length < MIN_TREND_DAYS) return [];
      return [
        {
          habit,
          withHabit: Math.round(average(done) * 10) / 10,
          withoutHabit: Math.round(average(notDone) * 10) / 10,
          daysWith: done.length,
          daysWithout: notDone.length,
        },
      ];
    })
    .sort((a, b) => b.withHabit - b.withoutHabit - (a.withHabit - a.withoutHabit));
}

/** Average mood for each day of the week (0 = Sunday), null where there are no check-ins. */
export function moodByWeekday(entries: Record<string, Entry>): (number | null)[] {
  const totals = Array.from({ length: 7 }, () => ({ sum: 0, count: 0 }));
  for (const entry of Object.values(entries)) {
    const day = fromDateKey(entry.date).getDay();
    totals[day].sum += entry.mood;
    totals[day].count += 1;
  }
  return totals.map(({ sum, count }) => (count ? Math.round((sum / count) * 10) / 10 : null));
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

/**
 * A plain-text summary of a stretch of days that someone can share with a therapist or doctor.
 * Notes are private by default and only included when asked for.
 */
export function shareableSummary(
  entries: Record<string, Entry>,
  habits: Habit[],
  today: string,
  days: number,
  includeNotes: boolean,
): string {
  const from = addDays(today, -days + 1);
  const list = Object.values(entries)
    .filter((entry) => entry.date >= from && entry.date <= today)
    .sort((a, b) => a.date.localeCompare(b.date));
  const format = (key: string) =>
    fromDateKey(key).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  const lines = [`SteadyThrive summary: ${format(from)} to ${format(today)}`, ''];

  if (list.length === 0) return [...lines, 'No check-ins in this period.'].join('\n');

  const average = list.reduce((sum, entry) => sum + entry.mood, 0) / list.length;
  lines.push(`Check-ins: ${list.length} of ${days} days`);
  lines.push(`Average mood: ${average.toFixed(1)} out of 5 (1 = rough, 5 = great)`);

  // Weekly averages show the direction things are moving.
  const weeks = new Map<string, Entry[]>();
  for (const entry of list) {
    const week = startOfWeek(entry.date);
    weeks.set(week, [...(weeks.get(week) ?? []), entry]);
  }
  if (weeks.size > 1) {
    lines.push('', 'Mood by week:');
    for (const [week, weekEntries] of weeks) {
      const weekAverage = weekEntries.reduce((sum, entry) => sum + entry.mood, 0) / weekEntries.length;
      lines.push(`- Week of ${format(week)}: ${weekAverage.toFixed(1)} (${weekEntries.length} check-ins)`);
    }
  }

  const habitLines = habits
    .map((habit) => ({ habit, count: list.filter((entry) => entry.habitIds.includes(habit.id)).length }))
    .filter(({ count }) => count > 0)
    .map(({ habit, count }) => `- ${habit.name}${habit.quit ? ' (staying away)' : ''}: ${count} days`);
  if (habitLines.length) lines.push('', 'Habits:', ...habitLines);

  const lowDays = list.filter((entry) => entry.mood <= 2).map((entry) => format(entry.date));
  if (lowDays.length) lines.push('', `Harder days (mood 1-2): ${lowDays.join(', ')}`);

  if (includeNotes) {
    const notes = list.filter((entry) => entry.note.trim());
    if (notes.length) {
      lines.push('', 'Notes:');
      for (const entry of notes) lines.push(`- ${format(entry.date)} (mood ${entry.mood}): ${entry.note.trim()}`);
    }
  }
  return lines.join('\n');
}
