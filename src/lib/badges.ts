// Badges people earn along the way. Worked out from the journal itself, so nothing extra is
// stored and they can never get out of step with the data. No React imports: unit tested.

import { addDays, longestCheckInStreak, startOfWeek } from './journal-math.ts';
import type { Entry, Habit, RestDays } from './types.ts';

export type Badge = {
  id: string;
  emoji: string;
  title: string;
  detail: string;
};

export type BadgeInput = {
  entries: Record<string, Entry>;
  habits: Habit[];
  restDays: RestDays;
  finishedChallenges: string[];
};

/** Longest run of consecutive calendar days on which the habit was ticked. */
function longestHabitRun(entries: Record<string, Entry>, habitId: string): number {
  const days = Object.values(entries)
    .filter((entry) => entry.habitIds.includes(habitId))
    .map((entry) => entry.date)
    .sort();
  let best = 0;
  let run = 0;
  days.forEach((day, index) => {
    run = index > 0 && addDays(days[index - 1], 1) === day ? run + 1 : 1;
    best = Math.max(best, run);
  });
  return best;
}

/** True when some Monday-to-Sunday week has 5+ check-ins averaging 4 or more. */
function hadSunnyWeek(entries: Record<string, Entry>): boolean {
  const weeks = new Map<string, number[]>();
  for (const entry of Object.values(entries)) {
    const monday = startOfWeek(entry.date);
    weeks.set(monday, [...(weeks.get(monday) ?? []), entry.mood]);
  }
  return [...weeks.values()].some(
    (moods) => moods.length >= 5 && moods.reduce((sum, mood) => sum + mood, 0) / moods.length >= 4,
  );
}

const BADGES: (Badge & { earned: (input: BadgeInput) => boolean })[] = [
  {
    id: 'first-step',
    emoji: '🌱',
    title: 'First step',
    detail: 'Your first check-in.',
    earned: ({ entries }) => Object.keys(entries).length >= 1,
  },
  {
    id: 'streak-3',
    emoji: '🔥',
    title: 'Warming up',
    detail: 'A 3-day check-in streak.',
    earned: ({ entries, restDays }) => longestCheckInStreak(entries, restDays) >= 3,
  },
  {
    id: 'streak-7',
    emoji: '⭐',
    title: 'One full week',
    detail: 'A 7-day check-in streak.',
    earned: ({ entries, restDays }) => longestCheckInStreak(entries, restDays) >= 7,
  },
  {
    id: 'streak-30',
    emoji: '🏆',
    title: 'Steady month',
    detail: 'A 30-day check-in streak.',
    earned: ({ entries, restDays }) => longestCheckInStreak(entries, restDays) >= 30,
  },
  {
    id: 'checkins-10',
    emoji: '📓',
    title: 'Getting to know you',
    detail: '10 check-ins in total.',
    earned: ({ entries }) => Object.keys(entries).length >= 10,
  },
  {
    id: 'checkins-50',
    emoji: '📚',
    title: 'Story so far',
    detail: '50 check-ins in total.',
    earned: ({ entries }) => Object.keys(entries).length >= 50,
  },
  {
    id: 'checkins-100',
    emoji: '💯',
    title: 'Hundred club',
    detail: '100 check-ins in total.',
    earned: ({ entries }) => Object.keys(entries).length >= 100,
  },
  {
    id: 'habit-week',
    emoji: '💪',
    title: 'Habit locked in',
    detail: 'Did one habit 7 days in a row.',
    earned: ({ entries, habits }) => habits.some((habit) => !habit.quit && longestHabitRun(entries, habit.id) >= 7),
  },
  {
    id: 'quit-7',
    emoji: '🕊️',
    title: 'A week free',
    detail: 'Stayed away from a habit you’re quitting for 7 days.',
    earned: ({ entries, habits }) => habits.some((habit) => habit.quit && longestHabitRun(entries, habit.id) >= 7),
  },
  {
    id: 'sunny-week',
    emoji: '🌤️',
    title: 'Sunny week',
    detail: 'A week of 5+ check-ins with an average mood of 4 or more.',
    earned: ({ entries }) => hadSunnyWeek(entries),
  },
  {
    id: 'rest-day',
    emoji: '😌',
    title: 'Rest is part of it',
    detail: 'Took a rest day instead of giving up.',
    earned: ({ restDays }) => Object.keys(restDays).length >= 1,
  },
  {
    id: 'challenge-1',
    emoji: '🎯',
    title: 'Challenge complete',
    detail: 'Finished a guided challenge.',
    earned: ({ finishedChallenges }) => finishedChallenges.length >= 1,
  },
  {
    id: 'challenge-3',
    emoji: '🚀',
    title: 'Up for anything',
    detail: 'Finished 3 guided challenges.',
    earned: ({ finishedChallenges }) => finishedChallenges.length >= 3,
  },
];

/** Every badge, with whether it's been earned, in display order. */
export function badgeStatus(input: BadgeInput): (Badge & { earned: boolean })[] {
  return BADGES.map(({ earned, ...badge }) => ({ ...badge, earned: earned(input) }));
}

/** Badges earned in `after` that weren't in `before`. */
export function newBadges(before: BadgeInput, after: BadgeInput): Badge[] {
  const had = new Set(badgeStatus(before).filter((badge) => badge.earned).map((badge) => badge.id));
  return badgeStatus(after).filter((badge) => badge.earned && !had.has(badge.id));
}
