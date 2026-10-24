// App entry. Starts error reporting first so startup crashes are recorded, then Expo Router,
// then registers the Android home-screen widget's background handler, which must happen at
// startup so the widget works while the app is closed.
import 'expo-observe';
import '@/lib/crash-alert';
import 'expo-router/entry';

import { registerHabitsWidget } from '@/widget';

registerHabitsWidget();
