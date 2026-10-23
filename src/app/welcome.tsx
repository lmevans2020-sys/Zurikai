import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Choice } from '@/components/choice';
import { Button, ThemedText } from '@/components/ui';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { BUSYNESS, COACH_STYLES, GOALS, OBSTACLES, RHYTHMS, suggestedHabits } from '@/content/interview';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useTheme } from '@/hooks/use-theme';
import { useJournal } from '@/lib/journal-store';
import { FREE_HABIT_LIMIT, usePremium } from '@/lib/premium';
import type { CoachStyle, GoalId, ObstacleId, Profile } from '@/lib/types';

const MAX_GOALS = 3;
const STEPS = 6;
// Teal from the SteadyThrive logo's wordmark: the logo's own shade on dark backgrounds, a deeper
// one on light backgrounds so the tagline stays easy to read.
const LOGO_TEAL = { light: '#1E8C7A', dark: '#32B8A2' };

type HabitOption = { key: string; id?: string; name: string; emoji: string };

function toggle<T>(list: T[], value: T, max = Infinity) {
  if (list.includes(value)) return list.filter((item) => item !== value);
  return list.length >= max ? list : [...list, value];
}

export default function WelcomeScreen() {
  const theme = useTheme();
  const scheme = useColorScheme();
  const { profile: existing, activeHabits, entries, completeInterview } = useJournal();
  const { isPlus } = usePremium();
  const editing = existing !== null;
  const habitLimit = isPlus ? Infinity : FREE_HABIT_LIMIT;

  const [step, setStep] = useState(0);
  const [name, setName] = useState(existing?.name ?? '');
  const [goals, setGoals] = useState<GoalId[]>(existing?.goals ?? []);
  const [rhythm, setRhythm] = useState<Profile['rhythm'] | null>(existing?.rhythm ?? null);
  const [busyness, setBusyness] = useState<Profile['busyness'] | null>(existing?.busyness ?? null);
  const [obstacles, setObstacles] = useState<ObstacleId[]>(existing?.obstacles ?? []);
  const [coachStyle, setCoachStyle] = useState<CoachStyle | null>(existing?.coachStyle ?? null);
  const [about, setAbout] = useState(existing?.about ?? '');

  // Habit step: suggestions for the chosen goals plus the habits they already have. People who
  // have been checking in keep their current habits ticked; new people start from suggestions.
  const hasHistory = Object.keys(entries).length > 0;
  const habitOptions = useMemo<HabitOption[]>(() => {
    const current = activeHabits.map((habit) => ({ key: habit.id, id: habit.id, name: habit.name, emoji: habit.emoji }));
    const suggested = suggestedHabits(goals)
      .filter((habit) => !current.some((c) => c.name.toLowerCase() === habit.name.toLowerCase()))
      .map((habit) => ({ key: `new:${habit.name}`, ...habit }));
    return [...suggested, ...current];
  }, [activeHabits, goals]);
  const [chosenHabits, setChosenHabits] = useState<string[] | null>(null);
  const defaultChosen = (hasHistory || editing ? activeHabits.map((h) => h.id) : habitOptions.map((h) => h.key)).slice(
    0,
    habitLimit,
  );
  const chosen = chosenHabits ?? defaultChosen;

  const canContinue = [
    true,
    goals.length > 0,
    rhythm !== null && busyness !== null,
    true,
    coachStyle !== null,
    chosen.length > 0,
  ][step];

  function finish() {
    completeInterview(
      {
        name: name.trim(),
        goals,
        rhythm: rhythm ?? 'varies',
        busyness: busyness ?? 'busy',
        obstacles,
        coachStyle: coachStyle ?? 'gentle',
        about: about.trim(),
        completedAt: new Date().toISOString(),
      },
      habitOptions.filter((habit) => chosen.includes(habit.key)).map(({ id, name, emoji }) => ({ id, name, emoji })),
    );
    if (editing) router.back();
    else router.replace('/');
  }

  function next() {
    if (step === STEPS - 1) finish();
    else setStep(step + 1);
  }

  const firstName = name.trim().split(' ')[0];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.header}>
          {step > 0 || editing ? (
            <Pressable
              accessibilityRole="button"
              hitSlop={12}
              onPress={() => (step > 0 ? setStep(step - 1) : router.back())}>
              <ThemedText color="accent" style={{ fontWeight: '600' }}>‹ Back</ThemedText>
            </Pressable>
          ) : (
            <View />
          )}
          <View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
            <View style={[styles.progressFill, { backgroundColor: theme.accent, width: `${((step + 1) / STEPS) * 100}%` }]} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          {step === 0 && (
            <>
              {editing ? (
                <>
                  <Text style={styles.bigEmoji}>👋</Text>
                  <ThemedText type="title">Update your plan</ThemedText>
                </>
              ) : (
                <>
                  <View style={styles.logoCard}>
                    <Image
                      source={require('../../assets/images/logo.png')}
                      accessibilityLabel="SteadyThrive"
                      resizeMode="contain"
                      style={styles.logo}
                    />
                    <ThemedText type="small" style={{ color: '#5B6B66' }}>by Zurikai</ThemedText>
                  </View>
                  <ThemedText type="heading" style={{ color: scheme === 'dark' ? LOGO_TEAL.dark : LOGO_TEAL.light, textAlign: 'center' }}>
                    Every feeling matters. Every small step counts.
                  </ThemedText>
                  <ThemedText style={{ textAlign: 'center' }}>
                    Track your moods, build healthy habits, and discover what helps you thrive.
                  </ThemedText>
                </>
              )}
              <ThemedText color="textSecondary">
                A few quick questions so your coach, tips and habits fit your life. It takes about a minute.
              </ThemedText>
              <ThemedText type="heading" style={{ marginTop: Spacing.three }}>What should we call you?</ThemedText>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="Your first name (optional)"
                placeholderTextColor={theme.textSecondary}
                maxLength={30}
                returnKeyType="next"
                onSubmitEditing={next}
                style={[styles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement }]}
              />
            </>
          )}

          {step === 1 && (
            <>
              <ThemedText type="title">{firstName ? `What matters most, ${firstName}?` : 'What matters most to you?'}</ThemedText>
              <ThemedText color="textSecondary">Pick up to {MAX_GOALS}. You can change these later.</ThemedText>
              {GOALS.map((goal) => (
                <Choice
                  key={goal.id}
                  multiple
                  emoji={goal.emoji}
                  label={goal.label}
                  selected={goals.includes(goal.id)}
                  onPress={() => {
                    setGoals(toggle(goals, goal.id, MAX_GOALS));
                    setChosenHabits(null);
                  }}
                />
              ))}
            </>
          )}

          {step === 2 && (
            <>
              <ThemedText type="title">Tell us about your days</ThemedText>
              <ThemedText type="heading">When do you have the most energy?</ThemedText>
              {RHYTHMS.map((option) => (
                <Choice
                  key={option.id}
                  emoji={option.emoji}
                  label={option.label}
                  selected={rhythm === option.id}
                  onPress={() => setRhythm(option.id)}
                />
              ))}
              <ThemedText type="heading" style={{ marginTop: Spacing.three }}>How busy is a normal day?</ThemedText>
              {BUSYNESS.map((option) => (
                <Choice
                  key={option.id}
                  emoji={option.emoji}
                  label={option.label}
                  selected={busyness === option.id}
                  onPress={() => setBusyness(option.id)}
                />
              ))}
            </>
          )}

          {step === 3 && (
            <>
              <ThemedText type="title">What usually gets in the way?</ThemedText>
              <ThemedText color="textSecondary">Pick any that sound familiar, or skip.</ThemedText>
              {OBSTACLES.map((obstacle) => (
                <Choice
                  key={obstacle.id}
                  multiple
                  emoji={obstacle.emoji}
                  label={obstacle.label}
                  selected={obstacles.includes(obstacle.id)}
                  onPress={() => setObstacles(toggle(obstacles, obstacle.id))}
                />
              ))}
            </>
          )}

          {step === 4 && (
            <>
              <ThemedText type="title">How should your coach talk to you?</ThemedText>
              {COACH_STYLES.map((style) => (
                <Choice
                  key={style.id}
                  emoji={style.emoji}
                  label={style.label}
                  detail={style.detail}
                  selected={coachStyle === style.id}
                  onPress={() => setCoachStyle(style.id)}
                />
              ))}
              <ThemedText type="heading" style={{ marginTop: Spacing.three }}>Anything else your coach should know?</ThemedText>
              <TextInput
                value={about}
                onChangeText={setAbout}
                placeholder="For example: I work night shifts, or I'm training for a 5K (optional)"
                placeholderTextColor={theme.textSecondary}
                multiline
                maxLength={300}
                style={[
                  styles.input,
                  styles.multiline,
                  { color: theme.text, borderColor: theme.border, backgroundColor: theme.backgroundElement },
                ]}
              />
            </>
          )}

          {step === 5 && (
            <>
              <ThemedText type="title">Your starting habits</ThemedText>
              <ThemedText color="textSecondary">
                {Number.isFinite(habitLimit)
                  ? `Based on your goals. Pick up to ${habitLimit} to start, because a few habits done well beat many done rarely.`
                  : 'Based on your goals. Starting with a few habits done well beats many done rarely.'}
              </ThemedText>
              {habitOptions.map((habit) => (
                <Choice
                  key={habit.key}
                  multiple
                  emoji={habit.emoji}
                  label={habit.name}
                  detail={habit.id ? 'Your current habit' : 'Suggested for you'}
                  selected={chosen.includes(habit.key)}
                  onPress={() => setChosenHabits(toggle(chosen, habit.key, habitLimit))}
                />
              ))}
              <ThemedText type="small" color="textSecondary">You can add your own habits anytime in Settings.</ThemedText>
            </>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            title={step === STEPS - 1 ? (editing ? 'Save changes' : "Let's go") : step === 3 && obstacles.length === 0 ? 'Skip' : 'Continue'}
            onPress={next}
            disabled={!canContinue}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.three,
  },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 3 },
  body: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.three,
  },
  bigEmoji: { fontSize: 56 },
  logoCard: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.large,
    paddingVertical: Spacing.three,
    gap: Spacing.one,
  },
  logo: { width: 260, height: 260 * (739 / 984) },
  input: { borderWidth: 1, borderRadius: Radius.small, paddingHorizontal: Spacing.three, height: 50, fontSize: 16 },
  multiline: { height: 96, paddingTop: Spacing.three, textAlignVertical: 'top' },
  footer: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
});
