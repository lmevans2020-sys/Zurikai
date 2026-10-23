import type { HabitReminders } from './types.ts';

// Pure time helpers for habit reminders. Times are stored as 24-hour "HH:MM" strings in the
// person's local time, so a reminder at "08:00" stays at 8 AM wherever they are.

/** Most reminders one habit can have, so "every hour" can't flood the phone. */
export const MAX_TIMES_PER_HABIT = 16;

export const PRESET_TIMES = [
  { label: 'Morning', time: '08:00' },
  { label: 'Midday', time: '12:00' },
  { label: 'Afternoon', time: '15:00' },
  { label: 'Evening', time: '19:00' },
  { label: 'Bedtime', time: '21:30' },
];

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function fromMinutes(total: number): string {
  const wrapped = ((total % 1440) + 1440) % 1440;
  const hours = Math.floor(wrapped / 60);
  const minutes = wrapped % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function isTime(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{2}:\d{2}$/.test(value)) return false;
  const [hours, minutes] = value.split(':').map(Number);
  return hours < 24 && minutes < 60;
}

/** "08:00" -> "8:00 AM" */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const suffix = hours < 12 ? 'AM' : 'PM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, '0')} ${suffix}`;
}

/** Moves a time by some minutes, wrapping around midnight. */
export function shiftTime(time: string, minutes: number): string {
  return fromMinutes(toMinutes(time) + minutes);
}

/** Sorted, de-duplicated and capped. */
export function normalizeTimes(times: string[]): string[] {
  return [...new Set(times.filter(isTime))].sort((a, b) => toMinutes(a) - toMinutes(b)).slice(0, MAX_TIMES_PER_HABIT);
}

/**
 * Every `everyHours` hours from `start` up to and including `end`, e.g. water every 2 hours
 * from 8 AM to 8 PM. Nothing is scheduled outside that window, which keeps nights quiet.
 */
export function repeatingTimes(everyHours: number, start: string, end: string): string[] {
  const step = Math.max(1, Math.round(everyHours)) * 60;
  const first = toMinutes(start);
  const last = toMinutes(end);
  if (last < first) return [start];
  const times: string[] = [];
  for (let minute = first; minute <= last && times.length < MAX_TIMES_PER_HABIT; minute += step) {
    times.push(fromMinutes(minute));
  }
  return times;
}

/** The daily times a habit's reminders go off. */
export function reminderTimes(reminders: HabitReminders | undefined): string[] {
  if (!reminders) return [];
  if (reminders.kind === 'repeat') return repeatingTimes(reminders.everyHours, reminders.start, reminders.end);
  return normalizeTimes(reminders.times);
}

/** "8:00 AM and 7:00 PM", or "Every 2 hours, 8:00 AM to 8:00 PM". */
export function describeReminders(reminders: HabitReminders | undefined): string | null {
  if (!reminders) return null;
  if (reminders.kind === 'repeat') {
    const every = reminders.everyHours === 1 ? 'Every hour' : `Every ${reminders.everyHours} hours`;
    return `${every}, ${formatTime(reminders.start)} to ${formatTime(reminders.end)}`;
  }
  const times = normalizeTimes(reminders.times).map(formatTime);
  if (times.length === 0) return null;
  if (times.length <= 2) return times.join(' and ');
  return `${times.length} times a day`;
}
