import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, Chip, SectionLabel } from '@/components/ui';
import { colors } from '@/constants/theme';
import { pickNextWorkout, workoutMinutes, workoutSummary } from '@/data/workouts';
import { Mood, useStore, WATER_GOAL } from '@/state/store';

const moods: Mood[] = ['Rough', 'Stiff', 'Good'];

function greeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

function formatSleep(minutes: number): string {
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}

export default function TodayScreen() {
  const { profile, today, setMood, addWater, setSleep } = useStore();
  const doneToday = today.workouts.map((entry) => entry.id);
  const next = pickNextWorkout(profile?.gear ?? 'none', profile?.goals ?? [], doneToday);
  const sleep = today.sleepMinutes;

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.kicker}>{greeting(new Date().getHours())}</Text>
          <Text style={styles.title}>How’s the body today?</Text>
        </View>

        <Card>
          <SectionLabel>Daily check-in</SectionLabel>
          <View style={styles.row}>
            {moods.map((mood) => (
              <Chip
                key={mood}
                label={mood}
                selected={today.mood === mood}
                onPress={() => setMood(mood)}
                style={styles.flex}
              />
            ))}
          </View>
        </Card>

        <View style={styles.nextCard}>
          <Text style={styles.nextKicker}>{doneToday.length > 0 ? 'Up next' : 'Your next stop'}</Text>
          <Text style={styles.nextTitle}>{next.name}</Text>
          <Text style={styles.nextMeta}>
            {workoutMinutes(next)} min · {workoutSummary(next)}
          </Text>
          <Button
            label="Start"
            variant="dark"
            onPress={() => router.push({ pathname: '/workout/[id]', params: { id: next.id } })}
            style={styles.nextButton}
          />
          {doneToday.length > 0 && (
            <Text style={styles.nextDone}>
              {doneToday.length} workout{doneToday.length > 1 ? 's' : ''} done today
            </Text>
          )}
        </View>

        <View style={styles.row}>
          <Card style={styles.flex}>
            <SectionLabel>Water</SectionLabel>
            <Text style={styles.stat}>
              {today.water}
              <Text style={styles.statUnit}> / {WATER_GOAL} cups</Text>
            </Text>
            <View style={styles.row}>
              <Button
                label="−"
                variant="outline"
                accessibilityLabel="Remove a cup of water"
                onPress={() => addWater(-1)}
                disabled={today.water === 0}
                style={styles.stepper}
              />
              <Button
                label="+"
                variant="outline"
                accessibilityLabel="Add a cup of water"
                onPress={() => addWater(1)}
                style={styles.flex}
              />
            </View>
          </Card>
          <Card style={styles.flex}>
            <SectionLabel>Sleep</SectionLabel>
            <Text style={styles.stat}>{sleep === undefined ? '—' : formatSleep(sleep)}</Text>
            <View style={styles.row}>
              <Button
                label="−"
                variant="outline"
                accessibilityLabel="Half an hour less sleep"
                onPress={() => setSleep((sleep ?? 7 * 60) - 30)}
                disabled={sleep === 0}
                style={styles.stepper}
              />
              <Button
                label={sleep === undefined ? 'Log' : '+'}
                variant="outline"
                accessibilityLabel={sleep === undefined ? 'Log seven hours of sleep' : 'Half an hour more sleep'}
                onPress={() => setSleep(sleep === undefined ? 7 * 60 : sleep + 30)}
                style={styles.flex}
              />
            </View>
          </Card>
        </View>

        <Pressable
          accessibilityRole="button"
          onPress={() => router.navigate('/gyms')}
          style={({ pressed }) => [styles.gymCard, pressed && styles.pressed]}>
          <View style={styles.flex}>
            <Text style={styles.gymTitle}>Find a gym near you</Text>
            <Text style={styles.gymMeta}>Hours, phone and directions</Text>
          </View>
          <Text style={styles.chevron}>›</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 16 },
  header: { gap: 4, marginTop: 8 },
  kicker: { color: colors.textMuted, fontSize: 14 },
  title: { color: colors.text, fontSize: 32, lineHeight: 36, fontWeight: '800' },
  row: { flexDirection: 'row', gap: 8 },
  flex: { flex: 1 },
  nextCard: { backgroundColor: colors.accent, borderRadius: 18, padding: 18, gap: 6 },
  nextKicker: { color: colors.onAccent, fontSize: 13, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  nextTitle: { color: colors.onAccent, fontSize: 28, lineHeight: 32, fontWeight: '800' },
  nextMeta: { color: colors.onAccent, fontSize: 16, fontWeight: '500' },
  nextButton: { marginTop: 8 },
  nextDone: { color: colors.onAccent, fontSize: 14, fontWeight: '600', textAlign: 'center' },
  stat: { color: colors.text, fontSize: 30, fontWeight: '800' },
  statUnit: { color: colors.textMuted, fontSize: 16, fontWeight: '500' },
  stepper: { width: 52, paddingHorizontal: 0 },
  gymCard: {
    backgroundColor: colors.card,
    borderRadius: 18,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 72,
  },
  gymTitle: { color: colors.text, fontSize: 17, fontWeight: '600' },
  gymMeta: { color: colors.textSecondary, fontSize: 14 },
  chevron: { color: colors.textMuted, fontSize: 28 },
  pressed: { opacity: 0.75 },
});
