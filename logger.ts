import * as Sentry from '@sentry/react-native';

// Production-ready error logging with Sentry
export const logError = (error: Error, context?: string) => {
  if (__DEV__) {
    console.error(`[Error] ${context}:`, error);
  } else {
    // Production: Send to Sentry
    Sentry.captureException(error, {
      tags: { context: context || 'unknown' },
    });
  }
};

export const logInfo = (message: string, ...args: any[]) => {
  if (__DEV__) {
    console.log(message, ...args);
  } else {
    // Production: Add breadcrumb for debugging context
    Sentry.addBreadcrumb({
      message,
      level: 'info',
      data: args.length > 0 ? { args } : undefined,
    });
  }
};

export const logWarning = (message: string, ...args: any[]) => {
  if (__DEV__) {
    console.warn(message, ...args);
  } else {
    // Production: Send warning to Sentry
    Sentry.captureMessage(message, {
      level: 'warning',
      extra: args.length > 0 ? { args } : undefined,
    });
  }
};
