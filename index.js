/**
 * @format
 */

import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Initialize Firebase Crashlytics
if (!__DEV__) {
  const crashlytics = require('@react-native-firebase/crashlytics').default;
  crashlytics().setCrashlyticsCollectionEnabled(true);
}

AppRegistry.registerComponent(appName, () => App);
