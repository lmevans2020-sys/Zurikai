import { Alert } from 'react-native';

// In a release build a startup error closes the app with no explanation. While we're testing,
// show the error instead so it can be screenshotted and fixed. Errors are still passed on to the
// previous handler (and recorded by EAS Observe), just not as fatal.

if (!__DEV__) {
  const previous = ErrorUtils.getGlobalHandler();
  ErrorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
    if (isFatal) {
      const err = error instanceof Error ? error : new Error(String(error));
      const where = (err.stack ?? '').split('\n').slice(0, 6).join('\n');
      Alert.alert('SteadyThrive hit a problem', `Please send a screenshot of this:\n\n${err.message}\n\n${where}`);
    }
    previous(error, false);
  });
}
