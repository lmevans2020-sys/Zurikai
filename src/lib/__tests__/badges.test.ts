import assert from 'node:assert/strict';
import { test } from 'node:test';

import { badgeStatus, newBadges, type BadgeInput } from '../badges.ts';
import { addDays } from '../journal-math.ts';
import type { Entry, Mood } from '../types.ts';

function days(count: number, mood: Mood, habitIds: string[] = []): Record<string, Entry> {
  // 2026-10-05 is a Monday.
  return Object.fromEntries(
    Array.from({ length: count }, (_, i) => {
      const date = addDays('2026-10-05', i);
      return [date, { date, mood, habitIds, note: '', updatedAt: '' }];
    }),
  );
}

const empty: BadgeInput = { entries: {}, habits: [], restDays: {}, finishedChallenges: [] };
const earned = (input: BadgeInput) => badgeStatus(input).filter((b) => b.earned).map((b) => b.id);

test('nothing is earned before the first check-in', () => {
  assert.deepEqual(earned(empty), []);
});

test('a week of good check-ins earns streak, habit and sunny-week badges', () => {
  const input: BadgeInput = {
    ...empty,
    entries: days(7, 4, ['walk', 'smoke']),
    habits: [
      { id: 'walk', name: 'Walk', emoji: '🚶', createdAt: '2026-10-01' },
      { id: 'smoke', name: 'No smoking', emoji: '🚭', createdAt: '2026-10-01', quit: true },
    ],
  };
  const ids = earned(input);
  for (const id of ['first-step', 'streak-3', 'streak-7', 'habit-week', 'quit-7', 'sunny-week']) assert.ok(ids.includes(id), id);
  assert.ok(!ids.includes('streak-30'));
});

test('newBadges reports only what was just earned', () => {
  const before = { ...empty, entries: days(2, 3) };
  const after = { ...empty, entries: days(3, 3) };
  assert.deepEqual(newBadges(before, after).map((b) => b.id), ['streak-3']);
  assert.deepEqual(newBadges(after, after), []);
});
