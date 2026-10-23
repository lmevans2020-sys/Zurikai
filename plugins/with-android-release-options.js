// Turns off R8 code shrinking in Android release builds. Some native libraries in this app
// don't ship shrinking rules, so shrinking can strip code they need and crash the app at launch.
const { withGradleProperties } = require('expo/config-plugins');

module.exports = function withAndroidReleaseOptions(config) {
  return withGradleProperties(config, (config) => {
    const key = 'android.enableMinifyInReleaseBuilds';
    config.modResults = config.modResults.filter((item) => !(item.type === 'property' && item.key === key));
    config.modResults.push({ type: 'property', key, value: 'false' });
    return config;
  });
};
