import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { Platform } from 'react-native';

// Water and stretch nudges are scheduled on the phone itself, so they work
// with no signal and no server. Every message assumes the driver is parked.

export type ReminderSettings = { water: boolean; stretch: boolean };

export const remindersSupported = Platform.OS !== 'web';

export const WATER_HOURS = [9, 11, 13, 15, 17, 19];
export const STRETCH_HOURS = [10, 14, 18];

const CHANNEL_ID = 'reminders';

if (remindersSupported) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

async function allowed(): Promise<boolean> {
  let { granted } = await Notifications.getPermissionsAsync();
  if (!granted) ({ granted } = await Notifications.requestPermissionsAsync());
  return granted;
}

function at(hour: number, title: string, body: string) {
  return Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour, minute: 0, channelId: CHANNEL_ID },
  });
}

// Replaces whatever was scheduled before. Returns false when the driver has
// turned notifications off for the app, so the screen can say so.
export async function applyReminders(settings: ReminderSettings): Promise<boolean> {
  if (!remindersSupported) return false;
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!settings.water && !settings.stretch) return true;
  if (!(await allowed())) return false;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Water and stretch reminders',
      importance: AndroidImportance.DEFAULT,
    });
  }

  const jobs: Promise<string>[] = [];
  if (settings.water) {
    for (const hour of WATER_HOURS) {
      jobs.push(at(hour, 'Water break', 'Next time you’re parked, drink a cup of water.'));
    }
  }
  if (settings.stretch) {
    for (const hour of STRETCH_HOURS) {
      jobs.push(at(hour, 'Stretch break', 'When you’re parked, take 5 minutes to loosen your back and hips.'));
    }
  }
  await Promise.all(jobs);
  return true;
}

export function formatHour(hour: number): string {
  const suffix = hour < 12 ? 'am' : 'pm';
  return `${hour % 12 === 0 ? 12 : hour % 12}${suffix}`;
}
