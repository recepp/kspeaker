/**
 * @format
 */

import * as Sentry from '@sentry/react-native';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

// Sentry initialization
Sentry.init({
  dsn: 'https://6e0f332e28a5e0e832ae73e796931f33@o4510614117875713.ingest.de.sentry.io/4510614119907408',
  tracesSampleRate: __DEV__ ? 1.0 : 0.2,
  enabled: !__DEV__,
  environment: __DEV__ ? 'development' : 'production',
  enableNative: true,
  enableNativeCrashHandling: true,
  enableAutoSessionTracking: true,
  beforeSend(event) {
    if (__DEV__) {
      console.log('[Sentry] Event:', event.message || event.exception);
    }
    return event;
  },
});

AppRegistry.registerComponent(appName, () => App);
