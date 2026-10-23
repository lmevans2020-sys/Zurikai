import * as Haptics from 'expo-haptics';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ThemedText } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { appendSpoken, useDictation } from '@/lib/dictation';

/**
 * Dictation for one text field: a mic button to put beside it and a status line for under it.
 * Both are null where speech recognition isn't available (for example in Expo Go).
 */
export function useMic(value: string, onChange: (text: string) => void, size = 44) {
  const theme = useTheme();
  const { available, listening, partial, error, start, stop } = useDictation((spoken) =>
    onChange(appendSpoken(value, spoken)),
  );
  if (!available) return { micButton: null, micStatus: null };

  const micButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={listening ? 'Stop dictation' : 'Speak instead of typing'}
      onPress={() => {
        Haptics.selectionAsync().catch(() => {});
        if (listening) stop();
        else start();
      }}
      style={[
        styles.button,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderColor: theme.accent,
          backgroundColor: listening ? theme.accent : theme.backgroundElement,
        },
      ]}>
      <Text style={{ fontSize: size * 0.45 }}>{listening ? '⏹' : '🎤'}</Text>
    </Pressable>
  );

  const micStatus = error ? (
    <ThemedText type="small" color="danger">{error}</ThemedText>
  ) : listening ? (
    <View style={styles.status}>
      <ThemedText type="small" color="accent" style={{ fontWeight: '600' }}>Listening…</ThemedText>
      {partial ? <ThemedText type="small" color="textSecondary" style={{ flex: 1 }}>{partial}</ThemedText> : null}
    </View>
  ) : null;

  return { micButton, micStatus };
}

const styles = StyleSheet.create({
  button: { borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  status: { flexDirection: 'row', gap: Spacing.two },
});
