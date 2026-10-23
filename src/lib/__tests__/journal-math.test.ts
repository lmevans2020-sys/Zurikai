import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  addDays,
  checkInStreak,
  habitStreak,
  isPlannedOn,
  longestCheckInStreak,
  moodTrends,
  offlineReflection,
  restDaysUsedInWeek,
  shareableSummary,
  startOfWeek,
  summarizeWeek,
} from '../journal-math.ts';
import type { Entry, Habit, Mood } from '../types.ts';

function entry(date: string, mood: Mood, habitIds: string[] = [], note = ''): Entry {
  return { date, mood, habitIds, note, updatedAt: `${date}T12:00:00.000Z` };
}

function byDate(...list: Entry[]): Record<string, Entry> {
  return Object.fromEntries(list.map((e) => [e.date, e]));
}

const habits: Habit[] = [
  { id: 'water', name: 'Drink water', emoji: '💧', createdAt: '2026-01-01' },
  { id: 'move', name: 'Move my body', emoji: '🚶', createdAt: '2026-01-01' },
];

test('addDays crosses month and year boundaries', () => {
  assert.equal(addDays('2026-10-31', 1), '2026-11-01');
  assert.equal(addDays('2026-01-01', -1), '2025-12-31');
});

test('startOfWeek returns Monday, including for Sundays', () => {
  assert.equal(startOfWeek('2026-10-22'), '2026-10-19'); // Thursday
  assert.equal(startOfWeek('2026-10-19'), '2026-10-19'); // Monday
  assert.equal(startOfWeek('2026-10-25'), '2026-10-19'); // Sunday
});

test('check-in streak counts back from today', () => {
  const entries = byDate(entry('2026-10-20', 3), entry('2026-10-21', 4), entry('2026-10-22', 5));
  assert.equal(checkInStreak(entries, '2026-10-22'), 3);
});

test('check-in streak is not broken before today is logged', () => {
  const entries = byDate(entry('2026-10-20', 3), entry('2026-10-21', 4));
  assert.equal(checkInStreak(entries, '2026-10-22'), 2);
  assert.equal(checkInStreak(entries, '2026-10-23'), 0);
});

test('habit streak only counts days the habit was done', () => {
  const entries = byDate(
    entry('2026-10-19', 3, ['water']),
    entry('2026-10-20', 3, ['water', 'move']),
    entry('2026-10-21', 3, ['move']),
    entry('2026-10-22', 3, ['water', 'move']),
  );
  assert.equal(habitStreak(entries, habits[1], '2026-10-22'), 3);
  assert.equal(habitStreak(entries, habits[0], '2026-10-22'), 1);
});

test('longest streak finds the best run anywhere in history', () => {
  const entries = byDate(
    entry('2026-10-01', 3),
    entry('2026-10-02', 3),
    entry('2026-10-03', 3),
    entry('2026-10-05', 3),
  );
  assert.equal(longestCheckInStreak(entries), 3);
  assert.equal(longestCheckInStreak({}), 0);
});

test('summarizeWeek only looks at the given week', () => {
  const entries = byDate(
    entry('2026-10-18', 1, ['water'], 'last week'),
    entry('2026-10-19', 2, ['water'], 'tired'),
    entry('2026-10-21', 5, ['water', 'move'], 'great walk'),
  );
  const summary = summarizeWeek(entries, habits, '2026-10-19');
  assert.equal(summary.daysLogged, 2);
  assert.equal(summary.averageMood, 3.5);
  assert.equal(summary.bestDay?.date, '2026-10-21');
  assert.equal(summary.roughestDay?.date, '2026-10-19');
  assert.deepEqual(summary.habits.map((h) => [h.name, h.count]), [
    ['Drink water', 2],
    ['Move my body', 1],
  ]);
  assert.equal(summary.notes.length, 2);
});

test('offline reflection handles empty and busy weeks', () => {
  assert.match(offlineReflection(summarizeWeek({}, habits, '2026-10-19')), /No check-ins/);
  const entries = byDate(entry('2026-10-19', 2, ['water']), entry('2026-10-21', 5, ['water']));
  const text = offlineReflection(summarizeWeek(entries, habits, '2026-10-19'));
  assert.match(text, /2 of 7 days/);
  assert.match(text, /Wednesday felt best and Monday was the hardest/);
  assert.match(text, /Drink water/);
});

test('rest days keep check-in streaks alive without adding to them', () => {
  const entries = byDate(entry('2026-10-19', 4), entry('2026-10-21', 4), entry('2026-10-22', 3));
  assert.equal(checkInStreak(entries, '2026-10-22'), 2);
  assert.equal(checkInStreak(entries, '2026-10-22', { '2026-10-20': true }), 3);
  assert.equal(longestCheckInStreak(entries, { '2026-10-20': true }), 3);
  // Resting today keeps yesterday's streak showing.
  assert.equal(checkInStreak(byDate(entry('2026-10-21', 4)), '2026-10-23', { '2026-10-22': true, '2026-10-23': true }), 1);
});

test('habits planned for some days only skip their days off', () => {
  // Gym on Monday, Wednesday, Friday. 2026-10-19 is a Monday.
  const gym: Habit = { id: 'gym', name: 'Gym', emoji: '🏋️', createdAt: '2026-01-01', days: [1, 3, 5] };
  const entries = byDate(entry('2026-10-19', 4, ['gym']), entry('2026-10-21', 4, ['gym']), entry('2026-10-22', 3));
  assert.equal(isPlannedOn(gym, '2026-10-22'), false);
  assert.equal(habitStreak(entries, gym, '2026-10-22'), 2);
  // Friday not done yet today: streak still shows 2; Saturday after a missed Friday: broken.
  assert.equal(habitStreak(entries, gym, '2026-10-23'), 2);
  assert.equal(habitStreak(entries, gym, '2026-10-24'), 0);
});

test('rest days are counted per Monday-to-Sunday week', () => {
  const rest = { '2026-10-19': true, '2026-10-25': true, '2026-10-26': true } as const;
  assert.equal(restDaysUsedInWeek(rest, '2026-10-22'), 2);
  assert.equal(restDaysUsedInWeek(rest, '2026-10-27'), 1);
});

test('mood trends compare days with and without each habit', () => {
  const days = ['2026-10-10', '2026-10-11', '2026-10-12', '2026-10-13', '2026-10-14', '2026-10-15'];
  const entries = byDate(
    ...days.map((date, i) => (i < 3 ? entry(date, 5, ['move']) : entry(date, 2, ['water']))),
  );
  const trends = moodTrends(entries, habits, '2026-10-15');
  assert.equal(trends.length, 2);
  assert.equal(trends[0].habit.id, 'move');
  assert.equal(trends[0].withHabit, 5);
  assert.equal(trends[0].withoutHabit, 2);
  // Too few days: no trend.
  assert.equal(moodTrends(byDate(entry('2026-10-15', 5, ['move'])), habits, '2026-10-15').length, 0);
});

test('shareable summary covers the period and keeps notes private unless asked', () => {
  const entries = byDate(
    entry('2026-10-13', 2, ['water'], 'Bad sleep'),
    entry('2026-10-20', 4, ['water', 'move']),
    entry('2026-10-22', 5, ['move'], 'Great walk'),
    entry('2026-09-01', 1, [], 'Too old'),
  );
  const summary = shareableSummary(entries, habits, '2026-10-22', 30, false);
  assert.match(summary, /Check-ins: 3 of 30 days/);
  assert.match(summary, /Average mood: 3\.7 out of 5/);
  assert.match(summary, /Drink water: 2 days/);
  assert.match(summary, /Harder days \(mood 1-2\): Tue, Oct 13/);
  assert.doesNotMatch(summary, /Bad sleep|Too old/);
  assert.match(shareableSummary(entries, habits, '2026-10-22', 30, true), /Great walk/);
});
