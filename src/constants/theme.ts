/**
 * Zurikai's colors, spacing and type. Every screen reads colors through `useTheme()`
 * so light and dark mode stay in sync.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1B2421',
    textSecondary: '#5E6B66',
    background: '#F6F7F4',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E3ECE7',
    border: '#E1E5E0',
    accent: '#2F5D50',
    accentText: '#FFFFFF',
    accentSoft: '#DCE9E3',
    warm: '#D9822B',
    danger: '#B3261E',
  },
  dark: {
    text: '#EEF2EF',
    textSecondary: '#A3B0AA',
    background: '#0F1412',
    backgroundElement: '#19201D',
    backgroundSelected: '#24302B',
    border: '#2A332F',
    accent: '#7FC4AE',
    accentText: '#0F1412',
    accentSoft: '#22362F',
    warm: '#F0A55B',
    danger: '#F2B8B5',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const Radius = {
  small: 10,
  medium: 16,
  large: 24,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 640;
