import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

// Apple asks apps with user posts to show rules that drivers agree to, with
// zero tolerance for abuse. Keep this list short enough to actually read.
const rules = [
  ['Be useful.', 'Post about parking, hours, showers, day passes and the gym itself.'],
  ['No abuse or hate.', 'No insults, threats, slurs or harassment of anyone.'],
  ['No spam or ads.', 'No links, phone numbers or selling.'],
  ['Keep people private.', 'Don’t name or describe other drivers, staff or companies.'],
  ['Never post while driving.', 'Only use the app when you are parked.'],
];

export default function RulesScreen() {
  const back = () => (router.canGoBack() ? router.back() : router.replace('/gyms'));

  return (
    <SafeAreaView style={styles.safe}>
      <Pressable accessibilityRole="button" onPress={back} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Community rules</Text>
        {rules.map(([rule, detail]) => (
          <View key={rule} style={styles.rule}>
            <Text style={styles.ruleTitle}>{rule}</Text>
            <Text style={styles.body}>{detail}</Text>
          </View>
        ))}
        <Text style={styles.body}>
          Any driver can report a tip. Tips that several drivers report are hidden right away and reviewed. Accounts
          that break these rules are removed. You can block any driver so you no longer see their tips.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  back: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, marginTop: 4 },
  backText: { color: colors.text, fontSize: 17, fontWeight: '600' },
  content: { padding: 24, paddingTop: 8, gap: 18 },
  title: { color: colors.text, fontSize: 32, fontWeight: '800' },
  rule: { gap: 4 },
  ruleTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  body: { color: colors.textSecondary, fontSize: 16, lineHeight: 22 },
  pressed: { opacity: 0.75 },
});
