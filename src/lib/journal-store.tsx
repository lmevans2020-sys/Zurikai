import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { toDateKey } from '@/lib/journal-math';
import type { ChatMessage, Entry, Habit, HabitReminders, Mood, Profile, Reflection, RestDays } from '@/lib/types';

// Everything is stored on the device for now. When accounts are added, this is the one file
// that needs to sync to a server.
const STORAGE_KEY = 'zurikai/journal/v1';

type JournalData = {
  profile: Profile | null;
  habits: Habit[];
  entries: Record<string, Entry>;
  reflections: Record<string, Reflection>;
  chat: ChatMessage[];
  restDays: RestDays;
};

// Keep the saved conversation small; only the latest turns are sent to the coach anyway.
const MAX_SAVED_CHAT = 200;

const STARTER_HABITS: Omit<Habit, 'createdAt'>[] = [
  { id: 'water', name: 'Drink water', emoji: '💧' },
  { id: 'move', name: 'Move my body', emoji: '🚶' },
  { id: 'sleep', name: 'Sleep 7+ hours', emoji: '😴' },
];

function starterData(): JournalData {
  const createdAt = new Date().toISOString();
  return {
    profile: null,
    habits: STARTER_HABITS.map((habit) => ({ ...habit, createdAt })),
    entries: {},
    reflections: {},
    chat: [],
    restDays: {},
  };
}

type JournalContextValue = JournalData & {
  ready: boolean;
  today: string;
  activeHabits: Habit[];
  saveEntry: (date: string, entry: { mood: Mood; habitIds: string[]; note: string }) => void;
  addHabit: (name: string, emoji: string, options?: Pick<Habit, 'quit' | 'days'>) => void;
  /** Changes a habit's name, emoji, planned days or build/quit type. */
  updateHabit: (id: string, changes: Partial<Pick<Habit, 'name' | 'emoji' | 'quit' | 'days'>>) => void;
  /** Marks or unmarks a day as a rest day. */
  setRestDay: (date: string, resting: boolean) => void;
  archiveHabit: (id: string) => void;
  /** Pass null to turn a habit's reminders off. */
  setHabitReminders: (id: string, reminders: HabitReminders | null) => void;
  saveReflection: (reflection: Reflection) => void;
  /**
   * Saves the welcome interview. `habits` is the full list the person chose: entries with an
   * `id` are existing habits to keep, the rest are created. Active habits not chosen are archived.
   */
  completeInterview: (profile: Profile, habits: { id?: string; name: string; emoji: string }[]) => void;
  addChatMessage: (message: Omit<ChatMessage, 'id' | 'createdAt'>) => void;
  clearChat: () => void;
  resetAll: () => void;
};

function newId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

const JournalContext = createContext<JournalContextValue | null>(null);

export function JournalProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<JournalData>(starterData);
  const [ready, setReady] = useState(false);
  const today = toDateKey(new Date());

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setData({ ...starterData(), ...JSON.parse(raw) });
      })
      .catch((error) => console.warn('Could not load journal', error))
      .finally(() => setReady(true));
  }, []);

  // Write through on every change once the first load is done, so nothing is lost if the
  // app is closed right after a check-in.
  useEffect(() => {
    if (!ready) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data)).catch((error) =>
      console.warn('Could not save journal', error),
    );
  }, [data, ready]);

  const saveEntry = useCallback<JournalContextValue['saveEntry']>((date, entry) => {
    setData((current) => ({
      ...current,
      entries: {
        ...current.entries,
        [date]: { date, ...entry, note: entry.note.trim(), updatedAt: new Date().toISOString() },
      },
    }));
  }, []);

  const addHabit = useCallback<JournalContextValue['addHabit']>((name, emoji, options) => {
    const habit: Habit = {
      id: newId(),
      name: name.trim(),
      emoji: emoji.trim() || '✨',
      createdAt: new Date().toISOString(),
      ...options,
    };
    setData((current) => ({ ...current, habits: [...current.habits, habit] }));
  }, []);

  const updateHabit = useCallback<JournalContextValue['updateHabit']>((id, changes) => {
    setData((current) => ({
      ...current,
      habits: current.habits.map((habit) => (habit.id === id ? { ...habit, ...changes } : habit)),
    }));
  }, []);

  const setRestDay = useCallback<JournalContextValue['setRestDay']>((date, resting) => {
    setData((current) => {
      const restDays = { ...current.restDays };
      if (resting) restDays[date] = true;
      else delete restDays[date];
      return { ...current, restDays };
    });
  }, []);

  // Archived rather than deleted so past check-ins keep their history.
  const archiveHabit = useCallback<JournalContextValue['archiveHabit']>((id) => {
    setData((current) => ({
      ...current,
      habits: current.habits.map((habit) => (habit.id === id ? { ...habit, archived: true } : habit)),
    }));
  }, []);

  const setHabitReminders = useCallback<JournalContextValue['setHabitReminders']>((id, reminders) => {
    setData((current) => ({
      ...current,
      habits: current.habits.map((habit) =>
        habit.id === id ? { ...habit, reminders: reminders ?? undefined } : habit,
      ),
    }));
  }, []);

  const saveReflection = useCallback<JournalContextValue['saveReflection']>((reflection) => {
    setData((current) => ({
      ...current,
      reflections: { ...current.reflections, [reflection.weekStart]: reflection },
    }));
  }, []);

  const completeInterview = useCallback<JournalContextValue['completeInterview']>((profile, chosen) => {
    setData((current) => {
      const keptIds = new Set(chosen.flatMap((habit) => (habit.id ? [habit.id] : [])));
      const createdAt = new Date().toISOString();
      const created: Habit[] = chosen
        .filter((habit) => !habit.id)
        .map((habit) => ({ id: newId(), name: habit.name, emoji: habit.emoji, createdAt }));
      return {
        ...current,
        profile,
        habits: [
          ...current.habits.map((habit) =>
            habit.archived || keptIds.has(habit.id) ? habit : { ...habit, archived: true },
          ),
          ...created,
        ],
      };
    });
  }, []);

  const addChatMessage = useCallback<JournalContextValue['addChatMessage']>((message) => {
    const full: ChatMessage = { ...message, id: newId(), createdAt: new Date().toISOString() };
    setData((current) => ({ ...current, chat: [...current.chat, full].slice(-MAX_SAVED_CHAT) }));
  }, []);

  const clearChat = useCallback(() => setData((current) => ({ ...current, chat: [] })), []);

  const resetAll = useCallback(() => setData(starterData()), []);

  const value = useMemo<JournalContextValue>(
    () => ({
      ...data,
      ready,
      today,
      activeHabits: data.habits.filter((habit) => !habit.archived),
      saveEntry,
      addHabit,
      updateHabit,
      setRestDay,
      archiveHabit,
      setHabitReminders,
      saveReflection,
      completeInterview,
      addChatMessage,
      clearChat,
      resetAll,
    }),
    [
      data,
      ready,
      today,
      saveEntry,
      addHabit,
      updateHabit,
      setRestDay,
      archiveHabit,
      setHabitReminders,
      saveReflection,
      completeInterview,
      addChatMessage,
      clearChat,
      resetAll,
    ],
  );

  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>;
}

export function useJournal() {
  const value = useContext(JournalContext);
  if (!value) throw new Error('useJournal must be used inside <JournalProvider>');
  return value;
}
