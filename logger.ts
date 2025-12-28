import crashlytics from '@react-native-firebase/crashlytics';

// Production-ready error logging
export const logError = (error: Error, context?: string) => {
  if (__DEV__) {
    console.error(`[Error] ${context}:`, error);
  } else {
    // In production, log to Firebase Crashlytics
    crashlytics().recordError(error);
    if (context) {
      crashlytics().log(`Context: ${context}`);
    }
  }
};

export const logInfo = (message: string, ...args: any[]) => {
  if (__DEV__) {
    console.log(message, ...args);
  } else {
    // Production: Log to Firebase Crashlytics
    crashlytics().log(message);
  }
};

export const logWarning = (message: string, ...args: any[]) => {
  if (__DEV__) {
    console.warn(message, ...args);
  } else {
    // Production: Log to Firebase Crashlytics
    crashlytics().log(`[Warning] ${message}`);
  }
};
