// The welcome interview: questions, answer options, and how answers map to starter habits
// and recommended guides. Plain data, like guides.ts, so it's easy to edit.

import type { CoachStyle, GoalId, ObstacleId, Profile } from '@/lib/types';

export const GOALS: {
  id: GoalId;
  emoji: string;
  label: string;
  habits: { name: string; emoji: string }[];
  guideIds: string[];
}[] = [
  {
    id: 'sleep',
    emoji: '😴',
    label: 'Sleep better',
    habits: [
      { name: 'Same bedtime tonight', emoji: '🛏️' },
      { name: 'No screens 30 min before bed', emoji: '📵' },
    ],
    guideIds: ['better-sleep', 'mood-and-habits'],
  },
  {
    id: 'move',
    emoji: '🚶',
    label: 'Move more',
    habits: [
      { name: '10-minute walk', emoji: '🚶' },
      { name: 'Stretch for 2 minutes', emoji: '🧘' },
    ],
    guideIds: ['move-more', 'start-tiny'],
  },
  {
    id: 'stress',
    emoji: '🌿',
    label: 'Feel less stressed',
    habits: [
      { name: 'Three slow breaths', emoji: '🌬️' },
      { name: '10 minutes outside', emoji: '🌳' },
    ],
    guideIds: ['calm-stress', 'self-compassion'],
  },
  {
    id: 'mood',
    emoji: '🌤️',
    label: 'Feel happier day to day',
    habits: [
      { name: 'Write one good thing', emoji: '✍️' },
      { name: 'Message someone I care about', emoji: '💬' },
    ],
    guideIds: ['mood-and-habits', 'self-compassion'],
  },
  {
    id: 'eat',
    emoji: '🥗',
    label: 'Eat and drink healthier',
    habits: [
      { name: 'Drink water', emoji: '💧' },
      { name: 'Eat a fruit or vegetable', emoji: '🍎' },
    ],
    guideIds: ['eat-well', 'environment'],
  },
  {
    id: 'focus',
    emoji: '🎯',
    label: 'Focus and get things done',
    habits: [
      { name: 'Plan my top 3 for today', emoji: '📝' },
      { name: '25 minutes of focused work', emoji: '⏱️' },
    ],
    guideIds: ['focus', 'when-where'],
  },
  {
    id: 'growth',
    emoji: '📚',
    label: 'Learn and grow',
    habits: [
      { name: 'Read 10 pages', emoji: '📖' },
      { name: 'Practice a skill for 10 minutes', emoji: '🎸' },
    ],
    guideIds: ['habit-stacking', 'how-long'],
  },
];

export const OBSTACLES: { id: ObstacleId; emoji: string; label: string; guideId: string }[] = [
  { id: 'time', emoji: '⏰', label: 'Not enough time', guideId: 'start-tiny' },
  { id: 'motivation', emoji: '🔋', label: 'Low motivation or energy', guideId: 'start-tiny' },
  { id: 'forgetting', emoji: '🤔', label: 'I forget', guideId: 'habit-stacking' },
  { id: 'stress', emoji: '😮‍💨', label: 'Stress or busy weeks', guideId: 'never-miss-twice' },
  { id: 'all-or-nothing', emoji: '⚖️', label: 'I give up after one slip', guideId: 'never-miss-twice' },
  { id: 'distractions', emoji: '📱', label: 'Phone and distractions', guideId: 'environment' },
];

export const RHYTHMS: { id: Profile['rhythm']; emoji: string; label: string }[] = [
  { id: 'morning', emoji: '🌅', label: 'Morning person' },
  { id: 'evening', emoji: '🌙', label: 'Night owl' },
  { id: 'varies', emoji: '🔀', label: 'It changes day to day' },
];

export const BUSYNESS: { id: Profile['busyness']; emoji: string; label: string }[] = [
  { id: 'calm', emoji: '☕', label: 'Fairly relaxed' },
  { id: 'busy', emoji: '🏃', label: 'Busy' },
  { id: 'very-busy', emoji: '🌪️', label: 'Very busy, little free time' },
];

export const COACH_STYLES: { id: CoachStyle; emoji: string; label: string; detail: string }[] = [
  { id: 'gentle', emoji: '🤗', label: 'Gentle', detail: 'Warm, patient and encouraging' },
  { id: 'direct', emoji: '🎯', label: 'Straight talk', detail: 'Clear, honest and to the point' },
  { id: 'cheerleader', emoji: '🎉', label: 'Cheerleader', detail: 'Upbeat and celebrates every win' },
];

/** Up to three starter habits: the first suggestion for each goal, then the second. */
export function suggestedHabits(goals: GoalId[]) {
  const picked = GOALS.filter((goal) => goals.includes(goal.id));
  const ordered = [...picked.map((goal) => goal.habits[0]), ...picked.map((goal) => goal.habits[1])];
  const unique = ordered.filter((habit, index) => ordered.findIndex((h) => h.name === habit.name) === index);
  return unique.slice(0, 3);
}

/** Guide ids that match the profile, most relevant first, without duplicates. */
export function recommendedGuideIds(profile: Profile | null): string[] {
  if (!profile) return [];
  const ids = [
    ...GOALS.filter((goal) => profile.goals.includes(goal.id)).map((goal) => goal.guideIds[0]),
    ...OBSTACLES.filter((obstacle) => profile.obstacles.includes(obstacle.id)).map((obstacle) => obstacle.guideId),
    ...GOALS.filter((goal) => profile.goals.includes(goal.id)).flatMap((goal) => goal.guideIds.slice(1)),
  ];
  return ids.filter((id, index) => ids.indexOf(id) === index);
}

export function goalLabels(goals: GoalId[]) {
  return GOALS.filter((goal) => goals.includes(goal.id)).map((goal) => goal.label);
}
