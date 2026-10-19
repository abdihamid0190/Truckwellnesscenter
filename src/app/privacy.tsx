import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/constants/theme';

// The App Store and Google Play both ask for a privacy policy link. On the
// web build this screen is also that public page, at /privacy.
const SUPPORT_EMAIL = 'support@example.com';
const UPDATED = 'October 19, 2026';

const sections: [string, string][] = [
  [
    'What stays on your phone',
    'Your answers from the welcome screen, daily check-ins, water, sleep, workouts and reminder settings are saved only on your phone. We never see them. Deleting the app deletes them.',
  ],
  [
    'Your location',
    'When you tap Near me, your phone’s location is used once to look up gyms nearby. If you type a city or ZIP instead, your phone’s built-in map service turns it into a location. The search is sent to OpenStreetMap’s public gym data. We don’t store your location or keep a history of where you’ve been. Location is only used while the app is open.',
  ],
  [
    'Driver accounts',
    'You only need an account to vote on truck parking and post tips. For that we store your email address, the driver name you pick, your votes, your tips, and any reports or blocks you make. Other drivers see your driver name, your tips and the total votes. They never see your email.',
  ],
  [
    'Who handles the data',
    'Accounts, votes and tips are stored with Supabase, our database provider. Gym listings come from OpenStreetMap. We don’t sell your data, show ads or share your information with anyone else.',
  ],
  [
    'Deleting your data',
    'Go to Gyms, then Account, then Delete account. This removes your account, votes, tips, reports and blocks right away.',
  ],
  ['Health', 'The workouts are general stretches and exercises, not medical advice. Check with a doctor if you have pain or an injury.'],
];

export default function PrivacyScreen() {
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <SafeAreaView style={styles.safe}>
      <Pressable accessibilityRole="button" onPress={back} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Privacy policy</Text>
        <Text style={styles.meta}>Trucker Wellness · Updated {UPDATED}</Text>
        {sections.map(([heading, body]) => (
          <View key={heading} style={styles.section}>
            <Text style={styles.heading}>{heading}</Text>
            <Text style={styles.body}>{body}</Text>
          </View>
        ))}
        <View style={styles.section}>
          <Text style={styles.heading}>Questions</Text>
          <Text style={styles.body}>Email {SUPPORT_EMAIL}.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  back: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, marginTop: 4 },
  backText: { color: colors.text, fontSize: 17, fontWeight: '600' },
  content: { padding: 24, paddingTop: 8, gap: 18, maxWidth: 720, width: '100%', alignSelf: 'center' },
  title: { color: colors.text, fontSize: 32, fontWeight: '800' },
  meta: { color: colors.textMuted, fontSize: 14 },
  section: { gap: 6 },
  heading: { color: colors.text, fontSize: 18, fontWeight: '700' },
  body: { color: colors.textSecondary, fontSize: 16, lineHeight: 23 },
  pressed: { opacity: 0.75 },
});
