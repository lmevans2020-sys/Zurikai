import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ThemedText } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

// A short guided breath: in for 4, hold for 4, out for 6. Longer out-breaths help the body
// settle, and four rounds take about a minute.
const PHASES = [
  { label: 'Breathe in', seconds: 4, scale: 1 },
  { label: 'Hold', seconds: 4, scale: 1 },
  { label: 'Breathe out', seconds: 6, scale: 0.55 },
] as const;
const ROUNDS = 4;

export default function BreatheScreen() {
  const theme = useTheme();
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [round, setRound] = useState(0);
  const [done, setDone] = useState(false);
  const size = useRef(new Animated.Value(0.55)).current;

  useEffect(() => {
    if (!running) return;
    const current = PHASES[phase];
    Haptics.selectionAsync().catch(() => {});
    Animated.timing(size, {
      toValue: current.scale,
      duration: current.seconds * 1000,
      easing: Easing.inOut(Easing.ease),
      useNativeDriver: true,
    }).start();
    const timer = setTimeout(() => {
      if (phase < PHASES.length - 1) {
        setPhase(phase + 1);
      } else if (round < ROUNDS - 1) {
        setRound(round + 1);
        setPhase(0);
      } else {
        setRunning(false);
        setDone(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    }, current.seconds * 1000);
    return () => clearTimeout(timer);
  }, [running, phase, round, size]);

  function start() {
    setPhase(0);
    setRound(0);
    setDone(false);
    setRunning(true);
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]}>
      <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12} style={styles.back}>
        <ThemedText color="accent" style={{ fontWeight: '600' }}>‹ Back</ThemedText>
      </Pressable>

      <View style={styles.center}>
        <ThemedText type="title" style={{ textAlign: 'center' }}>
          {done ? 'Nicely done' : 'One-minute breather'}
        </ThemedText>
        <ThemedText color="textSecondary" style={{ textAlign: 'center' }}>
          {done
            ? 'Notice how you feel now. You can come back to this anytime.'
            : 'Follow the circle. In through your nose, slowly out through your mouth.'}
        </ThemedText>

        <View style={styles.circleArea}>
          <Animated.View
            style={[styles.circle, { backgroundColor: theme.accentSoft, borderColor: theme.accent, transform: [{ scale: size }] }]}
          />
          <View style={styles.circleLabel} pointerEvents="none">
            <ThemedText type="heading" color="accent" accessibilityLiveRegion="polite">
              {running ? PHASES[phase].label : done ? '🌱' : 'Ready?'}
            </ThemedText>
            {running && (
              <ThemedText type="small" color="textSecondary">
                Round {round + 1} of {ROUNDS}
              </ThemedText>
            )}
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        {running ? (
          <Button title="Stop" variant="secondary" onPress={() => setRunning(false)} />
        ) : (
          <Button title={done ? 'Go again' : 'Start'} onPress={start} />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  back: { paddingHorizontal: Spacing.four, paddingTop: Spacing.three },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.three, paddingHorizontal: Spacing.four },
  circleArea: { width: 260, height: 260, alignItems: 'center', justifyContent: 'center', marginTop: Spacing.four },
  circle: { position: 'absolute', width: 260, height: 260, borderRadius: 130, borderWidth: 3 },
  circleLabel: { alignItems: 'center', gap: Spacing.half },
  footer: { padding: Spacing.four },
});
