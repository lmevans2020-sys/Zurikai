import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DAILY_TIPS, GUIDES, guideById, tipForDate } from '../../content/guides.ts';
import { GOALS, OBSTACLES, recommendedGuideIds, suggestedHabits } from '../../content/interview.ts';
import type { Profile } from '../types.ts';

const profile: Profile = {
  name: 'Sam',
  goals: ['sleep', 'stress'],
  rhythm: 'evening',
  busyness: 'very-busy',
  obstacles: ['time'],
  coachStyle: 'gentle',
  about: '',
  completedAt: '2026-10-23T00:00:00.000Z',
};

test('every tip, goal and obstacle points at a real guide', () => {
  const ids = [
    ...DAILY_TIPS.map((tip) => tip.guideId),
    ...GOALS.flatMap((goal) => goal.guideIds),
    ...OBSTACLES.map((obstacle) => obstacle.guideId),
  ];
  for (const id of ids) assert.ok(guideById(id), `missing guide ${id}`);
  assert.equal(new Set(GUIDES.map((guide) => guide.id)).size, GUIDES.length, 'guide ids must be unique');
});

test('suggested habits follow the chosen goals and cap at three', () => {
  assert.deepEqual(
    suggestedHabits(['sleep', 'stress']).map((habit) => habit.name),
    ['Same bedtime tonight', 'Three slow breaths', 'No screens 30 min before bed'],
  );
  assert.equal(suggestedHabits(['sleep', 'move', 'stress', 'eat']).length, 3);
  assert.deepEqual(suggestedHabits([]), []);
});

test('recommended guides put goals first and have no duplicates', () => {
  const ids = recommendedGuideIds(profile);
  assert.deepEqual(ids.slice(0, 3), ['better-sleep', 'calm-stress', 'start-tiny']);
  assert.equal(new Set(ids).size, ids.length);
  assert.deepEqual(recommendedGuideIds(null), []);
});

test('daily tip is stable for a day and leans toward recommended guides', () => {
  assert.deepEqual(tipForDate('2026-10-23'), tipForDate('2026-10-23'));
  const preferred = recommendedGuideIds(profile);
  const days = Array.from({ length: 30 }, (_, i) => `2026-11-${String(i + 1).padStart(2, '0')}`);
  const matching = days.filter((day) => preferred.includes(tipForDate(day, preferred).guideId)).length;
  assert.ok(matching >= 20, `expected most tips to match goals, got ${matching}/30`);
});
