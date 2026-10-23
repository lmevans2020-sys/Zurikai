import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

// Zurikai Plus: what the subscription unlocks, and how it's bought.
//
// For now the purchase is simulated on the device so the whole flow can be tried in Expo Go.
// To take real payments, replace `purchase` and `restore` with RevenueCat
// (`react-native-purchases`) once the App Store / Google Play products exist. See README.

export const FREE_HABIT_LIMIT = 3;

export type Plan = {
  id: 'monthly' | 'yearly';
  title: string;
  price: string;
  detail: string;
  badge?: string;
};

export const PLANS: Plan[] = [
  { id: 'yearly', title: 'Yearly', price: '$39.99 / year', detail: 'Just $3.33 a month', badge: 'Best value' },
  { id: 'monthly', title: 'Monthly', price: '$7.99 / month', detail: 'Cancel anytime' },
];

export const PLUS_FEATURES = [
  { emoji: '💬', title: 'Chat with your AI coach', detail: 'Advice that fits your goals, whenever you need it.' },
  { emoji: '🧭', title: 'Weekly reflections', detail: 'A personal look at your week, every week.' },
  { emoji: '♾️', title: 'Unlimited habits', detail: `Track more than ${FREE_HABIT_LIMIT} habits at once.` },
  { emoji: '📈', title: 'Mood trends', detail: 'See patterns between your habits and how you feel.' },
];

const STORAGE_KEY = 'zurikai/premium/v1';

type PremiumContextValue = {
  isPlus: boolean;
  plan: Plan['id'] | null;
  purchase: (plan: Plan['id']) => Promise<void>;
  restore: () => Promise<boolean>;
  cancelForTesting: () => void;
};

const PremiumContext = createContext<PremiumContextValue | null>(null);

export function PremiumProvider({ children }: { children: ReactNode }) {
  const [plan, setPlan] = useState<Plan['id'] | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => setPlan(raw === 'monthly' || raw === 'yearly' ? raw : null))
      .catch(() => setPlan(null));
  }, []);

  const purchase = useCallback(async (next: Plan['id']) => {
    await AsyncStorage.setItem(STORAGE_KEY, next);
    setPlan(next);
  }, []);

  const restore = useCallback(async () => {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const restored = raw === 'monthly' || raw === 'yearly' ? raw : null;
    setPlan(restored);
    return restored !== null;
  }, []);

  const cancelForTesting = useCallback(() => {
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
    setPlan(null);
  }, []);

  const value = useMemo(
    () => ({ isPlus: plan !== null, plan, purchase, restore, cancelForTesting }),
    [plan, purchase, restore, cancelForTesting],
  );

  return <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>;
}

export function usePremium() {
  const value = useContext(PremiumContext);
  if (!value) throw new Error('usePremium must be used inside <PremiumProvider>');
  return value;
}
