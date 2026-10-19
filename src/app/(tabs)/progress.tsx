import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Card, SectionLabel } from '@/components/ui';
import { colors } from '@/constants/theme';
import { average, DaySummary, lastWeek, workoutStreak } from '@/data/progress';
import {
  applyReminders,
  formatHour,
  ReminderSettings,
  remindersSupported,
  STRETCH_HOURS,
  WATER_HOURS,
} from '@/lib/reminders';
import { useStore, WATER_GOAL } from '@/state/store';

const CHART_HEIGHT = 140;

function formatSleep(minutes: number): string {
  return `${Math.floor(minutes / 60)}h ${Math.round(minutes % 60)}m`;
}

function dayDetail(day: DaySummary): string {
  const parts = [
    day.workouts === 0 ? 'No workouts' : `${day.minutes} min moved`,
    `${day.water} cup${day.water === 1 ? '' : 's'} of water`,
  ];
  if (day.sleepMinutes !== undefined) parts.push(`${formatSleep(day.sleepMinutes)} sleep`);
  return `${day.label}: ${parts.join(' · ')}`;
}

function MinutesChart({ week }: { week: DaySummary[] }) {
  const [selected, setSelected] = useState(week.length - 1);
  const max = Math.max(15, ...week.map((day) => day.minutes));

  return (
    <View style={styles.chart}>
      <View style={styles.bars}>
        {week.map((day, index) => {
          const height = day.minutes === 0 ? 2 : Math.max(6, (day.minutes / max) * CHART_HEIGHT);
          return (
            <Pressable
              key={day.key}
              accessibilityRole="button"
              accessibilityLabel={dayDetail(day)}
              accessibilityState={{ selected: index === selected }}
              onPress={() => setSelected(index)}
              style={styles.barSlot}>
              {index === selected && day.minutes > 0 && <Text style={styles.barValue}>{day.minutes}</Text>}
              <View
                style={[
                  styles.bar,
                  { height },
                  day.minutes === 0 && styles.barEmpty,
                ]}
              />
            </Pressable>
          );
        })}
      </View>
      <View style={styles.axis}>
        {week.map((day, index) => (
          <Text key={day.key} style={[styles.axisLabel, index === selected && styles.axisLabelSelected]}>
            {day.label}
          </Text>
        ))}
      </View>
      <Text style={styles.detail}>{dayDetail(week[selected])}</Text>
    </View>
  );
}

function Tile({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <Card style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>
        {value}
        {unit && <Text style={styles.tileUnit}> {unit}</Text>}
      </Text>
    </Card>
  );
}

function ReminderRow({
  title,
  hours,
  value,
  onChange,
}: {
  title: string;
  hours: number[];
  value: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <View style={styles.reminderRow}>
      <View style={styles.flex}>
        <Text style={styles.reminderTitle}>{title}</Text>
        <Text style={styles.reminderMeta}>{hours.map(formatHour).join(', ')}</Text>
      </View>
      <Switch
        accessibilityLabel={title}
        value={value}
        onValueChange={onChange}
        disabled={!remindersSupported}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={colors.text}
      />
    </View>
  );
}

export default function ProgressScreen() {
  const { days, reminders, setReminders } = useStore();
  const [notice, setNotice] = useState<string | null>(null);
  const week = lastWeek(days);
  const streak = workoutStreak(days);
  const minutes = week.reduce((sum, day) => sum + day.minutes, 0);
  const water = average(week.map((day) => day.water));
  const sleep = average(week.map((day) => day.sleepMinutes));
  const settings: ReminderSettings = reminders ?? { water: false, stretch: false };

  const change = async (next: ReminderSettings) => {
    setReminders(next);
    try {
      const ok = await applyReminders(next);
      setNotice(ok ? null : 'Notifications are off for this app. Turn them on in your phone’s Settings.');
    } catch {
      setNotice('Couldn’t set reminders. Try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Progress</Text>

        <View style={styles.row}>
          <Tile label="Streak" value={String(streak)} unit={streak === 1 ? 'day' : 'days'} />
          <Tile label="This week" value={String(minutes)} unit="min" />
        </View>
        <View style={styles.row}>
          <Tile label="Water" value={water === undefined ? '—' : water.toFixed(1)} unit={`/ ${WATER_GOAL} cups`} />
          <Tile label="Sleep" value={sleep === undefined ? '—' : formatSleep(sleep)} />
        </View>
        <Text style={styles.note}>Water and sleep are daily averages for days you logged them.</Text>

        <Card>
          <SectionLabel>Minutes moved, last 7 days</SectionLabel>
          {minutes === 0 ? (
            <Text style={styles.empty}>Finish a workout and your week shows up here.</Text>
          ) : (
            <MinutesChart week={week} />
          )}
        </Card>

        <Card>
          <SectionLabel>Reminders</SectionLabel>
          <ReminderRow
            title="Water breaks"
            hours={WATER_HOURS}
            value={settings.water}
            onChange={(water) => change({ ...settings, water })}
          />
          <ReminderRow
            title="Stretch breaks"
            hours={STRETCH_HOURS}
            value={settings.stretch}
            onChange={(stretch) => change({ ...settings, stretch })}
          />
          <Text style={styles.note}>
            {remindersSupported
              ? 'Reminders come from your phone, so they work with no signal. Only act on them when you’re parked.'
              : 'Reminders work in the phone app, not in the browser.'}
          </Text>
          {notice && <Text style={styles.notice}>{notice}</Text>}
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 14 },
  title: { color: colors.text, fontSize: 32, fontWeight: '800', marginTop: 8 },
  row: { flexDirection: 'row', gap: 12 },
  flex: { flex: 1 },
  tile: { flex: 1, gap: 4 },
  tileLabel: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
  tileValue: { color: colors.text, fontSize: 28, fontWeight: '800' },
  tileUnit: { color: colors.textMuted, fontSize: 15, fontWeight: '500' },
  note: { color: colors.textMuted, fontSize: 13, lineHeight: 18 },
  notice: { color: colors.accent, fontSize: 15, lineHeight: 20 },
  chart: { gap: 8 },
  bars: { flexDirection: 'row', alignItems: 'flex-end', height: CHART_HEIGHT + 24, gap: 6 },
  barSlot: { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center', gap: 4 },
  bar: { width: '70%', maxWidth: 28, backgroundColor: colors.accent, borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  barEmpty: { backgroundColor: colors.border },
  barValue: { color: colors.text, fontSize: 13, fontWeight: '700' },
  axis: { flexDirection: 'row', gap: 6, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6 },
  axisLabel: { flex: 1, color: colors.textMuted, fontSize: 12, textAlign: 'center' },
  axisLabelSelected: { color: colors.text, fontWeight: '700' },
  empty: { color: colors.textSecondary, fontSize: 16, lineHeight: 22, paddingVertical: 24, textAlign: 'center' },
  detail: { color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 4 },
  reminderRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56 },
  reminderTitle: { color: colors.text, fontSize: 17, fontWeight: '600' },
  reminderMeta: { color: colors.textMuted, fontSize: 14 },
});
