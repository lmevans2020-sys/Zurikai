import assert from 'node:assert/strict';
import { test } from 'node:test';

import { doneToday, setTick } from '../ticks.ts';
import type { Entry } from '../types.ts';

const entry: Entry = { date: '2026-10-23', mood: 4, habitIds: ['walk'], note: '', updatedAt: '' };

test('ticks wait for the check-in when there is none yet', () => {
  const first = setTick({}, {}, '2026-10-23', 'water', true);
  assert.deepEqual(first.ticks, { '2026-10-23': ['water'] });
  assert.deepEqual(doneToday(first.entries, first.ticks, '2026-10-23'), ['water']);
  const undone = setTick(first.entries, first.ticks, '2026-10-23', 'water', false);
  assert.deepEqual(undone.ticks, {});
});

test('ticks go straight into an existing check-in', () => {
  const result = setTick({ '2026-10-23': entry }, {}, '2026-10-23', 'water', true);
  assert.deepEqual(result.entries['2026-10-23'].habitIds, ['walk', 'water']);
  assert.deepEqual(result.ticks, {});
  assert.deepEqual(setTick(result.entries, {}, '2026-10-23', 'walk', false).entries['2026-10-23'].habitIds, ['water']);
});
