import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { MoodPicker } from '@/components/mood';
import { Button, Card, Screen, ThemedText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { tipForDate } from '@/content/guides';
import { recommendedGuideIds } from '@/content/interview';
import { useTheme } from '@/hooks/use-theme';
import { REST_DAYS_PER_WEEK, checkInStreak, habitStreak, isPlannedOn, restDaysUsedInWeek } from '@/lib/journal-math';
import { useJournal } from '@/lib/journal-store';
import type { Mood } from '@/lib/types';

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export default function TodayScreen() {
  const theme = useTheme();
  const { ready, today, entries, activeHabits, profile, restDays, saveEntry, setRestDay } = useJournal();
  const existing = entries[today];

  const [mood, setMood] = useState<Mood | null>(null);
  const [habitIds, setHabitIds] = useState<string[]>([]);
  const [note, setNote] = useState('');
  const [justSaved, setJustSaved] = useState(false);

  // Load today's check-in once storage is ready, so reopening the app shows what was saved.
  useEffect(() => {
    if (!ready || !existing) return;
    setMood(existing.mood);
    setHabitIds(existing.habitIds);
    setNote(existing.note);
  }, [ready, existing]);

  const streak = checkInStreak(entries, today, restDays);
  const resting = restDays[today] === true;
  const restLeft = REST_DAYS_PER_WEEK - restDaysUsedInWeek(restDays, today);
  const plannedToday = activeHabits.filter((habit) => isPlannedOn(habit, today));
  const notToday = activeHabits.filter((habit) => !isPlannedOn(habit, today));
  const tip = tipForDate(today, recommendedGuideIds(profile));
  const firstName = profile?.name.split(' ')[0];
  const dirty =
    mood !== (existing?.mood ?? null) ||
    note.trim() !== (existing?.note ?? '') ||
    [...habitIds].sort().join() !== [...(existing?.habitIds ?? [])].sort().join();

  function toggleHabit(id: string) {
    Haptics.selectionAsync().catch(() => {});
    setJustSaved(false);
    setHabitIds((current) => (current.includes(id) ? current.filter((h) => h !== id) : [...current, id]));
  }

  function save() {
    if (mood === null) return;
    saveEntry(today, { mood, habitIds, note });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    setJustSaved(true);
  }

  return (
    <Screen>
      <View>
        <ThemedText type="label" color="textSecondary">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </ThemedText>
        <ThemedText type="title">{firstName ? `${greeting()}, ${firstName}` : greeting()}</ThemedText>
      </View>

      <Card style={[styles.streak, { backgroundColor: theme.accent, borderColor: theme.accent }]}>
        <Text style={styles.streakEmoji}>{streak > 0 ? '🔥' : '🌱'}</Text>
        <View style={{ flex: 1 }}>
          <ThemedText type="heading" style={{ color: theme.accentText }}>
            {streak > 0 ? `${streak} day streak` : 'Start your streak'}
          </ThemedText>
          <ThemedText type="small" style={{ color: theme.accentText, opacity: 0.85 }}>
            {resting
              ? 'Rest day. Your streaks are safe.'
              : existing
                ? 'You checked in today. See you tomorrow.'
                : 'Check in today to keep it going.'}
          </ThemedText>
        </View>
      </Card>

      <Pressable
        accessibilityRole="button"
        accessibilityHint="Opens the guide for this tip"
        onPress={() => router.push({ pathname: '/guides/[id]', params: { id: tip.guideId } })}
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
        <Card style={styles.tip}>
          <Text style={styles.tipEmoji}>💡</Text>
          <View style={{ flex: 1, gap: Spacing.half }}>
            <ThemedText type="label" color="textSecondary">Tip of the day</ThemedText>
            <ThemedText>{tip.text}</ThemedText>
            <ThemedText type="small" color="accent" style={{ fontWeight: '600' }}>Read more ›</ThemedText>
          </View>
        </Card>
      </Pressable>

      <Card>
        <ThemedText type="heading">How are you feeling?</ThemedText>
        <MoodPicker
          value={mood}
          onChange={(value) => {
            setJustSaved(false);
            setMood(value);
          }}
        />
      </Card>

      <Card>
        <ThemedText type="heading">Today's habits</ThemedText>
        {activeHabits.length === 0 && (
          <ThemedText color="textSecondary">Add a habit in Settings to start tracking it.</ThemedText>
        )}
        {plannedToday.map((habit) => {
          const done = habitIds.includes(habit.id);
          const days = habitStreak(entries, habit, today, restDays);
          return (
            <Pressable
              key={habit.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: done }}
              onPress={() => toggleHabit(habit.id)}
              style={[
                styles.habit,
                { backgroundColor: done ? theme.accentSoft : theme.background, borderColor: done ? theme.accent : theme.border },
              ]}>
              <Text style={styles.habitEmoji}>{habit.emoji}</Text>
              <View style={{ flex: 1 }}>
                <ThemedText>{habit.name}</ThemedText>
                {habit.quit ? (
                  <ThemedText type="small" color="textSecondary">
                    {days > 0 ? `${days} day${days === 1 ? '' : 's'} free 💪` : 'Tick it if you stayed away today'}
                  </ThemedText>
                ) : (
                  days > 0 && (
                    <ThemedText type="small" color="textSecondary">
                      {days} {habit.days?.length ? 'planned day' : 'day'}
                      {days === 1 ? '' : 's'} in a row
                    </ThemedText>
                  )
                )}
              </View>
              <View style={[styles.check, { borderColor: theme.accent, backgroundColor: done ? theme.accent : 'transparent' }]}>
                {done && <Text style={{ color: theme.accentText, fontWeight: '700' }}>✓</Text>}
              </View>
            </Pressable>
          );
        })}
        {notToday.length > 0 && (
          <ThemedText type="small" color="textSecondary">
            Not planned today: {notToday.map((habit) => `${habit.emoji} ${habit.name}`).join(', ')}
          </ThemedText>
        )}
        {activeHabits.length > 0 && !activeHabits.some((habit) => habit.reminders) && (
          <Pressable accessibilityRole="link" hitSlop={8} onPress={() => router.navigate('/settings')}>
            <ThemedText type="small" color="accent" style={{ fontWeight: '600' }}>
              ⏰ Want a nudge? Set daily reminders
            </ThemedText>
          </Pressable>
        )}
      </Card>

      <Card>
        <ThemedText type="heading">Anything on your mind?</ThemedText>
        <TextInput
          value={note}
          onChangeText={(text) => {
            setJustSaved(false);
            setNote(text);
          }}
          placeholder="A few words about your day (optional)"
          placeholderTextColor={theme.textSecondary}
          multiline
          maxLength={600}
          style={[styles.note, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
        />
      </Card>

      <Button
        title={justSaved && !dirty ? 'Saved ✓' : existing ? 'Update check-in' : 'Save check-in'}
        onPress={save}
        disabled={mood === null || (!dirty && !!existing)}
      />
      {mood === null && (
        <ThemedText type="small" color="textSecondary" style={{ textAlign: 'center' }}>
          Pick a mood to save today's check-in.
        </ThemedText>
      )}

      <Card style={styles.rest}>
        <Text style={styles.tipEmoji}>😌</Text>
        <View style={{ flex: 1, gap: Spacing.half }}>
          <ThemedText type="heading">{resting ? 'Taking a rest day' : 'Need a break?'}</ThemedText>
          <ThemedText type="small" color="textSecondary">
            {resting
              ? "Today won't count against any streak. Rest well."
              : `Take a rest day and your streaks stay safe. ${restLeft > 0 ? `${restLeft} of ${REST_DAYS_PER_WEEK}` : 'None'} left this week.`}
          </ThemedText>
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            disabled={!resting && restLeft <= 0}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              setRestDay(today, !resting);
            }}>
            <ThemedText
              type="small"
              color={!resting && restLeft <= 0 ? 'textSecondary' : 'accent'}
              style={{ fontWeight: '600' }}>
              {resting ? 'Undo rest day' : 'Make today a rest day'}
            </ThemedText>
          </Pressable>
        </View>
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({
  streak: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  streakEmoji: { fontSize: 36 },
  tip: { flexDirection: 'row', gap: Spacing.three },
  tipEmoji: { fontSize: 28 },
  rest: { flexDirection: 'row', gap: Spacing.three },
  habit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.small,
    borderWidth: 1.5,
  },
  habitEmoji: { fontSize: 24 },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  note: {
    minHeight: 96,
    borderWidth: 1,
    borderRadius: Radius.small,
    padding: Spacing.three,
    fontSize: 16,
    textAlignVertical: 'top',
  },
});
