import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip, SectionLabel } from '@/components/ui';
import { colors } from '@/constants/theme';
import type { Gear } from '@/data/workouts';
import { RunType, useStore } from '@/state/store';

const runTypes: RunType[] = ['Over the road', 'Regional', 'Local'];
const goalOptions = ['Lose weight', 'Sleep better', 'Less back pain', 'More energy'];
const gearOptions: { value: Gear; label: string }[] = [
  { value: 'none', label: 'Nothing' },
  { value: 'bands', label: 'Bands' },
  { value: 'dumbbells', label: 'Dumbbells' },
];

export default function WelcomeScreen() {
  const { saveProfile } = useStore();
  const [run, setRun] = useState<RunType>('Over the road');
  const [goals, setGoals] = useState<string[]>([]);
  const [gear, setGear] = useState<Gear>('none');

  const toggleGoal = (goal: string) =>
    setGoals((current) => (current.includes(goal) ? current.filter((g) => g !== goal) : [...current, goal]));

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.intro}>
          <Text style={styles.title}>Stay healthy on the road.</Text>
          <Text style={styles.subtitle}>Three quick questions so your plan fits your cab and your schedule.</Text>
        </View>

        <View style={styles.section}>
          <SectionLabel>How do you run?</SectionLabel>
          <View style={styles.chips}>
            {runTypes.map((option) => (
              <Chip key={option} label={option} selected={run === option} onPress={() => setRun(option)} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionLabel>What matters most? Pick any.</SectionLabel>
          <View style={styles.chips}>
            {goalOptions.map((goal) => (
              <Chip key={goal} label={goal} selected={goals.includes(goal)} onPress={() => toggleGoal(goal)} />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <SectionLabel>Gear in your cab</SectionLabel>
          <View style={styles.chips}>
            {gearOptions.map((option) => (
              <Chip
                key={option.value}
                label={option.label}
                selected={gear === option.value}
                onPress={() => setGear(option.value)}
              />
            ))}
          </View>
        </View>

        <View style={styles.footer}>
          <Button label="Build my plan" onPress={() => saveProfile({ run, goals, gear })} />
          <Text style={styles.note}>No account needed. Workouts are for when you are parked.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, gap: 28, flexGrow: 1 },
  intro: { gap: 10, marginTop: 16 },
  title: { color: colors.text, fontSize: 40, lineHeight: 44, fontWeight: '800' },
  subtitle: { color: colors.textSecondary, fontSize: 17, lineHeight: 24 },
  section: { gap: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  footer: { marginTop: 'auto', gap: 12 },
  note: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
});
