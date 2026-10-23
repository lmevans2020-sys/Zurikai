import type { GoalId } from '../lib/types.ts';

// Guided challenges: a short run of days, each with one small step. Plain data, so new
// challenges can be added here without touching screen code.

export type Challenge = {
  id: string;
  emoji: string;
  title: string;
  summary: string;
  /** Goals from the welcome interview this challenge suits, for recommendations. */
  goals: GoalId[];
  /** One small step per day, in order. */
  steps: string[];
};

export const CHALLENGES: Challenge[] = [
  {
    id: 'sleep-reset',
    emoji: '😴',
    title: '7-day sleep reset',
    summary: 'Small evening changes for deeper, steadier sleep.',
    goals: ['sleep'],
    steps: [
      'Pick a bedtime you can keep all week, and set a reminder 30 minutes before it.',
      'Put your phone across the room (or outside the bedroom) when you go to bed.',
      'No caffeine after 2 PM today.',
      'Get 10 minutes of daylight within an hour of waking up.',
      'Dim the lights an hour before bed and do something calm: read, stretch or listen to music.',
      'Write tomorrow’s to-do list before bed so your mind can let go.',
      'Look back: which change helped most? Keep that one going.',
    ],
  },
  {
    id: 'calm-week',
    emoji: '🌿',
    title: '7 days of calm',
    summary: 'A few quiet minutes a day to take the edge off stress.',
    goals: ['stress', 'mood'],
    steps: [
      'Do the one-minute breather (Learn tab) once today.',
      'Take a 10-minute walk without your phone.',
      'Write down one thing that’s worrying you, and one small thing you can do about it.',
      'Do the one-minute breather before a moment you usually find stressful.',
      'Say no to one thing you don’t have room for.',
      'Spend 15 minutes on something you enjoy, just for you.',
      'Look back: when did you feel calmest this week? Plan more of that.',
    ],
  },
  {
    id: 'move-more',
    emoji: '🚶',
    title: '5-day move more',
    summary: 'Build movement into your day without a gym.',
    goals: ['move'],
    steps: [
      'Take a 10-minute walk at any time today.',
      'Stand up and stretch every time you finish a task or meeting.',
      'Take the stairs, or park a little further away.',
      'Try a 7-minute bodyweight routine (squats, wall push-ups, marching in place).',
      'Do your favourite one from this week again and plan when it fits into next week.',
    ],
  },
  {
    id: 'hydrate',
    emoji: '💧',
    title: '7-day hydration',
    summary: 'Make drinking enough water automatic.',
    goals: ['eat', 'focus'],
    steps: [
      'Drink a glass of water as soon as you wake up.',
      'Keep a filled water bottle where you can see it all day.',
      'Have a glass of water with every meal.',
      'Set a reminder every 2 hours (tap your water habit in Settings).',
      'Swap one sugary drink for water or tea.',
      'Notice your energy in the afternoon. Does more water help?',
      'Look back: what made it easiest? Keep that going.',
    ],
  },
  {
    id: 'good-things',
    emoji: '🌤️',
    title: '7 days of good things',
    summary: 'Train your attention towards what’s going well.',
    goals: ['mood', 'growth'],
    steps: [
      'In today’s note, write three good things from today, however small.',
      'Send a short thank-you message to someone.',
      'Notice one moment today you enjoyed, and write it in your note.',
      'Do one small kind thing for someone without telling them.',
      'Write down one thing you’re proud of from this month.',
      'Spend time with someone who lifts you up, even a short call.',
      'Look back at this week’s notes. What do you want more of?',
    ],
  },
];

export function challengeById(id: string | undefined): Challenge | undefined {
  return CHALLENGES.find((challenge) => challenge.id === id);
}

/** Challenges matching their goals first. */
export function sortedChallenges(goals: GoalId[] = []): Challenge[] {
  const fits = (challenge: Challenge) => challenge.goals.some((goal) => goals.includes(goal));
  return [...CHALLENGES.filter(fits), ...CHALLENGES.filter((challenge) => !fits(challenge))];
}
