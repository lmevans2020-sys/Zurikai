import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { toDateKey } from '@/lib/journal-math';
import type { Entry, Habit, Mood, Reflection } from '@/lib/types';

// Everything is stored on the device for now. When accounts are added, this is the one file
// that needs to sync to a server.
const STORAGE_KEY = 'zurikai/journal/v1';

type JournalData = {
  habits: Habit[];
  entries: Record<string, Entry>;
  reflections: Record<string, Reflection>;
};

const STARTER_HABITS: Omit<Habit, 'createdAt'>[] = [
  { id: 'water', name: 'Drink water', emoji: '💧' },
  { id: 'move', name: 'Move my body', emoji: '🚶' },
  { id: 'sleep', name: 'Sleep 7+ hours', emoji: '😴' },
];

function starterData(): JournalData {
  const createdAt = new Date().toISOString();
  return {
    habits: STARTER_HABITS.map((habit) => ({ ...habit, createdAt })),
    entries: {},
    reflections: {},
  };
}

type JournalContextValue = JournalData & {
  ready: boolean;
  today: string;
  activeHabits: Habit[];
  saveEntry: (date: string, entry: { mood: Mood; habitIds: string[]; note: string }) => void;
  addHabit: (name: string, emoji: string) => void;
  archiveHabit: (id: string) => void;
  saveReflection: (reflection: Reflection) => void;
  resetAll: () => void;
};

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

  const addHabit = useCallback<JournalContextValue['addHabit']>((name, emoji) => {
    const habit: Habit = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      name: name.trim(),
      emoji: emoji.trim() || '✨',
      createdAt: new Date().toISOString(),
    };
    setData((current) => ({ ...current, habits: [...current.habits, habit] }));
  }, []);

  // Archived rather than deleted so past check-ins keep their history.
  const archiveHabit = useCallback<JournalContextValue['archiveHabit']>((id) => {
    setData((current) => ({
      ...current,
      habits: current.habits.map((habit) => (habit.id === id ? { ...habit, archived: true } : habit)),
    }));
  }, []);

  const saveReflection = useCallback<JournalContextValue['saveReflection']>((reflection) => {
    setData((current) => ({
      ...current,
      reflections: { ...current.reflections, [reflection.weekStart]: reflection },
    }));
  }, []);

  const resetAll = useCallback(() => setData(starterData()), []);

  const value = useMemo<JournalContextValue>(
    () => ({
      ...data,
      ready,
      today,
      activeHabits: data.habits.filter((habit) => !habit.archived),
      saveEntry,
      addHabit,
      archiveHabit,
      saveReflection,
      resetAll,
    }),
    [data, ready, today, saveEntry, addHabit, archiveHabit, saveReflection, resetAll],
  );

  return <JournalContext.Provider value={value}>{children}</JournalContext.Provider>;
}

export function useJournal() {
  const value = useContext(JournalContext);
  if (!value) throw new Error('useJournal must be used inside <JournalProvider>');
  return value;
}
