import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset, MaxContentWidth, Radius, Spacing, type ThemeColor } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type TextType = 'title' | 'heading' | 'body' | 'small' | 'label';

export function ThemedText({
  type = 'body',
  color = 'text',
  style,
  ...rest
}: TextProps & { type?: TextType; color?: ThemeColor }) {
  const theme = useTheme();
  return <Text style={[{ color: theme[color] }, textStyles[type], style]} {...rest} />;
}

/** Scrollable page with safe-area padding and room for the tab bar. */
export function Screen({ children, tabBar = true }: { children: ReactNode; tabBar?: boolean }) {
  const theme = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.background }} edges={['top']}>
      <ScrollView
        contentContainerStyle={[styles.screen, { paddingBottom: (tabBar ? BottomTabInset : 0) + Spacing.five }]}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const theme = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }, style]}>
      {children}
    </View>
  );
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled,
  loading,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost';
  disabled?: boolean;
  loading?: boolean;
}) {
  const theme = useTheme();
  const background =
    variant === 'primary' ? theme.accent : variant === 'secondary' ? theme.accentSoft : 'transparent';
  const color = variant === 'primary' ? theme.accentText : theme.accent;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: background, opacity: disabled ? 0.45 : pressed ? 0.8 : 1 },
      ]}>
      {loading ? (
        <ActivityIndicator color={color} />
      ) : (
        <Text style={[styles.buttonText, { color }]}>{title}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.four,
    gap: Spacing.three,
  },
  card: {
    borderRadius: Radius.medium,
    borderWidth: StyleSheet.hairlineWidth,
    padding: Spacing.three,
    gap: Spacing.two,
  },
  button: {
    minHeight: 50,
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.four,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});

const textStyles = StyleSheet.create({
  title: { fontSize: 32, lineHeight: 38, fontWeight: '700' },
  heading: { fontSize: 20, lineHeight: 26, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 23 },
  small: { fontSize: 14, lineHeight: 20 },
  label: { fontSize: 13, lineHeight: 18, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
});
