import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Choice } from '@/components/choice';
import { Button, Card, Screen, ThemedText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useJournal } from '@/lib/journal-store';
import { describeReminders } from '@/lib/reminder-times';

// Monday first, the way most people think about their week. Values are JS weekdays (0 = Sunday).
const WEEK = [
  { day: 1, short: 'Mon' },
  { day: 2, short: 'Tue' },
  { day: 3, short: 'Wed' },
  { day: 4, short: 'Thu' },
  { day: 5, short: 'Fri' },
  { day: 6, short: 'Sat' },
  { day: 0, short: 'Sun' },
];

export default function HabitScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeHabits, updateHabit, archiveHabit } = useJournal();
  const habit = activeHabits.find((h) => h.id === id);

  const [name, setName] = useState(habit?.name ?? '');
  const [emoji, setEmoji] = useState(habit?.emoji ?? '');
  const [quit, setQuit] = useState(habit?.quit ?? false);
  const [days, setDays] = useState<number[]>(habit?.days?.length ? habit.days : WEEK.map((d) => d.day));

  if (!habit) {
    return (
      <Screen tabBar={false}>
        <BackLink />
        <ThemedText>This habit could not be found.</ThemedText>
      </Screen>
    );
  }

  const everyDay = days.length === 7;

  function toggleDay(day: number) {
    setDays((current) => {
      const next = current.includes(day) ? current.filter((d) => d !== day) : [...current, day];
      return next.length === 0 ? current : next;
    });
  }

  function save() {
    if (!habit || !name.trim()) return;
    updateHabit(habit.id, {
      name: name.trim(),
      emoji: emoji.trim() || habit.emoji,
      quit: quit || undefined,
      days: everyDay ? undefined : [...days].sort(),
    });
    router.back();
  }

  function confirmRemove() {
    if (!habit) return;
    Alert.alert(`Remove "${habit.name}"?`, 'Your past check-ins for this habit are kept.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          archiveHabit(habit.id);
          router.back();
        },
      },
    ]);
  }

  const inputStyle = [styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }];

  return (
    <Screen tabBar={false}>
      <BackLink />
      <ThemedText type="title">Edit habit</ThemedText>

      <Card>
        <ThemedText type="heading">Name</ThemedText>
        <View style={styles.nameRow}>
          <TextInput value={emoji} onChangeText={setEmoji} maxLength={2} style={[inputStyle, styles.emojiInput]} />
          <TextInput value={name} onChangeText={setName} maxLength={40} style={[inputStyle, { flex: 1 }]} />
        </View>
      </Card>

      <Card>
        <ThemedText type="heading">Type</ThemedText>
        <Choice
          emoji="🌱"
          label="A habit to build"
          detail="Tick it on days you do it, like drinking water or reading."
          selected={!quit}
          onPress={() => setQuit(false)}
        />
        <Choice
          emoji="🚭"
          label="A habit to quit"
          detail="Tick it on days you stay away from it, like smoking or late-night scrolling."
          selected={quit}
          onPress={() => setQuit(true)}
        />
      </Card>

      <Card>
        <ThemedText type="heading">Which days?</ThemedText>
        <ThemedText type="small" color="textSecondary">
          {everyDay ? 'Every day.' : 'Only on the days you pick. Other days never break your streak.'}
        </ThemedText>
        <View style={styles.days}>
          {WEEK.map(({ day, short }) => {
            const on = days.includes(day);
            return (
              <Pressable
                key={day}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={short}
                onPress={() => toggleDay(day)}
                style={[
                  styles.day,
                  { borderColor: theme.accent, backgroundColor: on ? theme.accent : theme.background },
                ]}>
                <ThemedText type="small" style={{ fontWeight: '600', color: on ? theme.accentText : theme.accent }}>
                  {short}
                </ThemedText>
              </Pressable>
            );
          })}
        </View>
        {!everyDay && (
          <Pressable accessibilityRole="button" onPress={() => setDays(WEEK.map((d) => d.day))} hitSlop={8}>
            <ThemedText type="small" color="accent" style={{ fontWeight: '600' }}>Make it every day</ThemedText>
          </Pressable>
        )}
      </Card>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push({ pathname: '/reminders/[id]', params: { id: habit.id } })}
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
        <Card style={styles.reminderCard}>
          <Text style={{ fontSize: 24 }}>⏰</Text>
          <View style={{ flex: 1 }}>
            <ThemedText type="heading">Reminders</ThemedText>
            <ThemedText type="small" color="textSecondary">
              {describeReminders(habit.reminders) ?? 'None yet. Tap to add one.'}
            </ThemedText>
          </View>
          <ThemedText type="heading" color="accent">›</ThemedText>
        </Card>
      </Pressable>

      <Button title="Save" onPress={save} disabled={!name.trim()} />
      <Button title="Remove habit" variant="ghost" onPress={confirmRemove} />
    </Screen>
  );
}

function BackLink() {
  return (
    <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12}>
      <ThemedText color="accent" style={{ fontWeight: '600' }}>‹ Back</ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  nameRow: { flexDirection: 'row', gap: Spacing.two },
  input: { borderWidth: 1, borderRadius: Radius.small, paddingHorizontal: Spacing.three, height: 48, fontSize: 16 },
  emojiInput: { width: 56, textAlign: 'center', paddingHorizontal: 0 },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  day: { minWidth: 48, borderWidth: 1, borderRadius: Radius.large, paddingVertical: Spacing.two, alignItems: 'center' },
  reminderCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
});
