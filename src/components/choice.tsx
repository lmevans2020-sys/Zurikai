import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

/** A large tappable answer used by the welcome interview. */
export function Choice({
  emoji,
  label,
  detail,
  selected,
  multiple,
  onPress,
}: {
  emoji: string;
  label: string;
  detail?: string;
  selected: boolean;
  multiple?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole={multiple ? 'checkbox' : 'radio'}
      accessibilityState={multiple ? { checked: selected } : { selected }}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        onPress();
      }}
      style={[
        styles.choice,
        {
          backgroundColor: selected ? theme.accentSoft : theme.backgroundElement,
          borderColor: selected ? theme.accent : theme.border,
        },
      ]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <View style={{ flex: 1 }}>
        <ThemedText style={{ fontWeight: '600' }}>{label}</ThemedText>
        {detail && (
          <ThemedText type="small" color="textSecondary">
            {detail}
          </ThemedText>
        )}
      </View>
      <View
        style={[
          styles.mark,
          {
            borderRadius: multiple ? 6 : 12,
            borderColor: theme.accent,
            backgroundColor: selected ? theme.accent : 'transparent',
          },
        ]}>
        {selected && <Text style={{ color: theme.accentText, fontWeight: '700', fontSize: 13 }}>✓</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Radius.medium,
    borderWidth: 1.5,
  },
  emoji: { fontSize: 26 },
  mark: { width: 24, height: 24, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
});
