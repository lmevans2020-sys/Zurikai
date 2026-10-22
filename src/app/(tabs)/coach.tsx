import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Button, Card, Screen, ThemedText } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { requestReflection } from '@/lib/coach';
import { addDays, fromDateKey, startOfWeek, summarizeWeek } from '@/lib/journal-math';
import { useJournal } from '@/lib/journal-store';
import { usePremium } from '@/lib/premium';

function weekLabel(weekStart: string) {
  const format = (key: string) => fromDateKey(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${format(weekStart)} to ${format(addDays(weekStart, 6))}`;
}

export default function CoachScreen() {
  const { entries, habits, reflections, today, saveReflection } = useJournal();
  const { isPlus } = usePremium();
  const [loading, setLoading] = useState(false);

  const weekStart = startOfWeek(today);
  const summary = summarizeWeek(entries, habits, weekStart);
  const current = reflections[weekStart];
  const past = Object.values(reflections)
    .filter((reflection) => reflection.weekStart !== weekStart)
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart));

  async function reflect() {
    setLoading(true);
    try {
      saveReflection(await requestReflection(summary));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View>
        <ThemedText type="title">Your coach</ThemedText>
        <ThemedText color="textSecondary">A reflection on your week, written just for you.</ThemedText>
      </View>

      <Card>
        <ThemedText type="label" color="textSecondary">This week · {weekLabel(weekStart)}</ThemedText>
        <View style={styles.statsRow}>
          <ThemedText>📅 {summary.daysLogged} of 7 days</ThemedText>
          {summary.averageMood !== null && <ThemedText>💭 Mood {summary.averageMood} / 5</ThemedText>}
        </View>
      </Card>

      {!isPlus ? (
        <Card style={{ alignItems: 'center', paddingVertical: Spacing.four }}>
          <Text style={{ fontSize: 40 }}>🧭</Text>
          <ThemedText type="heading" style={{ textAlign: 'center' }}>Weekly coaching is part of Zurikai Plus</ThemedText>
          <ThemedText color="textSecondary" style={{ textAlign: 'center' }}>
            Every week your coach reads your check-ins and helps you spot what's working.
          </ThemedText>
          <View style={{ alignSelf: 'stretch', marginTop: Spacing.two }}>
            <Button title="Try Zurikai Plus" onPress={() => router.push('/paywall')} />
          </View>
        </Card>
      ) : current ? (
        <Card>
          <ThemedText type="heading">This week's reflection</ThemedText>
          <ThemedText>{current.text}</ThemedText>
          {current.source === 'offline' && (
            <ThemedText type="small" color="textSecondary">
              Written offline because the coach couldn't be reached. Try again later for a full reflection.
            </ThemedText>
          )}
          <Button title="Refresh reflection" variant="secondary" onPress={reflect} loading={loading} />
        </Card>
      ) : (
        <Card>
          <ThemedText>
            {summary.daysLogged === 0
              ? 'Check in at least once this week and your coach will have something to reflect on.'
              : 'Ready when you are. Your coach will look at your check-ins so far this week.'}
          </ThemedText>
          <Button
            title="Write my reflection"
            onPress={reflect}
            loading={loading}
            disabled={summary.daysLogged === 0}
          />
        </Card>
      )}

      {isPlus && past.length > 0 && (
        <>
          <ThemedText type="heading">Past weeks</ThemedText>
          {past.map((reflection) => (
            <Card key={reflection.weekStart}>
              <ThemedText type="label" color="textSecondary">{weekLabel(reflection.weekStart)}</ThemedText>
              <ThemedText>{reflection.text}</ThemedText>
            </Card>
          ))}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsRow: { flexDirection: 'row', gap: Spacing.four, flexWrap: 'wrap' },
});
