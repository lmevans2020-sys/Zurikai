'use no memo';
// The widget library draws these components itself and breaks if the React Compiler rewrites them.

import { FlexWidget, TextWidget } from 'react-native-android-widget';

// The Android home-screen widget: today's habits, each tappable to tick it off, and the
// current streak. Widgets are drawn from this JSX but are not React Native views, so only the
// widget library's own components work here.

export type WidgetHabit = { id: string; emoji: string; name: string; done: boolean };

const GREEN = '#2F5D50';
const LEAF = '#2CA13A';
const BACKGROUND = '#EEF2EF';
const TEXT = '#1B2420';
const MUTED = '#5F6B66';

export function HabitsWidget({ habits, streak }: { habits: WidgetHabit[]; streak: number }) {
  const doneCount = habits.filter((habit) => habit.done).length;
  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: BACKGROUND,
        borderRadius: 20,
        padding: 12,
        flexDirection: 'column',
        flexGap: 6,
      }}>
      <FlexWidget
        clickAction="OPEN_APP"
        style={{ width: 'match_parent', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <TextWidget text="SteadyThrive" style={{ fontSize: 15, fontWeight: '700', color: GREEN }} />
        <TextWidget
          text={streak > 0 ? `🔥 ${streak}` : `${doneCount}/${habits.length}`}
          style={{ fontSize: 14, fontWeight: '600', color: GREEN }}
        />
      </FlexWidget>

      {habits.length === 0 ? (
        <TextWidget text="Nothing planned today. Enjoy it 🌱" style={{ fontSize: 13, color: MUTED }} clickAction="OPEN_APP" />
      ) : (
        habits.slice(0, 5).map((habit) => (
          <FlexWidget
            key={habit.id}
            clickAction="TOGGLE_HABIT"
            clickActionData={{ habitId: habit.id }}
            style={{
              width: 'match_parent',
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: habit.done ? '#DCEBE3' : '#FFFFFF',
              borderRadius: 12,
              paddingHorizontal: 10,
              paddingVertical: 7,
              flexGap: 8,
            }}>
            <TextWidget text={habit.emoji} style={{ fontSize: 16 }} />
            <FlexWidget style={{ flex: 1 }}>
              <TextWidget
                text={habit.name}
                maxLines={1}
                truncate="END"
                style={{ fontSize: 14, color: habit.done ? MUTED : TEXT }}
              />
            </FlexWidget>
            <TextWidget text={habit.done ? '✓' : '○'} style={{ fontSize: 16, fontWeight: '700', color: habit.done ? LEAF : MUTED }} />
          </FlexWidget>
        ))
      )}
    </FlexWidget>
  );
}
