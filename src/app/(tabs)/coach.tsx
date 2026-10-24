import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Screen, ThemedText } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { requestLetter, requestReflection } from '@/lib/coach';
import { monthKey, summarizeMonth } from '@/lib/letter';
import { addDays, fromDateKey, startOfWeek, summarizeWeek } from '@/lib/journal-math';
import { useJournal } from '@/lib/journal-store';
import { usePremium } from '@/lib/premium';

function weekLabel(weekStart: string) {
  const format = (key: string) => fromDateKey(key).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return `${format(weekStart)} to ${format(addDays(weekStart, 6))}`;
}

export default function CoachScreen() {
  const theme = useTheme();
  const { chat, entries, habits, profile, reflections, today, saveReflection, restDays, letters, coachMemory, saveLetter } =
    useJournal();
  const { isPlus } = usePremium();
  const [loading, setLoading] = useState(false);
  const [writingLetter, setWritingLetter] = useState(false);

  const month = monthKey(today);
  const monthSummary = summarizeMonth(entries, habits, restDays, month);
  const letter = letters[month];
  const pastLetters = Object.values(letters)
    .filter((l) => l.month !== month)
    .sort((a, b) => b.month.localeCompare(a.month));

  async function writeLetter() {
    setWritingLetter(true);
    try {
      saveLetter(await requestLetter(monthSummary, profile, coachMemory?.text));
    } finally {
      setWritingLetter(false);
    }
  }

  const weekStart = startOfWeek(today);
  const summary = summarizeWeek(entries, habits, weekStart);
  const current = reflections[weekStart];
  const past = Object.values(reflections)
    .filter((reflection) => reflection.weekStart !== weekStart)
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart));

  async function reflect() {
    setLoading(true);
    try {
      saveReflection(await requestReflection(summary, profile));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <View>
        <ThemedText type="title">Your coach</ThemedText>
        <ThemedText color="textSecondary">Chat anytime, plus a reflection on your week written just for you.</ThemedText>
      </View>

      {isPlus && (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/coach-chat')}
          style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
          <Card style={[styles.chatCard, { backgroundColor: theme.accent, borderColor: theme.accent }]}>
            <Text style={{ fontSize: 32 }}>💬</Text>
            <View style={{ flex: 1 }}>
              <ThemedText type="heading" style={{ color: theme.accentText }}>Chat with your coach</ThemedText>
              <ThemedText type="small" style={{ color: theme.accentText, opacity: 0.85 }}>
                {chat.length ? 'Pick up where you left off' : 'Ask for advice, talk through a tough day, or plan your week'}
              </ThemedText>
            </View>
            <ThemedText type="heading" style={{ color: theme.accentText }}>›</ThemedText>
          </Card>
        </Pressable>
      )}

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
          <ThemedText type="heading" style={{ textAlign: 'center' }}>Your AI coach is part of SteadyThrive Plus</ThemedText>
          <ThemedText color="textSecondary" style={{ textAlign: 'center' }}>
            Chat with your coach anytime for advice that fits your goals, and get a weekly
            reflection on what's working.
          </ThemedText>
          <View style={{ alignSelf: 'stretch', marginTop: Spacing.two }}>
            <Button title="Try SteadyThrive Plus" onPress={() => router.push('/paywall')} />
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

      {isPlus && (
        <Card>
          <ThemedText type="heading">✉️ Your letter for {monthSummary.label.split(' ')[0]}</ThemedText>
          {letter ? (
            <>
              <ThemedText>{letter.text}</ThemedText>
              {letter.source === 'offline' && (
                <ThemedText type="small" color="textSecondary">
                  Written offline because the coach couldn't be reached. Try again later for a personal letter.
                </ThemedText>
              )}
              <Button title="Rewrite with the latest" variant="secondary" onPress={writeLetter} loading={writingLetter} />
            </>
          ) : (
            <>
              <ThemedText color="textSecondary">
                Once a month your coach writes you a personal letter about your month: what went well, what
                helped your mood, and what to try next.
              </ThemedText>
              <Button
                title="Write my letter"
                onPress={writeLetter}
                loading={writingLetter}
                disabled={monthSummary.daysLogged === 0}
              />
            </>
          )}
        </Card>
      )}

      {isPlus && pastLetters.length > 0 && (
        <>
          <ThemedText type="heading">Past letters</ThemedText>
          {pastLetters.map((past) => (
            <Card key={past.month}>
              <ThemedText type="label" color="textSecondary">
                {summarizeMonth({}, [], {}, past.month).label}
              </ThemedText>
              <ThemedText>{past.text}</ThemedText>
            </Card>
          ))}
        </>
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
  chatCard: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
});
