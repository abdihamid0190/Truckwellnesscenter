import * as Linking from 'expo-linking';
import { router, useLocalSearchParams } from 'expo-router';
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, SectionLabel } from '@/components/ui';
import { colors } from '@/constants/theme';
import { getGym, Gym } from '@/data/gyms';

// Hands off to the phone's own map app. Drivers should check the route is
// safe for their truck there; this app has no truck routing.
function directionsUrl(gym: Gym): string {
  const destination = `${gym.lat},${gym.lon}`;
  if (Platform.OS === 'ios') return `https://maps.apple.com/?daddr=${destination}&q=${encodeURIComponent(gym.name)}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}

export default function GymDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const gym = getGym(id);
  const back = () => (router.canGoBack() ? router.back() : router.replace('/gyms'));

  return (
    <SafeAreaView style={styles.safe}>
      <Pressable accessibilityRole="button" onPress={back} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <Text style={styles.backText}>‹ Gyms</Text>
      </Pressable>

      {!gym ? (
        <View style={styles.missing}>
          <Text style={styles.body}>This gym isn’t loaded anymore. Search again from the Gyms tab.</Text>
        </View>
      ) : (
        <>
          <ScrollView contentContainerStyle={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>{gym.name}</Text>
              <Text style={styles.body}>
                {[gym.address, `${gym.distanceMiles.toFixed(1)} mi away`].filter(Boolean).join(' · ')}
              </Text>
            </View>

            <Card>
              <SectionLabel>Hours</SectionLabel>
              <Text style={styles.value}>{gym.open24h ? 'Open 24 hours' : (gym.hours ?? 'Not listed. Call ahead.')}</Text>
            </Card>

            {gym.website && (
              <Card>
                <SectionLabel>Website</SectionLabel>
                <Text
                  style={styles.link}
                  accessibilityRole="link"
                  onPress={() => Linking.openURL(gym.website!)}>
                  {gym.website}
                </Text>
              </Card>
            )}

            <Card>
              <SectionLabel>Truck parking</SectionLabel>
              <Text style={styles.body}>
                Driver reports on rig parking are coming soon. Until then, call ahead or check the lot on the map.
              </Text>
            </Card>
          </ScrollView>

          <View style={styles.actions}>
            <View style={styles.row}>
              <Button label="Directions" onPress={() => Linking.openURL(directionsUrl(gym))} style={styles.flex} />
              {gym.phone && (
                <Button
                  label="Call"
                  variant="outline"
                  onPress={() => Linking.openURL(`tel:${gym.phone!.replace(/[^\d+]/g, '')}`)}
                  style={styles.call}
                />
              )}
            </View>
            <Text style={styles.note}>Opens your map app. Check the route is safe for your truck.</Text>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  back: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, marginTop: 4 },
  backText: { color: colors.text, fontSize: 17, fontWeight: '600' },
  missing: { flex: 1, justifyContent: 'center', padding: 24 },
  content: { padding: 20, paddingTop: 8, gap: 14 },
  header: { gap: 6 },
  title: { color: colors.text, fontSize: 34, lineHeight: 38, fontWeight: '800' },
  body: { color: colors.textSecondary, fontSize: 16, lineHeight: 22 },
  value: { color: colors.text, fontSize: 17 },
  link: { color: colors.accent, fontSize: 16 },
  actions: { padding: 20, paddingTop: 8, gap: 10 },
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  call: { minWidth: 110 },
  note: { color: colors.textMuted, fontSize: 13, textAlign: 'center' },
  pressed: { opacity: 0.75 },
});
