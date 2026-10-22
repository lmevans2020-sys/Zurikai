import { StyleSheet, Text, View } from 'react-native';

import { moodEmoji } from '@/components/mood';
import { Card, Screen, ThemedText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { checkInStreak, fromDateKey, longestCheckInStreak, recentDays } from '@/lib/journal-math';
import { useJournal } from '@/lib/journal-store';

export default function HistoryScreen() {
  const theme = useTheme();
  const { entries, habits, today } = useJournal();
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
          <ThemedText type="title">{checkInStreak(entries, today)}</ThemedText>
        </Card>
        <Card style={styles.stat}>
          <ThemedText type="label" color="textSecondary">Best</ThemedText>
          <ThemedText type="title">{longestCheckInStreak(entries)}</ThemedText>
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

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', gap: Spacing.two },
  stat: { flex: 1, alignItems: 'center' },
  chart: { flexDirection: 'row', gap: Spacing.one, height: 120, alignItems: 'flex-end' },
  barColumn: { flex: 1, alignItems: 'center', gap: Spacing.one, height: '100%' },
  barTrack: { flex: 1, width: '100%', borderRadius: Radius.small / 2, justifyContent: 'flex-end', overflow: 'hidden' },
  bar: { width: '100%', borderRadius: Radius.small / 2 },
  barLabel: { fontSize: 11, lineHeight: 14 },
  entryHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.two },
});
