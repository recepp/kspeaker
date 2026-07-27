import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from '../../../../notificationService';
import {
  hasNotificationPermission,
  requestNotificationPermission,
} from '../../../platform/permissions';
import type { AppLanguage } from '../types';

const NOTIF_KEY = 'notificationsEnabled';

export function useNotificationSettings(language: AppLanguage) {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const stored = await AsyncStorage.getItem(NOTIF_KEY);
        if (stored === null) {
          const hasPermission = await hasNotificationPermission();
          if (hasPermission) {
            setNotificationsEnabled(true);
            NotificationService.scheduleDailyReminders(language);
            await AsyncStorage.setItem(NOTIF_KEY, 'true');
          }
          return;
        }

        if (stored === 'true') {
          const hasPermission = await hasNotificationPermission();
          if (hasPermission) {
            setNotificationsEnabled(true);
            NotificationService.checkScheduledNotifications();
          } else {
            setNotificationsEnabled(false);
            await AsyncStorage.setItem(NOTIF_KEY, 'false');
          }
        }
      } catch (error) {
        console.error('[Notifications] Load error:', error);
      }
    };
    init();
    // Intentionally once on mount; language reschedule handled separately
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!notificationsEnabled) return;
    NotificationService.scheduleDailyReminders(language);
  }, [language, notificationsEnabled]);

  const enableNotifications = useCallback(async () => {
    let granted = await hasNotificationPermission();
    if (!granted) {
      granted = await requestNotificationPermission();
      // iOS path also goes through NotificationService
      if (!granted) {
        granted = await NotificationService.requestPermissions();
      }
    }

    if (!granted) {
      setNotificationsEnabled(false);
      Alert.alert(
        'İzin Gerekli',
        'Bildirimler için lütfen ayarlardan izin verin.',
        [{ text: 'Tamam' }]
      );
      return false;
    }

    setNotificationsEnabled(true);
    NotificationService.scheduleDailyReminders(language);
    await AsyncStorage.setItem(NOTIF_KEY, 'true');
    setTimeout(() => NotificationService.checkScheduledNotifications(), 1000);

    const text = NotificationService.getNotificationText(language);
    Alert.alert(text.title, text.message, [{ text: text.button }]);
    return true;
  }, [language]);

  const disableNotifications = useCallback(async () => {
    setNotificationsEnabled(false);
    NotificationService.cancelAllNotifications();
    await AsyncStorage.setItem(NOTIF_KEY, 'false');
    Alert.alert('🔕 Bildirimler Kapatıldı', 'Artık hatırlatma almayacaksın.');
  }, []);

  const toggleNotifications = useCallback(async () => {
    if (notificationsEnabled) {
      await disableNotifications();
      return;
    }
    await enableNotifications();
  }, [notificationsEnabled, enableNotifications, disableNotifications]);

  return {
    notificationsEnabled,
    toggleNotifications,
    enableNotifications,
    disableNotifications,
  };
}
