// Only the parts of expo-notifications that reminders use, imported one by one.
//
// The package's main entry also loads push-notification modules (such as topic subscriptions)
// that Expo Go on Android doesn't include, which crashes the app on start. Local reminders
// don't need any of that, so we skip the main entry.
export { getPermissionsAsync, requestPermissionsAsync } from 'expo-notifications/build/NotificationPermissions';
export { setNotificationHandler } from 'expo-notifications/build/NotificationsHandler';
export { scheduleNotificationAsync } from 'expo-notifications/build/scheduleNotificationAsync';
export { cancelAllScheduledNotificationsAsync } from 'expo-notifications/build/cancelAllScheduledNotificationsAsync';
export { setNotificationChannelAsync } from 'expo-notifications/build/setNotificationChannelAsync';
export { AndroidImportance } from 'expo-notifications/build/NotificationChannelManager.types';
export { SchedulableTriggerInputTypes } from 'expo-notifications/build/Notifications.types';
export { setNotificationCategoryAsync } from 'expo-notifications/build/setNotificationCategoryAsync';
export {
  addNotificationResponseReceivedListener,
  clearLastNotificationResponseAsync,
  getLastNotificationResponseAsync,
} from 'expo-notifications/build/NotificationsEmitter';
