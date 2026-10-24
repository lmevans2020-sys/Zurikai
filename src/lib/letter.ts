// The numbers behind the monthly coach letter. Pure, so it is unit tested and the same summary
// can be sent to the server or used for the offline letter.

import { moodTrends } from './journal-math.ts';
import type { Entry, Habit } from './types.ts';

export type MonthSummary = {
  /** "YYYY-MM" */
  month: string;
  /** e.g. "October 2026" */
  label: string;
  daysLogged: number;
  averageMood: number | null;
  habits: { name: string; count: number; quit: boolean }[];
  /** Habits whose days line up with better mood, strongest first. */
  moodLinks: { name: string; withHabit: number; withoutHabit: number }[];
  restDays: number;
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function monthKey(dateKey: string): string {
  return dateKey.slice(0, 7);
}

export function summarizeMonth(
  entries: Record<string, Entry>,
  habits: Habit[],
  restDays: Record<string, true>,
  month: string,
): MonthSummary {
  const inMonth = Object.values(entries).filter((entry) => monthKey(entry.date) === month);
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = `${month}-${String(new Date(year, monthNumber, 0).getDate()).padStart(2, '0')}`;
  const monthEntries = Object.fromEntries(inMonth.map((entry) => [entry.date, entry]));

  return {
    month,
    label: `${MONTHS[monthNumber - 1]} ${year}`,
    daysLogged: inMonth.length,
    averageMood: inMonth.length
      ? Math.round((inMonth.reduce((sum, entry) => sum + entry.mood, 0) / inMonth.length) * 10) / 10
      : null,
    habits: habits
      .map((habit) => ({
        name: habit.name,
        quit: habit.quit === true,
        count: inMonth.filter((entry) => entry.habitIds.includes(habit.id)).length,
      }))
      .filter((habit) => habit.count > 0)
      .sort((a, b) => b.count - a.count),
    moodLinks: moodTrends(monthEntries, habits, lastDay, 31)
      .filter((trend) => trend.withHabit - trend.withoutHabit > 0.2)
      .slice(0, 3)
      .map((trend) => ({ name: trend.habit.name, withHabit: trend.withHabit, withoutHabit: trend.withoutHabit })),
    restDays: Object.keys(restDays).filter((day) => monthKey(day) === month).length,
  };
}

export function isMonthSummary(value: unknown): value is MonthSummary {
  const summary = value as MonthSummary;
  return (
    typeof summary === 'object' &&
    summary !== null &&
    typeof summary.month === 'string' &&
    /^\d{4}-\d{2}$/.test(summary.month) &&
    typeof summary.label === 'string' &&
    typeof summary.daysLogged === 'number' &&
    Array.isArray(summary.habits) &&
    Array.isArray(summary.moodLinks)
  );
}

/** A plain description of the month for the coach to read. Capped, since it comes from the phone. */
export function describeMonth(summary: MonthSummary): string {
  const habits = summary.habits.slice(0, 12).map(
    (habit) => `- ${String(habit.name).slice(0, 60)}${habit.quit ? ' (a habit they are quitting; count = days they stayed away)' : ''}: ${Number(habit.count)} days`,
  );
  const links = summary.moodLinks.slice(0, 3).map(
    (link) => `- ${String(link.name).slice(0, 60)}: mood ${Number(link.withHabit)} on days done vs ${Number(link.withoutHabit)} on days skipped`,
  );
  return [
    `Month: ${String(summary.label).slice(0, 30)}`,
    `Days checked in: ${Number(summary.daysLogged)}`,
    `Average mood (1-5): ${summary.averageMood ?? 'n/a'}`,
    `Rest days taken: ${Number(summary.restDays) || 0}`,
    `Habits:\n${habits.length ? habits.join('\n') : '- none checked off'}`,
    `Habits linked with better mood:\n${links.length ? links.join('\n') : '- none clear yet'}`,
  ].join('\n');
}

/** Used when the coach can't be reached, so there is always a letter. */
export function offlineLetter(summary: MonthSummary, firstName?: string): string {
  const hello = firstName ? `Dear ${firstName},` : 'Hello,';
  if (summary.daysLogged === 0) {
    return `${hello}\n\nThere are no check-ins for ${summary.label} yet. That's okay. A ten-second check-in today is a perfect place to start.\n\nYour coach`;
  }
  const top = summary.habits.find((habit) => !habit.quit);
  const link = summary.moodLinks[0];
  return [
    hello,
    '',
    `In ${summary.label} you checked in ${summary.daysLogged} times` +
      (summary.averageMood !== null ? `, with an average mood of ${summary.averageMood} out of 5.` : '.'),
    top ? `Your most consistent habit was ${top.name.toLowerCase()} (${top.count} days). That's something to be proud of.` : '',
    link ? `You tended to feel better on days you did ${link.name.toLowerCase()}. Worth protecting next month.` : '',
    summary.restDays ? `You also took ${summary.restDays} rest day${summary.restDays === 1 ? '' : 's'}, which is part of keeping going, not giving up.` : '',
    '',
    'For next month, pick one small thing to keep and one tiny thing to try. Steady steps add up.',
    '',
    'Your coach',
  ]
    .filter((line, index, all) => line !== '' || all[index - 1] !== '')
    .join('\n');
}
