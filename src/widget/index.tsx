import { Platform } from 'react-native';

import { HabitsWidget } from '@/widget/habits-widget';
import { toggleFromWidget, widgetState } from '@/widget/widget-data';

// Android home-screen widget wiring. The widget library is native code that Expo Go doesn't
// have, so it is loaded defensively and everything here quietly does nothing there.

export const WIDGET_NAME = 'Habits';

type WidgetLibrary = typeof import('react-native-android-widget');

function loadLibrary(): WidgetLibrary | null {
  if (Platform.OS !== 'android') return null;
  try {
    return require('react-native-android-widget') as WidgetLibrary;
  } catch {
    return null;
  }
}

const library = loadLibrary();

async function render() {
  const { habits, streak } = await widgetState();
  return <HabitsWidget habits={habits} streak={streak} />;
}

/** Runs when the widget is added, updated or tapped, even if the app isn't open. */
export function registerHabitsWidget() {
  library?.registerWidgetTaskHandler(async ({ widgetAction, clickAction, clickActionData, renderWidget }) => {
    if (widgetAction === 'WIDGET_DELETED') return;
    if (widgetAction === 'WIDGET_CLICK' && clickAction === 'TOGGLE_HABIT') {
      const habitId = clickActionData?.habitId;
      if (typeof habitId === 'string') await toggleFromWidget(habitId);
    }
    renderWidget(await render());
  });
}

/** Redraws the widget after the app changes habits or check-ins. */
export function refreshHabitsWidget() {
  library?.requestWidgetUpdate({ widgetName: WIDGET_NAME, renderWidget: render }).catch(() => {});
}
