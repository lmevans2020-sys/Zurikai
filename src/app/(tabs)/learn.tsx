import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Card, Screen, ThemedText } from '@/components/ui';
import { Spacing } from '@/constants/theme';
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
  const { profile } = useJournal();
  const recommendedIds = recommendedGuideIds(profile).slice(0, 4);
  const recommended = recommendedIds.flatMap((id) => GUIDES.filter((guide) => guide.id === id));
  const rest = GUIDES.filter((guide) => !recommendedIds.includes(guide.id));

  return (
    <Screen>
      <View>
        <ThemedText type="title">Learn</ThemedText>
        <ThemedText color="textSecondary">Short guides on building habits that last.</ThemedText>
      </View>

      {recommended.length > 0 && (
        <>
          <ThemedText type="label" color="accent">Recommended for you</ThemedText>
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
