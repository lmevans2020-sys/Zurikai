import { router, useLocalSearchParams } from 'expo-router';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Screen, ThemedText } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { challengeById } from '@/content/challenges';
import { useTheme } from '@/hooks/use-theme';
import { useJournal } from '@/lib/journal-store';

export default function ChallengeScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { challenge: active, finishedChallenges, startChallenge, stopChallenge } = useJournal();
  const challenge = challengeById(id);

  if (!challenge) {
    return (
      <Screen tabBar={false}>
        <BackLink />
        <ThemedText>This challenge could not be found.</ThemedText>
      </Screen>
    );
  }

  const isActive = active?.id === challenge.id;
  const timesFinished = finishedChallenges.filter((finished) => finished === challenge.id).length;

  function start() {
    if (!challenge) return;
    const begin = () => {
      startChallenge(challenge.id);
      router.navigate('/');
    };
    const other = challengeById(active?.id);
    if (other && !isActive) {
      Alert.alert(`Switch from "${other.title}"?`, 'You can only do one challenge at a time.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Switch', onPress: begin },
      ]);
      return;
    }
    begin();
  }

  return (
    <Screen tabBar={false}>
      <BackLink />
      <View style={{ gap: Spacing.two }}>
        <Text style={{ fontSize: 48 }}>{challenge.emoji}</Text>
        <ThemedText type="title">{challenge.title}</ThemedText>
        <ThemedText color="textSecondary">{challenge.summary}</ThemedText>
        <ThemedText type="small" color="textSecondary">
          One small step a day. Your step shows on the Today screen, and your coach knows you're doing it.
          {timesFinished > 0 ? ` You've finished this ${timesFinished === 1 ? 'once' : `${timesFinished} times`} 🎉` : ''}
        </ThemedText>
      </View>

      <Card>
        {challenge.steps.map((step, index) => {
          const done = isActive && index < active.done;
          const current = isActive && index === active.done;
          return (
            <View key={index} style={[styles.step, { borderColor: theme.border }]}>
              <View
                style={[
                  styles.dot,
                  { borderColor: theme.accent, backgroundColor: done ? theme.accent : current ? theme.accentSoft : 'transparent' },
                ]}>
                <ThemedText type="small" style={{ fontWeight: '700', color: done ? theme.accentText : theme.accent }}>
                  {done ? '✓' : index + 1}
                </ThemedText>
              </View>
              <ThemedText style={{ flex: 1 }} color={done ? 'textSecondary' : 'text'}>{step}</ThemedText>
            </View>
          );
        })}
      </Card>

      {isActive ? (
        <Button title="Stop this challenge" variant="ghost" onPress={() => { stopChallenge(); router.back(); }} />
      ) : (
        <Button title={timesFinished ? 'Do it again' : 'Start challenge'} onPress={start} />
      )}
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
  step: { flexDirection: 'row', gap: Spacing.three, paddingVertical: Spacing.two, borderBottomWidth: StyleSheet.hairlineWidth },
  dot: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
});
