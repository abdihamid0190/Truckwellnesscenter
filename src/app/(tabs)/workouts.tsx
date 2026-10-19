import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Chip } from '@/components/ui';
import { colors } from '@/constants/theme';
import { Place, placeLabels, workoutMinutes, workouts, workoutSummary } from '@/data/workouts';

const places: Place[] = ['cab', 'outside', 'gym'];
const timeLimits: { label: string; max: number }[] = [
  { label: 'Any', max: Infinity },
  { label: '10 min', max: 10 },
  { label: '15 min', max: 15 },
  { label: '30 min', max: 30 },
];

export default function WorkoutsScreen() {
  const [place, setPlace] = useState<Place>('cab');
  const [maxMinutes, setMaxMinutes] = useState(Infinity);

  const shown = workouts.filter((workout) => workout.place === place && workoutMinutes(workout) <= maxMinutes);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Workouts</Text>

        <View style={styles.segment}>
          {places.map((option) => (
            <Chip
              key={option}
              label={placeLabels[option]}
              selected={place === option}
              onPress={() => setPlace(option)}
              style={styles.segmentItem}
            />
          ))}
        </View>

        <View style={styles.times}>
          {timeLimits.map((limit) => (
            <Chip
              key={limit.label}
              label={limit.label}
              selected={maxMinutes === limit.max}
              onPress={() => setMaxMinutes(limit.max)}
            />
          ))}
        </View>

        {shown.length === 0 ? (
          <Text style={styles.empty}>Nothing that short here yet. Try a longer time.</Text>
        ) : (
          shown.map((workout) => (
            <Pressable
              key={workout.id}
              accessibilityRole="button"
              onPress={() => router.push({ pathname: '/workout/[id]', params: { id: workout.id } })}
              style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
              <View style={styles.minutes}>
                <Text style={styles.minutesValue}>{workoutMinutes(workout)}</Text>
                <Text style={styles.minutesUnit}>min</Text>
              </View>
              <View style={styles.itemText}>
                <Text style={styles.itemName}>{workout.name}</Text>
                <Text style={styles.itemMeta}>{workoutSummary(workout)}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 14 },
  title: { color: colors.text, fontSize: 32, fontWeight: '800', marginTop: 8 },
  segment: { flexDirection: 'row', gap: 6 },
  segmentItem: { flex: 1, paddingHorizontal: 8 },
  times: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  empty: { color: colors.textSecondary, fontSize: 16, paddingVertical: 24, textAlign: 'center' },
  item: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 76,
  },
  minutes: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  minutesValue: { color: colors.accent, fontSize: 20, fontWeight: '800' },
  minutesUnit: { color: colors.textMuted, fontSize: 11 },
  itemText: { flex: 1, gap: 2 },
  itemName: { color: colors.text, fontSize: 17, fontWeight: '600' },
  itemMeta: { color: colors.textSecondary, fontSize: 14 },
  chevron: { color: colors.textMuted, fontSize: 28 },
  pressed: { opacity: 0.75 },
});
