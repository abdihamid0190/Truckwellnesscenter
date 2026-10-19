import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, Card, SectionLabel } from '@/components/ui';
import { colors } from '@/constants/theme';
import { getBlockedDrivers, unblockDriver } from '@/data/posts';
import { useAuth } from '@/state/auth';

export default function AccountScreen() {
  const { userId, handle, session, signOut, deleteAccount } = useAuth();
  const [blocked, setBlocked] = useState<{ id: string; handle: string }[]>([]);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/gyms'));

  useEffect(() => {
    if (!userId) return;
    getBlockedDrivers()
      .then(setBlocked)
      .catch(() => {});
  }, [userId]);

  const unblock = async (id: string) => {
    try {
      await unblockDriver(id);
      setBlocked((current) => current.filter((driver) => driver.id !== id));
    } catch {
      setError('Couldn’t unblock. Try again.');
    }
  };

  const remove = async () => {
    try {
      await deleteAccount();
      back();
    } catch {
      setError('Couldn’t delete your account. Check your signal and try again.');
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Pressable accessibilityRole="button" onPress={back} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <Text style={styles.backText}>‹ Back</Text>
      </Pressable>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Account</Text>

        {!userId ? (
          <Card>
            <Text style={styles.body}>You’re not signed in. You only need an account to post.</Text>
            <Button label="Join or sign in" onPress={() => router.replace('/sign-in')} />
            <Button label="Privacy policy" variant="outline" onPress={() => router.push('/privacy')} />
          </Card>
        ) : (
          <>
            <Card>
              <SectionLabel>Driver name</SectionLabel>
              <Text style={styles.value}>{handle ?? 'Not picked yet'}</Text>
              <Text style={styles.meta}>{session?.user.email}</Text>
              {!handle && <Button label="Pick a name" onPress={() => router.replace('/sign-in')} />}
            </Card>

            <Card>
              <SectionLabel>Blocked drivers</SectionLabel>
              {blocked.length === 0 ? (
                <Text style={styles.meta}>Nobody. Block a driver from any of their tips.</Text>
              ) : (
                blocked.map((driver) => (
                  <View key={driver.id} style={styles.row}>
                    <Text style={styles.value}>{driver.handle}</Text>
                    <Button label="Unblock" variant="outline" onPress={() => unblock(driver.id)} style={styles.small} />
                  </View>
                ))
              )}
            </Card>

            <Button label="Community rules" variant="outline" onPress={() => router.push('/rules')} />
            <Button label="Privacy policy" variant="outline" onPress={() => router.push('/privacy')} />
            <Button label="Sign out" variant="outline" onPress={() => signOut().then(back)} />

            {confirmDelete ? (
              <Card>
                <Text style={styles.body}>
                  This deletes your account, your parking votes and your tips for good. Your workouts on this phone stay.
                </Text>
                <Button label="Delete my account" onPress={remove} />
                <Button label="Keep my account" variant="outline" onPress={() => setConfirmDelete(false)} />
              </Card>
            ) : (
              <Pressable accessibilityRole="button" onPress={() => setConfirmDelete(true)} style={styles.deleteLink}>
                <Text style={styles.deleteText}>Delete account</Text>
              </Pressable>
            )}
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  back: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, marginTop: 4 },
  backText: { color: colors.text, fontSize: 17, fontWeight: '600' },
  content: { padding: 20, paddingTop: 8, gap: 14 },
  title: { color: colors.text, fontSize: 32, fontWeight: '800' },
  body: { color: colors.textSecondary, fontSize: 16, lineHeight: 22 },
  value: { flex: 1, color: colors.text, fontSize: 18, fontWeight: '600' },
  meta: { color: colors.textMuted, fontSize: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  small: { minHeight: 44 },
  deleteLink: { minHeight: 48, alignItems: 'center', justifyContent: 'center' },
  deleteText: { color: colors.textMuted, fontSize: 16, textDecorationLine: 'underline' },
  error: { color: colors.accent, fontSize: 16 },
  pressed: { opacity: 0.75 },
});
