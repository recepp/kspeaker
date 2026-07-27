export type NotificationLanguage = 'en' | 'tr' | 'ar' | 'ru';

export const DAILY_REMINDER_TIMES = [
  { hour: 9, minute: 0 },
  { hour: 13, minute: 0 },
  { hour: 18, minute: 0 },
  { hour: 21, minute: 0 },
] as const;

export const NOTIFICATION_CHANNEL_ID = 'kspeaker-reminders';

/** Android local notification IDs must be numeric. */
export function dailyReminderAndroidId(index: number): number {
  return 1000 + index;
}

export function dailyReminderIosId(index: number): string {
  return `daily-${index}`;
}

/**
 * Next fire date for a daily reminder slot (today if upcoming, else tomorrow).
 */
export function nextDailyFireDate(
  hour: number,
  minute: number,
  now: Date = new Date()
): Date {
  const scheduled = new Date(now);
  scheduled.setHours(hour, minute, 0, 0);
  if (scheduled <= now) {
    scheduled.setDate(scheduled.getDate() + 1);
  }
  return scheduled;
}
