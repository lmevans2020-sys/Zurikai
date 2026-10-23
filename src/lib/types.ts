/** Mood on a 1 (rough) to 5 (great) scale. */
export type Mood = 1 | 2 | 3 | 4 | 5;

export type Habit = {
  id: string;
  name: string;
  emoji: string;
  createdAt: string;
  archived?: boolean;
  /** Daily phone reminders for this habit. Missing or undefined means none. */
  reminders?: HabitReminders;
  /** Days of the week it's planned for, 0 = Sunday. Missing means every day. */
  days?: number[];
  /** A habit to break (e.g. smoking): ticking it means "I stayed away from it today". */
  quit?: boolean;
};

/** Days marked as rest days: streaks neither grow nor break on them. Keyed by YYYY-MM-DD. */
export type RestDays = Record<string, true>;

/**
 * Either specific times of day ("08:00", "19:00"), or a repeat such as every 2 hours from
 * 8 AM to 8 PM. Times are 24-hour "HH:MM" in local time.
 */
export type HabitReminders =
  | { kind: 'times'; times: string[] }
  | { kind: 'repeat'; everyHours: number; start: string; end: string };

/** One check-in per calendar day, keyed by its local date (YYYY-MM-DD). */
export type Entry = {
  date: string;
  mood: Mood;
  habitIds: string[];
  note: string;
  updatedAt: string;
};

export type Reflection = {
  /** Local date (YYYY-MM-DD) of the Monday that starts the week. */
  weekStart: string;
  text: string;
  createdAt: string;
  /** "ai" when the coach wrote it, "offline" when we fell back to the built-in summary. */
  source: 'ai' | 'offline';
};

export type WeekSummary = {
  weekStart: string;
  daysLogged: number;
  averageMood: number | null;
  bestDay: Entry | null;
  roughestDay: Entry | null;
  habits: { name: string; emoji: string; count: number }[];
  notes: { date: string; mood: Mood; note: string }[];
};

export type GoalId = 'sleep' | 'move' | 'stress' | 'mood' | 'eat' | 'focus' | 'growth';
export type ObstacleId = 'time' | 'motivation' | 'forgetting' | 'stress' | 'all-or-nothing' | 'distractions';
export type CoachStyle = 'gentle' | 'direct' | 'cheerleader';

/** Answers from the welcome interview. Used to pick habits, guides and the coach's tone. */
export type Profile = {
  name: string;
  goals: GoalId[];
  rhythm: 'morning' | 'evening' | 'varies';
  busyness: 'calm' | 'busy' | 'very-busy';
  obstacles: ObstacleId[];
  coachStyle: CoachStyle;
  /** Free text: anything else they want the coach to know. */
  about: string;
  completedAt: string;
};

export type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  createdAt: string;
  /** Set on a coach message that is an error notice rather than a real reply. */
  failed?: boolean;
};

/** The guided challenge someone is doing now (see src/content/challenges.ts). */
export type ActiveChallenge = {
  id: string;
  startedOn: string;
  /** How many steps are done. The next step is steps[done]. */
  done: number;
  /** Date of the last step done, so there is at most one step a day. */
  lastDoneOn: string | null;
};
