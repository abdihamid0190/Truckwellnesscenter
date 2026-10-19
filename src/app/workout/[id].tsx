import { useKeepAwake } from 'expo-keep-awake';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useReducer, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { colors } from '@/constants/theme';
import { findWorkout, Move } from '@/data/workouts';
import { useStore } from '@/state/store';

type PlayerState = { step: number; remaining: number; finished: boolean };
type PlayerAction = { type: 'tick' } | { type: 'goTo'; index: number };

function playerReducer(moves: Move[], state: PlayerState, action: PlayerAction): PlayerState {
  const index = action.type === 'goTo' ? action.index : state.step + 1;
  if (action.type === 'tick' && state.remaining > 1) return { ...state, remaining: state.remaining - 1 };
  // The clock ran out or the driver skipped: move on, or finish after the last move.
  if (index >= moves.length) return { ...state, remaining: 0, finished: true };
  const step = Math.max(0, index);
  return { step, remaining: moves[step].seconds, finished: false };
}

function formatClock(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

export default function WorkoutPlayerScreen() {
  useKeepAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = findWorkout(id);
  const { logWorkout } = useStore();

  const moves = workout?.moves ?? [];
  const moveCount = moves.length;
  const [{ step, remaining, finished }, dispatch] = useReducer(
    (state: PlayerState, action: PlayerAction) => playerReducer(moves, state, action),
    { step: 0, remaining: moves[0]?.seconds ?? 0, finished: false },
  );
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || finished || !workout) return;
    const timer = setInterval(() => dispatch({ type: 'tick' }), 1000);
    return () => clearInterval(timer);
  }, [paused, finished, workout]);

  const goTo = (index: number) => dispatch({ type: 'goTo', index });

  const close = () => (router.canGoBack() ? router.back() : router.replace('/'));

  if (!workout) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={styles.moveName}>Workout not found</Text>
        <Button label="Back" variant="outline" onPress={close} />
      </SafeAreaView>
    );
  }

  if (finished) {
    return (
      <SafeAreaView style={[styles.safe, styles.center]}>
        <Text style={styles.kicker}>Nice work</Text>
        <Text style={styles.moveName}>{workout.name} done</Text>
        <Text style={styles.how}>Log it so it counts toward your week.</Text>
        <View style={styles.finishButtons}>
          <Button
            label="Log it"
            onPress={() => {
              logWorkout(workout.id);
              close();
            }}
          />
          <Button label="Skip logging" variant="outline" onPress={close} />
        </View>
      </SafeAreaView>
    );
  }

  const move = workout.moves[step];

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.top}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close workout"
          onPress={close}
          style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
        <Text style={styles.workoutName} numberOfLines={1}>
          {workout.name}
        </Text>
        <View style={styles.close} />
      </View>

      <View
        style={styles.progress}
        accessibilityLabel={`Move ${step + 1} of ${moveCount}`}
        accessible>
        {workout.moves.map((_, index) => (
          <View key={index} style={[styles.progressBar, index <= step && styles.progressBarDone]} />
        ))}
      </View>

      <View style={styles.middle}>
        <View style={styles.clock}>
          <Text style={styles.clockText} accessibilityLabel={`${remaining} seconds left`}>
            {formatClock(remaining)}
          </Text>
          <Text style={styles.clockLabel}>{paused ? 'paused' : 'left'}</Text>
        </View>
        <Text style={styles.kicker}>
          Move {step + 1} of {moveCount}
        </Text>
        <Text style={styles.moveName}>{move.name}</Text>
        <Text style={styles.how}>{move.how}</Text>
      </View>

      <View style={styles.controls}>
        <Button
          label="‹"
          variant="outline"
          accessibilityLabel="Previous move"
          onPress={() => goTo(step - 1)}
          disabled={step === 0}
          style={styles.roundButton}
        />
        <Button
          label={paused ? 'Resume' : 'Pause'}
          onPress={() => setPaused((value) => !value)}
          style={styles.pauseButton}
        />
        <Button
          label="›"
          variant="outline"
          accessibilityLabel="Next move"
          onPress={() => goTo(step + 1)}
          style={styles.roundButton}
        />
      </View>

      <Text style={styles.safety}>Only when parked with the brake set. Never while driving.</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 20, paddingBottom: 12, gap: 20 },
  center: { alignItems: 'center', justifyContent: 'center', gap: 16 },
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  close: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  closeText: { color: colors.text, fontSize: 22 },
  workoutName: { flex: 1, color: colors.textSecondary, fontSize: 15, fontWeight: '600', textAlign: 'center' },
  progress: { flexDirection: 'row', gap: 6 },
  progressBar: { flex: 1, height: 6, borderRadius: 3, backgroundColor: colors.border },
  progressBarDone: { backgroundColor: colors.accent },
  middle: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14 },
  clock: {
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 10,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockText: { color: colors.text, fontSize: 64, fontWeight: '800', fontVariant: ['tabular-nums'] },
  clockLabel: { color: colors.textMuted, fontSize: 15 },
  kicker: { color: colors.accent, fontSize: 14, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' },
  moveName: { color: colors.text, fontSize: 32, lineHeight: 36, fontWeight: '800', textAlign: 'center' },
  how: { color: colors.textSecondary, fontSize: 18, lineHeight: 25, textAlign: 'center', maxWidth: 320 },
  controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  roundButton: { width: 64, height: 64, borderRadius: 32, paddingHorizontal: 0 },
  pauseButton: { minWidth: 132, height: 72, borderRadius: 36 },
  finishButtons: { alignSelf: 'stretch', gap: 10, marginTop: 12 },
  safety: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
  pressed: { opacity: 0.75 },
});
