import type { NotificationLanguage } from './schedule';

export const NOTIFICATION_TRANSLATIONS: Record<
  NotificationLanguage,
  {
    reminders: Array<{ title: string; message: string }>;
    notificationsEnabled: { title: string; message: string; button: string };
  }
> = {
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
      message:
        'Daily reminders set:\n\n☀️ 09:00 - Good Morning\n🎯 13:00 - Lunch Break\n🌆 18:00 - Evening Practice\n🌙 21:00 - Before Day Ends',
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
      message:
        'Günlük hatırlatıcılar ayarlandı:\n\n☀️ 09:00 - Günaydın\n🎯 13:00 - Öğle molası\n🌆 18:00 - Akşam pratiği\n🌙 21:00 - Gün bitmeden',
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
      message:
        'تم ضبط التذكيرات اليومية:\n\n☀️ 09:00 - صباح الخير\n🎯 13:00 - استراحة الغداء\n🌆 18:00 - ممارسة المساء\n🌙 21:00 - قبل نهاية اليوم',
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
      message:
        'Ежедневные напоминания установлены:\n\n☀️ 09:00 - Доброе утро\n🎯 13:00 - Обед\n🌆 18:00 - Вечерняя практика\n🌙 21:00 - Перед концом дня',
      button: 'Отлично!',
    },
  },
};
