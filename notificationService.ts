import PushNotification from 'react-native-push-notification';
import PushNotificationIOS from '@react-native-community/push-notification-ios';
import { Platform } from 'react-native';

// Çok dilli bildirim metinleri
const NOTIFICATION_TRANSLATIONS: {
  [key: string]: {
    reminders: Array<{ title: string; message: string }>;
    notificationsEnabled: { title: string; message: string; button: string };
  };
} = {
  en: {
    reminders: [
      {
        title: '☀️ Good Morning!',
        message: "Let's chat in English for 2 minutes! 🗣️",
      },
      {
        title: '🎯 Lunch Break',
        message: 'Complete your coffee break with English practice! ☕',
      },
      {
        title: '🌆 Evening Practice',
        message: 'How about learning 5 new words today? 📚',
      },
      {
        title: '🌙 Before Day Ends',
        message: "Don't lose your streak! Quick flashcard round! 🃏",
      },
    ],
    notificationsEnabled: {
      title: 'Notifications Enabled!',
      message: 'Daily reminders set:\n\n☀️ 09:00 - Good Morning\n🎯 13:00 - Lunch Break\n🌆 18:00 - Evening Practice\n🌙 21:00 - Before Day Ends',
      button: 'Great!',
    },
  },
  tr: {
    reminders: [
      {
        title: '☀️ Günaydın!',
        message: 'Haydi gel, 2 dakika İngilizce sohbet edelim! 🗣️',
      },
      {
        title: '🎯 Öğle Molası',
        message: 'Kahve molanı İngilizce pratiğiyle tamamla! ☕',
      },
      {
        title: '🌆 Akşam Pratiği',
        message: 'Bugün 5 yeni kelime öğrenmeye ne dersin? 📚',
      },
      {
        title: '🌙 Gün Bitmeden',
        message: 'Streakini kaybetme! Hızlıca 1 flashcard turu at! 🃏',
      },
    ],
    notificationsEnabled: {
      title: 'Bildirimler Açıldı!',
      message: 'Günlük hatırlatıcılar ayarlandı:\n\n☀️ 09:00 - Günaydın\n🎯 13:00 - Öğle molası\n🌆 18:00 - Akşam pratiği\n🌙 21:00 - Gün bitmeden',
      button: 'Harika!',
    },
  },
  ar: {
    reminders: [
      {
        title: '☀️ صباح الخير!',
        message: 'هيا، دعنا نتحدث بالإنجليزية لمدة دقيقتين! 🗣️',
      },
      {
        title: '🎯 استراحة الغداء',
        message: 'أكمل استراحة القهوة مع ممارسة اللغة الإنجليزية! ☕',
      },
      {
        title: '🌆 ممارسة المساء',
        message: 'ما رأيك في تعلم 5 كلمات جديدة اليوم؟ 📚',
      },
      {
        title: '🌙 قبل نهاية اليوم',
        message: 'لا تفقد سلسلتك! جولة سريعة من البطاقات التعليمية! 🃏',
      },
    ],
    notificationsEnabled: {
      title: 'تم تفعيل الإشعارات!',
      message: 'تم ضبط التذكيرات اليومية:\n\n☀️ 09:00 - صباح الخير\n🎯 13:00 - استراحة الغداء\n🌆 18:00 - ممارسة المساء\n🌙 21:00 - قبل نهاية اليوم',
      button: 'رائع!',
    },
  },
  ru: {
    reminders: [
      {
        title: '☀️ Доброе утро!',
        message: 'Давай поговорим по-английски 2 минуты! 🗣️',
      },
      {
        title: '🎯 Обеденный перерыв',
        message: 'Дополни кофе-брейк практикой английского! ☕',
      },
      {
        title: '🌆 Вечерняя практика',
        message: 'Как насчет выучить 5 новых слов сегодня? 📚',
      },
      {
        title: '🌙 Перед концом дня',
        message: 'Не теряй свою серию! Быстрый раунд карточек! 🃏',
      },
    ],
    notificationsEnabled: {
      title: 'Уведомления включены!',
      message: 'Ежедневные напоминания установлены:\n\n☀️ 09:00 - Доброе утро\n🎯 13:00 - Обед\n🌆 18:00 - Вечерняя практика\n🌙 21:00 - Перед концом дня',
      button: 'Отлично!',
    },
  },
};

class NotificationService {
  constructor() {
    // Configure notifications
    PushNotification.configure({
      onRegister: (token: any) => {
        console.log('📱 Push notification token:', token);
      },
      onNotification: (notification: any) => {
        console.log('📬 Notification received:', notification);
        notification.finish(PushNotificationIOS.FetchResult.NoData);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: true,
    });

    // Create notification channel for Android
    if (Platform.OS === 'android') {
      PushNotification.createChannel(
        {
          channelId: 'kspeaker-reminders',
          channelName: 'KSpeaker Reminders',
          channelDescription: 'Daily practice reminders',
          playSound: true,
          soundName: 'default',
          importance: 4,
          vibrate: true,
        },
        (created: boolean) => console.log(`Channel created: ${created}`)
      );
    }
  }

  // Bildirim izni iste
  requestPermissions = async () => {
    try {
      if (Platform.OS === 'ios') {
        const authStatus = await PushNotificationIOS.requestPermissions({
          alert: true,
          badge: true,
          sound: true,
        });
        console.log('📱 iOS Permission status:', authStatus);
        return authStatus.alert || authStatus.badge || authStatus.sound;
      } else {
        const permissions = await PushNotification.requestPermissions();
        console.log('📱 Android Permission status:', permissions);
        return permissions;
      }
    } catch (error) {
      console.error('❌ Permission error:', error);
      return null;
    }
  };

  // Tek seferlik bildirim gönder
  sendLocalNotification = (title: string, message: string, date?: Date) => {
    const scheduledDate = date || new Date(Date.now() + 5 * 1000);
    console.log('📣 Scheduling notification:', {
      title,
      message,
      scheduledDate: scheduledDate.toISOString(),
      platform: Platform.OS,
    });
    
    if (Platform.OS === 'ios') {
      // iOS için - fireDate ile schedule et
      const notificationId = Math.random().toString();
      PushNotificationIOS.addNotificationRequest({
        id: notificationId,
        title: title,
        body: message,
        sound: 'default',
        badge: 1,
        fireDate: scheduledDate,
        userInfo: { id: notificationId },
      });
      console.log('✅ iOS notification scheduled for:', scheduledDate.toLocaleString());
    } else {
      // Android için schedule
      PushNotification.localNotificationSchedule({
        channelId: 'kspeaker-reminders',
        title,
        message,
        date: scheduledDate,
        playSound: true,
        soundName: 'default',
        importance: 'high',
        vibrate: true,
        vibration: 300,
      });
      console.log('✅ Android notification scheduled for:', scheduledDate.toLocaleString());
    }
  };

  // Günlük tekrarlayan bildirimler ayarla
  scheduleDailyReminders = (language: 'en' | 'tr' | 'ar' | 'ru' = 'en') => {
    // Önce tüm mevcut bildirimleri temizle
    this.cancelAllNotifications();

    const reminders = NOTIFICATION_TRANSLATIONS[language].reminders;
    const times = [
      { hour: 9, minute: 0 },
      { hour: 13, minute: 0 },
      { hour: 18, minute: 0 },
      { hour: 21, minute: 0 },
    ];

    reminders.forEach((reminder, index) => {
      const now = new Date();
      const scheduledDate = new Date();
      scheduledDate.setHours(times[index].hour, times[index].minute, 0, 0);

      // Eğer bugünün saati geçtiyse, yarın için ayarla
      if (scheduledDate <= now) {
        scheduledDate.setDate(scheduledDate.getDate() + 1);
      }

      if (Platform.OS === 'ios') {
        // iOS için repeating notification
        PushNotificationIOS.addNotificationRequest({
          id: `daily-${index}`,
          title: reminder.title,
          body: reminder.message,
          sound: 'default',
          badge: 1,
          fireDate: scheduledDate,
          repeats: true, // iOS için günlük tekrar
          repeatsComponent: {
            hour: true,
            minute: true,
          },
          userInfo: { 
            id: `daily-${index}`,
            type: 'daily-reminder'
          },
        });
        console.log(`📅 iOS daily reminder ${index}: ${reminder.title} at ${times[index].hour}:${String(times[index].minute).padStart(2, '0')}`);
      } else {
        // Android için repeating notification
        PushNotification.localNotificationSchedule({
          id: `daily-${index}`,
          channelId: 'kspeaker-reminders',
          title: reminder.title,
          message: reminder.message,
          date: scheduledDate,
          playSound: true,
          soundName: 'default',
          importance: 'high',
          repeatType: 'day', // Her gün tekrarla
          vibrate: true,
          vibration: 300,
        });
        console.log(`📅 Android daily reminder ${index}: ${reminder.title} at ${times[index].hour}:${String(times[index].minute).padStart(2, '0')}`);
      }
    });

    console.log('📅 Günlük bildirimler ayarlandı! Platform:', Platform.OS, 'Dil:', language);
  };

  // Bildirim metinlerini al (ChatScreen'de kullanmak için)
  getNotificationText = (language: 'en' | 'tr' | 'ar' | 'ru' = 'en') => {
    return NOTIFICATION_TRANSLATIONS[language].notificationsEnabled;
  };

  // Motivasyon bildirimleri (rastgele saatlerde)
  scheduleMotivationalNotifications = () => {
    const messages = [
      { title: '🚀 Harika Gidiyorsun!', message: 'Her gün biraz daha ilerle! 💪' },
      { title: '🎓 Bilgi Zamanı', message: 'Yeni kelimeler seni bekliyor! 📖' },
      { title: '🌟 Sen Yapabilirsin!', message: 'Başarı pratikle gelir! 🎯' },
      { title: '💡 İpucu', message: 'AI ile konuşarak daha hızlı öğrenirsin! 🤖' },
      { title: '🎮 Flashcard Zamanı', message: 'Hızlı bir oyun oynamaya ne dersin? 🃏' },
    ];

    messages.forEach((msg, index) => {
      // Rastgele 1-4 saat arası bildirim
      const randomHours = Math.floor(Math.random() * 4) + 1;
      const notificationDate = new Date(Date.now() + randomHours * 60 * 60 * 1000);

      PushNotification.localNotificationSchedule({
        id: `motivational-${index}`,
        channelId: 'kspeaker-reminders',
        title: msg.title,
        message: msg.message,
        date: notificationDate,
        playSound: true,
        soundName: 'default',
      });
    });

    console.log('💪 Motivasyon bildirimleri ayarlandı!');
  };

  // Streak hatırlatıcı (kullanıcı 1 gün uygulama açmazsa)
  scheduleStreakReminder = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(20, 0, 0, 0); // Yarın akşam 20:00

    PushNotification.localNotificationSchedule({
      id: 'streak-reminder',
      channelId: 'kspeaker-reminders',
      title: '🔥 Streakini Kaybetme!',
      message: 'Bugün henüz pratik yapmadın! Hadi gel! ⏰',
      date: tomorrow,
      playSound: true,
      soundName: 'default',
      importance: 'high',
      vibrate: true,
    });
  };

  // Özel saat için hatırlatıcı ayarla
  scheduleCustomReminder = (hour: number, minute: number, title: string, message: string) => {
    const scheduledDate = new Date();
    scheduledDate.setHours(hour, minute, 0, 0);

    // Eğer saat geçtiyse yarın için ayarla
    if (scheduledDate <= new Date()) {
      scheduledDate.setDate(scheduledDate.getDate() + 1);
    }

    PushNotification.localNotificationSchedule({
      id: 'custom-reminder',
      channelId: 'kspeaker-reminders',
      title,
      message,
      date: scheduledDate,
      playSound: true,
      soundName: 'default',
      repeatType: 'day',
    });

    console.log(`⏰ Özel hatırlatıcı ayarlandı: ${hour}:${minute}`);
  };

  // Tüm bildirimleri iptal et
  cancelAllNotifications = () => {
    if (Platform.OS === 'ios') {
      PushNotificationIOS.removeAllPendingNotificationRequests();
      PushNotificationIOS.removeAllDeliveredNotifications();
      console.log('🔕 Tüm iOS bildirimleri iptal edildi');
    } else {
      PushNotification.cancelAllLocalNotifications();
      console.log('🔕 Tüm Android bildirimleri iptal edildi');
    }
  };

  // Belirli bir bildirimi iptal et
  cancelNotification = (id: string) => {
    PushNotification.cancelLocalNotification(id);
  };

  // Bekleyen bildirimleri kontrol et
  checkScheduledNotifications = () => {
    if (Platform.OS === 'ios') {
      PushNotificationIOS.getPendingNotificationRequests((notifications: any[]) => {
        console.log('📋 Planlanmış iOS bildirimleri:', notifications);
      });
    } else {
      PushNotification.getScheduledLocalNotifications((notifications: any[]) => {
        console.log('📋 Planlanmış Android bildirimleri:', notifications);
      });
    }
  };
}

export default new NotificationService();
