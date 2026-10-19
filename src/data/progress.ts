import { findWorkout, workoutMinutes } from '@/data/workouts';
import { DayLog, dayKey } from '@/state/store';

export type DaySummary = {
  key: string;
  label: string;
  isToday: boolean;
  minutes: number;
  workouts: number;
  water: number;
  sleepMinutes?: number;
};

const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function minutesFor(day: DayLog | undefined): number {
  if (!day) return 0;
  return day.workouts.reduce((total, entry) => {
    const workout = findWorkout(entry.id);
    return total + (workout ? workoutMinutes(workout) : 0);
  }, 0);
}

// The last seven days, oldest first, ending today on the driver's own clock.
export function lastWeek(days: Record<string, DayLog>, now = new Date()): DaySummary[] {
  const summaries: DaySummary[] = [];
  for (let back = 6; back >= 0; back--) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back);
    const key = dayKey(date);
    const day = days[key];
    summaries.push({
      key,
      label: back === 0 ? 'Today' : weekdays[date.getDay()],
      isToday: back === 0,
      minutes: minutesFor(day),
      workouts: day?.workouts.length ?? 0,
      water: day?.water ?? 0,
      sleepMinutes: day?.sleepMinutes,
    });
  }
  return summaries;
}

// Days in a row with at least one workout. A streak still counts if today
// has no workout yet, so it doesn't reset first thing in the morning.
export function workoutStreak(days: Record<string, DayLog>, now = new Date()): number {
  let streak = 0;
  for (let back = 0; ; back++) {
    const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back);
    const done = (days[dayKey(date)]?.workouts.length ?? 0) > 0;
    if (done) streak++;
    else if (back > 0) break;
    if (back > 3650) break;
  }
  return streak;
}

// Averages only count days the driver logged something, so a day they
// didn't open the app doesn't drag the number down.
export function average(values: (number | undefined)[]): number | undefined {
  const logged = values.filter((value): value is number => value !== undefined && value > 0);
  if (logged.length === 0) return undefined;
  return logged.reduce((sum, value) => sum + value, 0) / logged.length;
}
