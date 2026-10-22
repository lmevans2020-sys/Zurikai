/** Mood on a 1 (rough) to 5 (great) scale. */
export type Mood = 1 | 2 | 3 | 4 | 5;

export type Habit = {
  id: string;
  name: string;
  emoji: string;
  createdAt: string;
  archived?: boolean;
};

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
