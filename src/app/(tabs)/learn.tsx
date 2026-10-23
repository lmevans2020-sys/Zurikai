import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Screen, ThemedText } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { sortedChallenges } from '@/content/challenges';
import { GUIDES, type Guide } from '@/content/guides';
import { recommendedGuideIds } from '@/content/interview';
import { useJournal } from '@/lib/journal-store';

function GuideRow({ guide }: { guide: Guide }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/guides/[id]', params: { id: guide.id } })}
      style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
      <Card style={styles.row}>
        <Text style={styles.emoji}>{guide.emoji}</Text>
        <View style={{ flex: 1, gap: Spacing.half }}>
          <ThemedText type="heading">{guide.title}</ThemedText>
          <ThemedText type="small" color="textSecondary">
            {guide.summary} · {guide.minutes} min read
          </ThemedText>
        </View>
      </Card>
    </Pressable>
  );
}

export default function LearnScreen() {
  const { profile, challenge: active } = useJournal();
  const challenges = sortedChallenges(profile?.goals);
  const recommendedIds = recommendedGuideIds(profile).slice(0, 4);
  const recommended = recommendedIds.flatMap((id) => GUIDES.filter((guide) => guide.id === id));
  const rest = GUIDES.filter((guide) => !recommendedIds.includes(guide.id));

  return (
    <Screen>
      <View>
        <ThemedText type="title">Learn</ThemedText>
        <ThemedText color="textSecondary">Short guides on building habits that last.</ThemedText>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/breathe')}
        style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
        <Card style={styles.row}>
          <Text style={styles.emoji}>🌬️</Text>
          <View style={{ flex: 1, gap: Spacing.half }}>
            <ThemedText type="heading">One-minute breather</ThemedText>
            <ThemedText type="small" color="textSecondary">A guided breath for stressful moments</ThemedText>
          </View>
        </Card>
      </Pressable>

      <ThemedText type="label" color="accent">Challenges</ThemedText>
      {challenges.map((challenge) => (
        <Pressable
          key={challenge.id}
          accessibilityRole="button"
          onPress={() => router.push({ pathname: '/challenges/[id]', params: { id: challenge.id } })}
          style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1 })}>
          <Card style={styles.row}>
            <Text style={styles.emoji}>{challenge.emoji}</Text>
            <View style={{ flex: 1, gap: Spacing.half }}>
              <ThemedText type="heading">{challenge.title}</ThemedText>
              <ThemedText type="small" color={active?.id === challenge.id ? 'accent' : 'textSecondary'}>
                {active?.id === challenge.id
                  ? `In progress: step ${active.done + 1} of ${challenge.steps.length}`
                  : challenge.summary}
              </ThemedText>
            </View>
          </Card>
        </Pressable>
      ))}

      {recommended.length > 0 && (
        <>
          <ThemedText type="label" color="accent" style={{ marginTop: Spacing.two }}>Guides recommended for you</ThemedText>
          {recommended.map((guide) => (
            <GuideRow key={guide.id} guide={guide} />
          ))}
          <ThemedText type="label" color="textSecondary" style={{ marginTop: Spacing.two }}>
            All guides
          </ThemedText>
        </>
      )}
      {rest.map((guide) => (
        <GuideRow key={guide.id} guide={guide} />
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  emoji: { fontSize: 32 },
});
