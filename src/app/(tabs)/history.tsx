import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { moodEmoji } from '@/components/mood';
import { Button, Card, Screen, ThemedText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  MIN_TREND_DAYS,
  checkInStreak,
  fromDateKey,
  longestCheckInStreak,
  moodByWeekday,
  moodTrends,
  recentDays,
} from '@/lib/journal-math';
import { useJournal } from '@/lib/journal-store';
import { usePremium } from '@/lib/premium';

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function HistoryScreen() {
  const theme = useTheme();
  const { entries, habits, activeHabits, today, restDays } = useJournal();
  const { isPlus } = usePremium();
  const trends = moodTrends(entries, activeHabits, today).slice(0, 4);
  const weekdays = moodByWeekday(entries);
  const bestWeekday = weekdays.filter((mood) => mood !== null).length >= 3
    ? weekdays.indexOf(Math.max(...weekdays.map((mood) => mood ?? 0)))
    : null;
  const lastTwoWeeks = recentDays(entries, today, 14);
  const list = Object.values(entries).sort((a, b) => b.date.localeCompare(a.date));
  const habitById = Object.fromEntries(habits.map((habit) => [habit.id, habit]));

  return (
    <Screen>
      <ThemedText type="title">History</ThemedText>

      <View style={styles.stats}>
        <Card style={styles.stat}>
          <ThemedText type="label" color="textSecondary">Check-ins</ThemedText>
          <ThemedText type="title">{list.length}</ThemedText>
        </Card>
        <Card style={styles.stat}>
          <ThemedText type="label" color="textSecondary">Streak</ThemedText>
          <ThemedText type="title">{checkInStreak(entries, today, restDays)}</ThemedText>
        </Card>
        <Card style={styles.stat}>
          <ThemedText type="label" color="textSecondary">Best</ThemedText>
          <ThemedText type="title">{longestCheckInStreak(entries, restDays)}</ThemedText>
        </Card>
      </View>

      <Card>
        <ThemedText type="heading">Mood, last 14 days</ThemedText>
        <View style={styles.chart} accessibilityLabel="Mood chart for the last 14 days">
          {lastTwoWeeks.map(({ date, entry }) => (
            <View key={date} style={styles.barColumn}>
              <View style={[styles.barTrack, { backgroundColor: theme.background }]}>
                {entry && (
                  <View
                    style={[
                      styles.bar,
                      { height: `${entry.mood * 20}%`, backgroundColor: entry.mood >= 3 ? theme.accent : theme.warm },
                    ]}
                  />
                )}
              </View>
              <ThemedText type="small" color="textSecondary" style={styles.barLabel}>
                {fromDateKey(date).toLocaleDateString(undefined, { weekday: 'narrow' })}
              </ThemedText>
            </View>
          ))}
        </View>
      </Card>

      <Card>
        <ThemedText type="heading">📈 Mood trends</ThemedText>
        {!isPlus ? (
          <>
            <ThemedText color="textSecondary">
              See which habits go with your better days, and which day of the week feels best.
            </ThemedText>
            <Button title="Unlock with SteadyThrive Plus" variant="secondary" onPress={() => router.push('/paywall')} />
          </>
        ) : trends.length === 0 ? (
          <ThemedText color="textSecondary">
            Keep checking in. Once a habit has at least {MIN_TREND_DAYS} days done and {MIN_TREND_DAYS} days skipped,
            you'll see how it lines up with your mood.
          </ThemedText>
        ) : (
          <>
            <ThemedText type="small" color="textSecondary">Average mood out of 5, last 60 days</ThemedText>
            {trends.map((trend) => {
              const lift = Math.round((trend.withHabit - trend.withoutHabit) * 10) / 10;
              return (
                <View key={trend.habit.id} style={styles.trend}>
                  <ThemedText>
                    {trend.habit.emoji} {trend.habit.name}
                  </ThemedText>
                  <TrendBar label={trend.habit.quit ? 'Stayed away' : 'Did it'} value={trend.withHabit} color={theme.accent} />
                  <TrendBar label={trend.habit.quit ? "Didn't" : 'Skipped'} value={trend.withoutHabit} color={theme.warm} />
                  <ThemedText type="small" color="textSecondary">
                    {lift > 0.2
                      ? `You tend to feel better on days you ${trend.habit.quit ? 'stay away from it' : 'do this'}.`
                      : lift < -0.2
                        ? 'Your mood tends to be a little lower on these days. Worth noticing.'
                        : 'No clear link with your mood yet.'}
                  </ThemedText>
                </View>
              );
            })}
          </>
        )}
        {isPlus && bestWeekday !== null && (
          <ThemedText type="small" color="textSecondary">
            Your best day of the week so far: {WEEKDAYS[bestWeekday]} ({weekdays[bestWeekday]} out of 5).
          </ThemedText>
        )}
      </Card>

      {list.length === 0 ? (
        <Card>
          <ThemedText color="textSecondary">Your check-ins will show up here.</ThemedText>
        </Card>
      ) : (
        list.map((entry) => (
          <Card key={entry.date}>
            <View style={styles.entryHeader}>
              <Text style={{ fontSize: 28 }}>{moodEmoji(entry.mood)}</Text>
              <ThemedText type="heading" style={{ flex: 1 }}>
                {fromDateKey(entry.date).toLocaleDateString(undefined, {
                  weekday: 'long',
                  month: 'short',
                  day: 'numeric',
                })}
              </ThemedText>
            </View>
            {entry.habitIds.length > 0 && (
              <ThemedText color="textSecondary">
                {entry.habitIds
                  .map((id) => habitById[id])
                  .filter(Boolean)
                  .map((habit) => `${habit.emoji} ${habit.name}`)
                  .join('   ')}
              </ThemedText>
            )}
            {entry.note.length > 0 && <ThemedText>{entry.note}</ThemedText>}
          </Card>
        ))
      )}
    </Screen>
  );
}

function TrendBar({ label, value, color }: { label: string; value: number; color: string }) {
  const theme = useTheme();
  return (
    <View style={styles.trendRow} accessibilityLabel={`${label}: ${value} out of 5`}>
      <ThemedText type="small" color="textSecondary" style={styles.trendLabel}>{label}</ThemedText>
      <View style={[styles.trendTrack, { backgroundColor: theme.background }]}>
        <View style={[styles.trendFill, { width: `${(value / 5) * 100}%`, backgroundColor: color }]} />
      </View>
      <ThemedText type="small" style={styles.trendValue}>{value.toFixed(1)}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  trend: { gap: Spacing.one, paddingTop: Spacing.two },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
  trendLabel: { width: 96 },
  trendTrack: { flex: 1, height: 12, borderRadius: 6, overflow: 'hidden' },
  trendFill: { height: '100%', borderRadius: 6 },
  trendValue: { width: 28, textAlign: 'right', fontWeight: '600' },
  stats: { flexDirection: 'row', gap: Spacing.two },
  stat: { flex: 1, alignItems: 'center' },
  chart: { flexDirection: 'row', gap: Spacing.one, height: 120, alignItems: 'flex-end' },
  barColumn: { flex: 1, alignItems: 'center', gap: Spacing.one, height: '100%' },
  barTrack: { flex: 1, width: '100%', borderRadius: Radius.small / 2, justifyContent: 'flex-end', overflow: 'hidden' },
  bar: { width: '100%', borderRadius: Radius.small / 2 },
  barLabel: { fontSize: 11, lineHeight: 14 },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
