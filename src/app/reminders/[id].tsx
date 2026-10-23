import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Screen, ThemedText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useJournal } from '@/lib/journal-store';
import {
  MAX_TIMES_PER_HABIT,
  PRESET_TIMES,
  formatTime,
  normalizeTimes,
  reminderTimes,
  shiftTime,
} from '@/lib/reminder-times';
import { ensureReminderPermission, remindersSupported } from '@/lib/reminders';
import type { Habit, HabitReminders } from '@/lib/types';

const EVERY_OPTIONS = [1, 2, 3, 4];

/** A sensible starting point: water every couple of hours, everything else once a day. */
function suggestedReminders(habit: Habit, rhythm: string | undefined): HabitReminders {
  if (/water|drink|hydrat/i.test(habit.name)) return { kind: 'repeat', everyHours: 2, start: '08:00', end: '20:00' };
  return { kind: 'times', times: [rhythm === 'evening' ? '19:00' : '08:00'] };
}

export default function RemindersScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeHabits, profile, setHabitReminders } = useJournal();
  const habit = activeHabits.find((h) => h.id === id);

  const initial = habit?.reminders ?? (habit ? suggestedReminders(habit, profile?.rhythm) : null);
  const [kind, setKind] = useState<HabitReminders['kind']>(initial?.kind ?? 'times');
  const [times, setTimes] = useState<string[]>(initial?.kind === 'times' ? initial.times : ['08:00']);
  const [everyHours, setEveryHours] = useState(initial?.kind === 'repeat' ? initial.everyHours : 2);
  const [start, setStart] = useState(initial?.kind === 'repeat' ? initial.start : '08:00');
  const [end, setEnd] = useState(initial?.kind === 'repeat' ? initial.end : '20:00');
  const [saving, setSaving] = useState(false);

  if (!habit) {
    return (
      <Screen tabBar={false}>
        <BackLink />
        <ThemedText>This habit could not be found.</ThemedText>
      </Screen>
    );
  }

  const draft: HabitReminders =
    kind === 'times' ? { kind, times: normalizeTimes(times) } : { kind, everyHours, start, end };
  const preview = reminderTimes(draft);

  async function save() {
    if (!habit || preview.length === 0) return;
    setSaving(true);
    const allowed = await ensureReminderPermission();
    setHabitReminders(habit.id, draft);
    setSaving(false);
    if (remindersSupported() && !allowed) {
      Alert.alert(
        'Notifications are off',
        'Your reminders are saved, but your phone is blocking Zurikai from showing them. Turn on notifications in your phone settings.',
        [
          { text: 'Not now', style: 'cancel', onPress: () => router.back() },
          { text: 'Open settings', onPress: () => { Linking.openSettings(); router.back(); } },
        ],
      );
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    router.back();
  }

  function turnOff() {
    if (!habit) return;
    setHabitReminders(habit.id, null);
    router.back();
  }

  const unusedPresets = PRESET_TIMES.filter((preset) => !times.includes(preset.time));

  return (
    <Screen tabBar={false}>
      <BackLink />

      <View style={{ gap: Spacing.two }}>
        <Text style={{ fontSize: 48 }}>{habit.emoji}</Text>
        <ThemedText type="title">Remind me: {habit.name}</ThemedText>
        <ThemedText color="textSecondary">Your phone will give you a nudge at these times every day.</ThemedText>
      </View>

      <View style={[styles.segment, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        {(
          [
            ['times', 'At set times'],
            ['repeat', 'Every few hours'],
          ] as const
        ).map(([value, label]) => (
          <Pressable
            key={value}
            accessibilityRole="tab"
            accessibilityState={{ selected: kind === value }}
            onPress={() => setKind(value)}
            style={[styles.segmentItem, kind === value && { backgroundColor: theme.accent }]}>
            <ThemedText style={{ fontWeight: '600', color: kind === value ? theme.accentText : theme.text }}>{label}</ThemedText>
          </Pressable>
        ))}
      </View>

      {kind === 'times' ? (
        <Card>
          <ThemedText type="heading">Times</ThemedText>
          {times.map((time, index) => (
            <View key={index} style={[styles.row, { borderColor: theme.border }]}>
              <TimeStepper
                value={time}
                step={15}
                onChange={(next) => setTimes((list) => list.map((t, i) => (i === index ? next : t)))}
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Remove ${formatTime(time)}`}
                hitSlop={8}
                onPress={() => setTimes((list) => list.filter((_, i) => i !== index))}>
                <ThemedText type="small" color="danger">Remove</ThemedText>
              </Pressable>
            </View>
          ))}
          {times.length < MAX_TIMES_PER_HABIT && (
            <>
              <ThemedText type="small" color="textSecondary">Add a time</ThemedText>
              <View style={styles.chips}>
                {unusedPresets.map((preset) => (
                  <Chip
                    key={preset.time}
                    label={`${preset.label} · ${formatTime(preset.time)}`}
                    onPress={() => setTimes((list) => [...list, preset.time])}
                  />
                ))}
                <Chip
                  label="+ Another time"
                  onPress={() => setTimes((list) => [...list, list.length ? shiftTime(list[list.length - 1], 60) : '09:00'])}
                />
              </View>
            </>
          )}
        </Card>
      ) : (
        <Card>
          <ThemedText type="heading">Repeat</ThemedText>
          <ThemedText type="small" color="textSecondary">Every</ThemedText>
          <View style={styles.chips}>
            {EVERY_OPTIONS.map((hours) => (
              <Chip
                key={hours}
                label={hours === 1 ? '1 hour' : `${hours} hours`}
                selected={everyHours === hours}
                onPress={() => setEveryHours(hours)}
              />
            ))}
          </View>
          <View style={[styles.row, { borderColor: theme.border }]}>
            <ThemedText style={{ width: 64 }}>From</ThemedText>
            <TimeStepper value={start} step={30} onChange={setStart} />
          </View>
          <View style={[styles.row, { borderColor: theme.border }]}>
            <ThemedText style={{ width: 64 }}>Until</ThemedText>
            <TimeStepper value={end} step={30} onChange={setEnd} />
          </View>
          <ThemedText type="small" color="textSecondary">
            No reminders outside these hours, so your nights stay quiet.
          </ThemedText>
        </Card>
      )}

      <Card style={{ backgroundColor: theme.accentSoft, borderColor: theme.accent }}>
        <ThemedText type="label" color="accent">
          {preview.length === 0 ? 'No reminders yet' : preview.length === 1 ? '1 reminder a day' : `${preview.length} reminders a day`}
        </ThemedText>
        <ThemedText>{preview.length ? preview.map(formatTime).join(', ') : 'Add a time above.'}</ThemedText>
      </Card>

      {!remindersSupported() && (
        <ThemedText type="small" color="textSecondary">
          Reminders aren't available here. They work in the Zurikai app on a phone.
        </ThemedText>
      )}

      <Button title="Save reminders" onPress={save} loading={saving} disabled={preview.length === 0} />
      {habit.reminders && <Button title="Turn off reminders" variant="ghost" onPress={turnOff} />}
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

function TimeStepper({ value, step, onChange }: { value: string; step: number; onChange: (time: string) => void }) {
  const theme = useTheme();
  const stepButton = [styles.stepButton, { borderColor: theme.border, backgroundColor: theme.background }];
  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${step} minutes earlier`}
        onPress={() => onChange(shiftTime(value, -step))}
        style={stepButton}>
        <ThemedText type="heading" color="accent">−</ThemedText>
      </Pressable>
      <ThemedText type="heading" style={styles.time}>{formatTime(value)}</ThemedText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${step} minutes later`}
        onPress={() => onChange(shiftTime(value, step))}
        style={stepButton}>
        <ThemedText type="heading" color="accent">+</ThemedText>
      </Pressable>
    </View>
  );
}

function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[
        styles.chip,
        { borderColor: theme.accent, backgroundColor: selected ? theme.accent : theme.background },
      ]}>
      <ThemedText type="small" style={{ color: selected ? theme.accentText : theme.accent, fontWeight: '600' }}>
        {label}
      </ThemedText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  segment: { flexDirection: 'row', borderWidth: 1, borderRadius: Radius.medium, padding: 4, gap: 4 },
  segmentItem: { flex: 1, alignItems: 'center', paddingVertical: Spacing.two, borderRadius: Radius.small },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  stepButton: { width: 40, height: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  time: { minWidth: 104, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.two },
  chip: { borderWidth: 1, borderRadius: Radius.large, paddingHorizontal: Spacing.three, paddingVertical: Spacing.two },
});
