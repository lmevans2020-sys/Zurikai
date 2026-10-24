import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Screen, ThemedText } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { guideById } from '@/content/guides';

export default function GuideScreen() {
  const theme = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const guide = guideById(id);

  return (
    <Screen tabBar={false}>
      <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12}>
        <ThemedText color="accent" style={{ fontWeight: '600' }}>‹ Back</ThemedText>
      </Pressable>

      {!guide ? (
        <ThemedText>This guide could not be found.</ThemedText>
      ) : (
        <>
          <View style={{ gap: Spacing.two }}>
            <Text style={{ fontSize: 48 }}>{guide.emoji}</Text>
            <ThemedText type="title">{guide.title}</ThemedText>
            <ThemedText color="textSecondary">{guide.minutes} min read</ThemedText>
          </View>

          {guide.body.map((paragraph, index) =>
            paragraph.startsWith('• ') ? (
              <View key={index} style={styles.bullet}>
                <ThemedText color="accent">•</ThemedText>
                <ThemedText style={{ flex: 1 }}>{paragraph.slice(2)}</ThemedText>
              </View>
            ) : (
              <ThemedText key={index}>{paragraph}</ThemedText>
            ),
          )}

          <Card style={{ backgroundColor: theme.accentSoft, borderColor: theme.accent }}>
            <ThemedText type="label" color="accent">Try this today</ThemedText>
            <ThemedText>{guide.tryThis}</ThemedText>
          </Card>

          <Button title="Back to today's check-in" variant="secondary" onPress={() => router.navigate('/')} />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  bullet: { flexDirection: 'row', gap: Spacing.two, paddingLeft: Spacing.two },
});
