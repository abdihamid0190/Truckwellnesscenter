import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import type { Gear } from '@/data/workouts';
import type { ReminderSettings } from '@/lib/reminders';

export type RunType = 'Over the road' | 'Regional' | 'Local';
export type Mood = 'Rough' | 'Stiff' | 'Good';

export type Profile = {
  run: RunType;
  goals: string[];
  gear: Gear;
};

export type DayLog = {
  mood?: Mood;
  water: number;
  sleepMinutes?: number;
  workouts: { id: string; at: number }[];
};

type Saved = {
  profile: Profile | null;
  days: Record<string, DayLog>;
  reminders?: ReminderSettings;
};

type Store = Saved & {
  loaded: boolean;
  today: DayLog;
  saveProfile: (profile: Profile) => void;
  setMood: (mood: Mood) => void;
  addWater: (cups: number) => void;
  setSleep: (minutes: number) => void;
  logWorkout: (id: string) => void;
  setReminders: (reminders: ReminderSettings) => void;
};

const STORAGE_KEY = 'wellness-state-v1';
export const WATER_GOAL = 8;

const emptyDay: DayLog = { water: 0, workouts: [] };

// Local calendar date, so "today" follows the driver's own clock.
export function dayKey(date = new Date()): string {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

const StoreContext = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [saved, setSaved] = useState<Saved>({ profile: null, days: {} });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((raw) => {
        if (raw) setSaved(JSON.parse(raw) as Saved);
      })
      .catch(() => {
        // Start fresh if storage can't be read; nothing else depends on it.
      })
      .finally(() => setLoaded(true));
  }, []);

  const update = useCallback((change: (current: Saved) => Saved) => {
    setSaved((current) => {
      const next = change(current);
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const updateToday = useCallback(
    (change: (day: DayLog) => DayLog) => {
      update((current) => {
        const key = dayKey();
        return { ...current, days: { ...current.days, [key]: change(current.days[key] ?? emptyDay) } };
      });
    },
    [update],
  );

  const store = useMemo<Store>(
    () => ({
      ...saved,
      loaded,
      today: saved.days[dayKey()] ?? emptyDay,
      saveProfile: (profile) => update((current) => ({ ...current, profile })),
      setMood: (mood) => updateToday((day) => ({ ...day, mood })),
      addWater: (cups) =>
        updateToday((day) => ({ ...day, water: Math.min(WATER_GOAL * 2, Math.max(0, day.water + cups)) })),
      setSleep: (minutes) => updateToday((day) => ({ ...day, sleepMinutes: Math.max(0, minutes) })),
      logWorkout: (id) => updateToday((day) => ({ ...day, workouts: [...day.workouts, { id, at: Date.now() }] })),
      setReminders: (reminders) => update((current) => ({ ...current, reminders })),
    }),
    [saved, loaded, update, updateToday],
  );

  return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>;
}

export function useStore(): Store {
  const store = useContext(StoreContext);
  if (!store) throw new Error('useStore must be used inside StoreProvider');
  return store;
}
