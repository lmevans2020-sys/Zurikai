import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  addDays,
  checkInStreak,
  habitStreak,
  longestCheckInStreak,
  offlineReflection,
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
  assert.equal(habitStreak(entries, 'move', '2026-10-22'), 3);
  assert.equal(habitStreak(entries, 'water', '2026-10-22'), 1);
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
