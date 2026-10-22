import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Card, Screen, ThemedText } from '@/components/ui';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { useJournal } from '@/lib/journal-store';
import { FREE_HABIT_LIMIT, PLANS, usePremium } from '@/lib/premium';

export default function SettingsScreen() {
  const theme = useTheme();
  const { activeHabits, addHabit, archiveHabit, resetAll } = useJournal();
  const { isPlus, plan, cancelForTesting } = usePremium();
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');

  const atLimit = !isPlus && activeHabits.length >= FREE_HABIT_LIMIT;

  function add() {
    if (atLimit) {
      router.push('/paywall');
      return;
    }
    if (!name.trim()) return;
    addHabit(name, emoji);
    setName('');
    setEmoji('');
  }

  function confirmRemove(id: string, habitName: string) {
    Alert.alert(`Remove "${habitName}"?`, 'Your past check-ins for this habit are kept.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => archiveHabit(id) },
    ]);
  }

  function confirmReset() {
    Alert.alert('Erase all data?', 'This deletes every check-in, habit and reflection on this phone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Erase', style: 'destructive', onPress: resetAll },
    ]);
  }

  const inputStyle = [styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }];

  return (
    <Screen>
      <ThemedText type="title">Settings</ThemedText>

      <Card>
        <ThemedText type="label" color="textSecondary">Membership</ThemedText>
        {isPlus ? (
          <>
            <ThemedText type="heading">Zurikai Plus ✨</ThemedText>
            <ThemedText color="textSecondary">{PLANS.find((p) => p.id === plan)?.price}</ThemedText>
          </>
        ) : (
          <>
            <ThemedText type="heading">Free plan</ThemedText>
            <ThemedText color="textSecondary">
              Up to {FREE_HABIT_LIMIT} habits. Upgrade for weekly AI coaching and unlimited habits.
            </ThemedText>
            <Button title="See Zurikai Plus" onPress={() => router.push('/paywall')} />
          </>
        )}
      </Card>

      <Card>
        <ThemedText type="heading">Your habits</ThemedText>
        {activeHabits.map((habit) => (
          <View key={habit.id} style={[styles.habitRow, { borderColor: theme.border }]}>
            <Text style={{ fontSize: 22 }}>{habit.emoji}</Text>
            <ThemedText style={{ flex: 1 }}>{habit.name}</ThemedText>
            <Pressable accessibilityRole="button" onPress={() => confirmRemove(habit.id, habit.name)} hitSlop={8}>
              <ThemedText type="small" color="danger">Remove</ThemedText>
            </Pressable>
          </View>
        ))}

        <View style={styles.addRow}>
          <TextInput
            value={emoji}
            onChangeText={setEmoji}
            placeholder="✨"
            placeholderTextColor={theme.textSecondary}
            maxLength={2}
            style={[inputStyle, styles.emojiInput]}
          />
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="New habit, e.g. Read 10 pages"
            placeholderTextColor={theme.textSecondary}
            maxLength={40}
            returnKeyType="done"
            onSubmitEditing={add}
            style={[inputStyle, { flex: 1 }]}
          />
        </View>
        <Button
          title={atLimit ? `Unlock more than ${FREE_HABIT_LIMIT} habits` : 'Add habit'}
          variant="secondary"
          onPress={add}
          disabled={!atLimit && !name.trim()}
        />
      </Card>

      <Card>
        <ThemedText type="heading">About</ThemedText>
        <ThemedText color="textSecondary">
          Your journal is stored on this phone. Zurikai's coach offers encouragement, not medical
          advice. If you're struggling, please reach out to someone you trust or a local support line.
        </ThemedText>
      </Card>

      <Button title="Erase all data" variant="ghost" onPress={confirmReset} />
      {__DEV__ && isPlus && (
        <Button title="(Dev) Turn off Plus" variant="ghost" onPress={cancelForTesting} />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  habitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  addRow: { flexDirection: 'row', gap: Spacing.two, marginTop: Spacing.two },
  input: { borderWidth: 1, borderRadius: Radius.small, paddingHorizontal: Spacing.three, height: 48, fontSize: 16 },
  emojiInput: { width: 56, textAlign: 'center', paddingHorizontal: 0 },
});
