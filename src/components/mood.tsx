import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import type { Mood } from '@/lib/types';

export const MOODS: { value: Mood; emoji: string; label: string }[] = [
  { value: 1, emoji: '😞', label: 'Rough' },
  { value: 2, emoji: '😕', label: 'Low' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😄', label: 'Great' },
];

export function moodEmoji(mood: Mood) {
  return MOODS[mood - 1].emoji;
}

export function MoodPicker({ value, onChange }: { value: Mood | null; onChange: (mood: Mood) => void }) {
  const theme = useTheme();
  return (
    <View style={styles.row}>
      {MOODS.map((mood) => {
        const selected = mood.value === value;
        return (
          <Pressable
            key={mood.value}
            accessibilityRole="button"
            accessibilityLabel={mood.label}
            accessibilityState={{ selected }}
            onPress={() => {
              Haptics.selectionAsync().catch(() => {});
              onChange(mood.value);
            }}
            style={[
              styles.option,
              {
                backgroundColor: selected ? theme.accentSoft : theme.background,
                borderColor: selected ? theme.accent : theme.border,
              },
            ]}>
            <Text style={styles.emoji}>{mood.emoji}</Text>
            <ThemedText type="small" color={selected ? 'accent' : 'textSecondary'}>
              {mood.label}
            </ThemedText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: Spacing.two },
  option: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Radius.small,
    borderWidth: 1.5,
    gap: Spacing.one,
  },
  emoji: { fontSize: 28 },
});
