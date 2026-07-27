import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { DeviceEventEmitter, Platform } from 'react-native';
import { NOTIFICATION_TRANSLATIONS } from './src/shared/notifications/translations';
import {
  DAILY_REMINDER_TIMES,
  NOTIFICATION_CHANNEL_ID,
  dailyReminderAndroidId,
  dailyReminderIosId,
  nextDailyFireDate,
  type NotificationLanguage,
} from './src/shared/notifications/schedule';
import {
  hasNotificationPermission,
  requestNotificationPermission,
} from './src/platform/permissions';

class NotificationService {
  private openListenerAttached = false;

  constructor() {
    PushNotification.configure({
      onRegister: (token: { os: string; token: string }) => {
        if (__DEV__) {
          console.log('[Notifications] Push token:', token);
        }
      },
      onNotification: (notification: {
        finish: (result: string) => void;
      }) => {
        if (__DEV__) {
          console.log('[Notifications] Received:', notification);
        }
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      // Android 13+ uses PermissionsAndroid; avoid auto-prompt race
      requestPermissions: Platform.OS === 'ios',
    });

    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: NOTIFICATION_CHANNEL_ID,
          channelName: 'KSpeaker Reminders',
          channelDescription: 'Daily practice reminders',
          playSound: true,
          soundName: 'default',
          importance: 4,
          vibrate: true,
        },
        (created: boolean) => {
          if (__DEV__) {
            console.log(`[Notifications] Channel created: ${created}`);
          }
        }
      );
    }

    this.attachNotificationOpenListener();
  }

  /**
   * Android MainActivity emits "notificationOpened"; iOS finishes via PushNotificationIOS.
   */
  private attachNotificationOpenListener() {
    if (this.openListenerAttached) return;
    this.openListenerAttached = true;
    DeviceEventEmitter.addListener('notificationOpened', (payload) => {
      if (__DEV__) {
        console.log('[Notifications] Opened from native:', payload);
      }
    });
  }

  requestPermissions = async (): Promise<boolean> => {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await PushNotificationIOS.requestPermissions({
          alert: true,
          badge: true,
          sound: true,
        });
        return !!(authStatus.alert || authStatus.badge || authStatus.sound);
      }

      const already = await hasNotificationPermission();
      if (already) return true;
      return await requestNotificationPermission();
    } catch (error) {
      console.error('[Notifications] Permission error:', error);
      return false;
    }
  };

  checkAndroidPermission = async (): Promise<boolean> => {
    return hasNotificationPermission();
  };

  sendLocalNotification = (title: string, message: string, date?: Date) => {
    const scheduledDate = date || new Date(Date.now() + 5 * 1000);

    if (Platform.OS === 'ios') {
      PushNotificationIOS.addNotificationRequest({
        id: Math.random().toString(36).slice(2),
        title,
        body: message,
        sound: 'default',
        badge: 1,
        fireDate: scheduledDate,
      });
      return;
    }

    PushNotification.localNotificationSchedule({
      channelId: NOTIFICATION_CHANNEL_ID,
      title,
      message,
      date: scheduledDate,
      playSound: true,
      soundName: 'default',
      importance: 'high',
      vibrate: true,
      vibration: 300,
      allowWhileIdle: true,
    });
  };

  scheduleDailyReminders = (language: NotificationLanguage = 'en') => {
    this.cancelAllNotifications();

    const reminders = NOTIFICATION_TRANSLATIONS[language].reminders;

    reminders.forEach((reminder, index) => {
      const slot = DAILY_REMINDER_TIMES[index];
      const scheduledDate = nextDailyFireDate(slot.hour, slot.minute);

      if (Platform.OS === 'ios') {
        PushNotificationIOS.addNotificationRequest({
          id: dailyReminderIosId(index),
          title: reminder.title,
          body: reminder.message,
          sound: 'default',
          badge: 1,
          fireDate: scheduledDate,
          repeats: true,
          repeatsComponent: {
            hour: true,
            minute: true,
          },
          userInfo: {
            id: dailyReminderIosId(index),
            type: 'daily-reminder',
          },
        });
        return;
      }

      PushNotification.localNotificationSchedule({
        id: dailyReminderAndroidId(index),
        channelId: NOTIFICATION_CHANNEL_ID,
        title: reminder.title,
        message: reminder.message,
        date: scheduledDate,
        playSound: true,
        soundName: 'default',
        importance: 'high',
        repeatType: 'day',
        vibrate: true,
        vibration: 300,
        allowWhileIdle: true,
        userInfo: {
          notification_id: String(dailyReminderAndroidId(index)),
          title: reminder.title,
          message: reminder.message,
          type: 'daily-reminder',
        },
      });
    });

    if (__DEV__) {
      console.log('[Notifications] Daily reminders scheduled', {
        platform: Platform.OS,
        language,
      });
    }
  };

  getNotificationText = (language: NotificationLanguage = 'en') => {
    return NOTIFICATION_TRANSLATIONS[language].notificationsEnabled;
  };

  cancelAllNotifications = () => {
    if (Platform.OS === 'ios') {
      PushNotificationIOS.removeAllPendingNotificationRequests();
      PushNotificationIOS.removeAllDeliveredNotifications();
      return;
    }
    PushNotification.cancelAllLocalNotifications();
  };

  cancelNotification = (id: string | number) => {
    PushNotification.cancelLocalNotification({ id } as never);
  };

  checkScheduledNotifications = () => {
    if (Platform.OS === 'ios') {
      PushNotificationIOS.getPendingNotificationRequests((notifications) => {
        if (__DEV__) {
          console.log('[Notifications] Pending iOS:', notifications);
        }
      });
      return;
    }
    PushNotification.getScheduledLocalNotifications((notifications) => {
      if (__DEV__) {
        console.log('[Notifications] Pending Android:', notifications);
      }
    });
  };
}

export default new NotificationService();
