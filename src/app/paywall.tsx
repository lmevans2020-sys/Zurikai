import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, ThemedText } from '@/components/ui';
import { MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { PLANS, PLUS_FEATURES, usePremium, type Plan } from '@/lib/premium';

export default function PaywallScreen() {
  const theme = useTheme();
  const { purchase, restore } = usePremium();
  const [selected, setSelected] = useState<Plan['id']>('yearly');
  const [busy, setBusy] = useState(false);

  async function subscribe() {
    setBusy(true);
    try {
      await purchase(selected);
      router.back();
    } catch {
      Alert.alert('Purchase failed', 'Nothing was charged. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function restorePurchases() {
    const restored = await restore();
    if (restored) router.back();
    else Alert.alert('Nothing to restore', 'We could not find an active subscription.');
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={() => router.back()} style={styles.close}>
          <ThemedText type="heading" color="textSecondary">✕</ThemedText>
        </Pressable>

        <View style={{ alignItems: 'center', gap: Spacing.two }}>
          <Text style={{ fontSize: 48 }}>✨</Text>
          <ThemedText type="title" style={{ textAlign: 'center' }}>SteadyThrive Plus</ThemedText>
          <ThemedText color="textSecondary" style={{ textAlign: 'center' }}>
            Build habits that stick, with a coach in your pocket.
          </ThemedText>
        </View>

        <View style={{ gap: Spacing.three }}>
          {PLUS_FEATURES.map((feature) => (
            <View key={feature.title} style={styles.feature}>
              <Text style={{ fontSize: 26 }}>{feature.emoji}</Text>
              <View style={{ flex: 1 }}>
                <ThemedText style={{ fontWeight: '600' }}>{feature.title}</ThemedText>
                <ThemedText type="small" color="textSecondary">{feature.detail}</ThemedText>
              </View>
            </View>
          ))}
        </View>

        <View style={{ gap: Spacing.two }}>
          {PLANS.map((plan) => {
            const isSelected = plan.id === selected;
            return (
              <Pressable
                key={plan.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: isSelected }}
                onPress={() => setSelected(plan.id)}
                style={[
                  styles.plan,
                  {
                    borderColor: isSelected ? theme.accent : theme.border,
                    backgroundColor: isSelected ? theme.accentSoft : theme.backgroundElement,
                  },
                ]}>
                <View style={{ flex: 1 }}>
                  <ThemedText type="heading">{plan.title}</ThemedText>
                  <ThemedText type="small" color="textSecondary">{plan.detail}</ThemedText>
                </View>
                <View style={{ alignItems: 'flex-end', gap: Spacing.one }}>
                  {plan.badge && (
                    <View style={[styles.badge, { backgroundColor: theme.warm }]}>
                      <Text style={styles.badgeText}>{plan.badge}</Text>
                    </View>
                  )}
                  <ThemedText style={{ fontWeight: '600' }}>{plan.price}</ThemedText>
                </View>
              </Pressable>
            );
          })}
        </View>

        <Button title="Continue" onPress={subscribe} loading={busy} />
        <Button title="Restore purchases" variant="ghost" onPress={restorePurchases} />
        <ThemedText type="small" color="textSecondary" style={{ textAlign: 'center' }}>
          Subscriptions renew automatically until cancelled. Cancel anytime in your App Store or
          Google Play settings.
        </ThemedText>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    padding: Spacing.four,
    gap: Spacing.four,
  },
  close: { alignSelf: 'flex-end', padding: Spacing.one },
  feature: { flexDirection: 'row', alignItems: 'center', gap: Spacing.three },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: Radius.medium,
    padding: Spacing.three,
  },
  badge: { borderRadius: Radius.small, paddingHorizontal: Spacing.two, paddingVertical: 2 },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
});
