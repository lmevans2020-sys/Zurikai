import assert from 'node:assert/strict';
import { test } from 'node:test';

import { describeMonth, isMonthSummary, offlineLetter, summarizeMonth } from '../letter.ts';
import type { Entry, Habit, Mood } from '../types.ts';

const habits: Habit[] = [
  { id: 'walk', name: 'Walk', emoji: '🚶', createdAt: '2026-09-01' },
  { id: 'phone', name: 'Late-night scrolling', emoji: '📵', createdAt: '2026-09-01', quit: true },
];

function entry(date: string, mood: Mood, habitIds: string[]): Entry {
  return { date, mood, habitIds, note: '', updatedAt: '' };
}

const entries = Object.fromEntries(
  [
    entry('2026-10-01', 5, ['walk']),
    entry('2026-10-02', 5, ['walk', 'phone']),
    entry('2026-10-03', 4, ['walk']),
    entry('2026-10-04', 2, []),
    entry('2026-10-05', 2, ['phone']),
    entry('2026-10-06', 3, []),
    entry('2026-09-30', 1, ['walk']),
  ].map((e) => [e.date, e]),
);

test('summarizes only the chosen month', () => {
  const summary = summarizeMonth(entries, habits, { '2026-10-10': true, '2026-09-29': true }, '2026-10');
  assert.equal(summary.label, 'October 2026');
  assert.equal(summary.daysLogged, 6);
  assert.equal(summary.averageMood, 3.5);
  assert.equal(summary.restDays, 1);
  assert.deepEqual(summary.habits[0], { name: 'Walk', quit: false, count: 3 });
  assert.equal(summary.moodLinks[0].name, 'Walk');
  assert.ok(isMonthSummary(summary));
  assert.match(describeMonth(summary), /Walk: mood 4\.7 on days done vs 2\.3/);
});

test('offline letter is friendly with or without check-ins', () => {
  const summary = summarizeMonth(entries, habits, {}, '2026-10');
  const letter = offlineLetter(summary, 'Lisa');
  assert.match(letter, /^Dear Lisa,/);
  assert.match(letter, /walk \(3 days\)/);
  assert.match(offlineLetter(summarizeMonth({}, habits, {}, '2026-11'), undefined), /no check-ins for November 2026/);
});
