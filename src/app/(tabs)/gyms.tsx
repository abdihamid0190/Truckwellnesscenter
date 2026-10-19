import * as Location from 'expo-location';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Chip } from '@/components/ui';
import { colors } from '@/constants/theme';
import { findGymsNear, Gym, SEARCH_RADIUS_MILES } from '@/data/gyms';
import { useAuth } from '@/state/auth';

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'done'; gyms: Gym[]; place: string };

export default function GymsScreen() {
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<Status>({ kind: 'idle' });
  const [only24h, setOnly24h] = useState(false);
  const { configured, userId, handle } = useAuth();

  const search = async (place: string, getCoords: () => Promise<{ latitude: number; longitude: number } | null>) => {
    setStatus({ kind: 'loading' });
    try {
      const coords = await getCoords();
      if (!coords) return;
      const gyms = await findGymsNear(coords.latitude, coords.longitude);
      setStatus({ kind: 'done', gyms, place });
    } catch {
      setStatus({ kind: 'error', message: 'Couldn’t load gyms. Check your signal and try again.' });
    }
  };

  const searchNearMe = () =>
    search('you', async () => {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setStatus({ kind: 'error', message: 'Location is off for this app. Search by city or ZIP instead.' });
        return null;
      }
      const position =
        (await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 })) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      return position.coords;
    });

  const searchPlace = () => {
    const place = query.trim();
    if (!place) return;
    search(place, async () => {
      if (Platform.OS === 'web') {
        setStatus({ kind: 'error', message: 'City and ZIP search works in the phone app. Use Near me here.' });
        return null;
      }
      const [match] = await Location.geocodeAsync(place);
      if (!match) {
        setStatus({ kind: 'error', message: `Couldn’t find “${place}”. Try a city and state, or a ZIP.` });
        return null;
      }
      return match;
    });
  };

  const shown = status.kind === 'done' ? status.gyms.filter((gym) => !only24h || gym.open24h) : [];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.titleRow}>
          <Text style={styles.title}>Gyms</Text>
          {configured && (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(userId ? '/account' : '/sign-in')}
              style={({ pressed }) => [styles.account, pressed && styles.pressed]}>
              <Text style={styles.accountText} numberOfLines={1}>
                {userId ? (handle ?? 'Account') : 'Join or sign in'}
              </Text>
            </Pressable>
          )}
        </View>

        <View style={styles.searchRow}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={searchPlace}
            placeholder="City or ZIP"
            placeholderTextColor={colors.textMuted}
            returnKeyType="search"
            accessibilityLabel="City or ZIP"
            style={styles.input}
          />
          <Button label="Near me" onPress={searchNearMe} style={styles.nearMe} />
        </View>

        <View style={styles.filters}>
          <Chip label="Open 24 hours" selected={only24h} onPress={() => setOnly24h((value) => !value)} />
        </View>

        {status.kind === 'idle' && (
          <Text style={styles.message}>
            Tap Near me or type a city to find gyms within {SEARCH_RADIUS_MILES} miles.
          </Text>
        )}
        {status.kind === 'loading' && <ActivityIndicator color={colors.accent} style={styles.spinner} />}
        {status.kind === 'error' && <Text style={styles.message}>{status.message}</Text>}
        {status.kind === 'done' && (
          <>
            <Text style={styles.count}>
              {shown.length === 0
                ? `No gyms found within ${SEARCH_RADIUS_MILES} miles of ${status.place}.`
                : `${shown.length} gym${shown.length > 1 ? 's' : ''} within ${SEARCH_RADIUS_MILES} miles of ${status.place}`}
            </Text>
            {shown.map((gym) => (
              <Pressable
                key={gym.id}
                accessibilityRole="button"
                onPress={() => router.push({ pathname: '/gym/[id]', params: { id: gym.id } })}
                style={({ pressed }) => [styles.item, pressed && styles.pressed]}>
                <View style={styles.itemTop}>
                  <Text style={styles.itemName}>{gym.name}</Text>
                  <Text style={styles.itemDistance}>{gym.distanceMiles.toFixed(1)} mi</Text>
                </View>
                {gym.address && <Text style={styles.itemMeta}>{gym.address}</Text>}
                <Text style={styles.itemMeta}>{gym.open24h ? 'Open 24 hours' : (gym.hours ?? 'Hours not listed')}</Text>
              </Pressable>
            ))}
          </>
        )}

        <Text style={styles.credit}>Gym listings © OpenStreetMap contributors</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, gap: 14, flexGrow: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 8 },
  title: { color: colors.text, fontSize: 32, fontWeight: '800' },
  account: { minHeight: 44, maxWidth: 180, justifyContent: 'center', paddingHorizontal: 4 },
  accountText: { color: colors.accent, fontSize: 17, fontWeight: '600' },
  searchRow: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    minWidth: 0,
    minHeight: 52,
    borderRadius: 14,
    paddingHorizontal: 14,
    backgroundColor: colors.card,
    color: colors.text,
    fontSize: 17,
  },
  nearMe: { paddingHorizontal: 16 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  message: { color: colors.textSecondary, fontSize: 16, lineHeight: 22, paddingVertical: 16, textAlign: 'center' },
  spinner: { paddingVertical: 32 },
  count: { color: colors.textMuted, fontSize: 14 },
  item: { backgroundColor: colors.card, borderRadius: 16, padding: 16, gap: 4 },
  itemTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  itemName: { flex: 1, color: colors.text, fontSize: 18, fontWeight: '600' },
  itemDistance: { color: colors.textSecondary, fontSize: 15 },
  itemMeta: { color: colors.textSecondary, fontSize: 14 },
  credit: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: 'auto', paddingTop: 16 },
  pressed: { opacity: 0.75 },
});
