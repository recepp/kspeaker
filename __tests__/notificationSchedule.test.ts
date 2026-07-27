import {
  nextDailyFireDate,
  dailyReminderAndroidId,
  DAILY_REMINDER_TIMES,
} from '../src/shared/notifications/schedule';

describe('daily notification schedule', () => {
  it('schedules four reminder slots', () => {
    expect(DAILY_REMINDER_TIMES).toHaveLength(4);
    expect(DAILY_REMINDER_TIMES[0]).toEqual({ hour: 9, minute: 0 });
    expect(DAILY_REMINDER_TIMES[3]).toEqual({ hour: 21, minute: 0 });
  });

  it('uses numeric Android notification ids', () => {
    expect(dailyReminderAndroidId(0)).toBe(1000);
    expect(dailyReminderAndroidId(3)).toBe(1003);
  });

  it('picks today when slot is in the future', () => {
    const now = new Date('2026-07-27T08:00:00');
    const next = nextDailyFireDate(9, 0, now);
    expect(next.getDate()).toBe(27);
    expect(next.getHours()).toBe(9);
  });

  it('rolls to tomorrow when slot already passed', () => {
    const now = new Date('2026-07-27T10:00:00');
    const next = nextDailyFireDate(9, 0, now);
    expect(next.getDate()).toBe(28);
    expect(next.getHours()).toBe(9);
  });
});
