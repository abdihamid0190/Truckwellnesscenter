import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/ui';
import { colors } from '@/constants/theme';
import { useAuth } from '@/state/auth';

const HANDLE_PATTERN = /^[A-Za-z0-9_]{3,20}$/;

function close() {
  if (router.canGoBack()) router.back();
  else router.replace('/gyms');
}

export default function SignInScreen() {
  const { userId, handle, sendCode, verifyCode, createProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [codeSentTo, setCodeSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [newHandle, setNewHandle] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const step = userId ? (handle ? 'done' : 'handle') : codeSentTo ? 'code' : 'email';

  const run = async (action: () => Promise<void>, failure: string) => {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (caught) {
      const message = caught instanceof Error ? caught.message : '';
      setError(message.includes('duplicate') ? 'That name is taken. Try another.' : failure);
    } finally {
      setBusy(false);
    }
  };

  const submitEmail = () => {
    const address = email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(address)) {
      setError('Enter your email address.');
      return;
    }
    run(async () => {
      await sendCode(address);
      setCodeSentTo(address);
    }, 'Couldn’t send the code. Check your signal and try again.');
  };

  const submitCode = () =>
    run(() => verifyCode(codeSentTo!, code.trim()), 'That code didn’t work. Check it or send a new one.');

  const submitHandle = () => {
    if (!HANDLE_PATTERN.test(newHandle)) {
      setError('Use 3 to 20 letters, numbers or _.');
      return;
    }
    run(async () => {
      await createProfile(newHandle);
      close();
    }, 'Couldn’t save your name. Try again.');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <Pressable accessibilityRole="button" onPress={close} style={({ pressed }) => [styles.back, pressed && styles.pressed]}>
        <Text style={styles.backText}>Cancel</Text>
      </Pressable>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.flex}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {step === 'email' && (
            <>
              <Text style={styles.title}>Join or sign in</Text>
              <Text style={styles.body}>
                New or returning, it’s the same: we’ll email you a code, no password. The first time, this makes your account. You only need one to vote on parking and leave tips.
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                onSubmitEditing={submitEmail}
                placeholder="Email"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                returnKeyType="send"
                accessibilityLabel="Email"
                style={styles.input}
              />
              <Button label="Email me a code" onPress={submitEmail} disabled={busy} />
            </>
          )}

          {step === 'code' && (
            <>
              <Text style={styles.title}>Check your email</Text>
              <Text style={styles.body}>We sent a code to {codeSentTo}. Type it here.</Text>
              <TextInput
                value={code}
                onChangeText={(text) => setCode(text.replace(/\D/g, ''))}
                onSubmitEditing={submitCode}
                placeholder="Code"
                placeholderTextColor={colors.textMuted}
                autoComplete="one-time-code"
                keyboardType="number-pad"
                maxLength={8}
                accessibilityLabel="Code"
                style={[styles.input, styles.codeInput]}
              />
              <Button label="Continue" onPress={submitCode} disabled={busy || code.length < 6} />
              <Button
                label="Use a different email"
                variant="outline"
                onPress={() => {
                  setCodeSentTo(null);
                  setCode('');
                  setError(null);
                }}
              />
            </>
          )}

          {step === 'handle' && (
            <>
              <Text style={styles.title}>Pick a driver name</Text>
              <Text style={styles.body}>Other drivers see this name on your tips. Don’t use your real name or your company.</Text>
              <TextInput
                value={newHandle}
                onChangeText={(text) => setNewHandle(text.replace(/\s/g, ''))}
                placeholder="e.g. NightOwl_KW"
                placeholderTextColor={colors.textMuted}
                autoCapitalize="none"
                autoCorrect={false}
                maxLength={20}
                accessibilityLabel="Driver name"
                style={styles.input}
              />
              <Pressable
                accessibilityRole="checkbox"
                accessibilityState={{ checked: agreed }}
                onPress={() => setAgreed((value) => !value)}
                style={styles.agreeRow}>
                <View style={[styles.box, agreed && styles.boxChecked]}>{agreed && <Text style={styles.tick}>✓</Text>}</View>
                <Text style={styles.agreeText}>
                  I agree to the{' '}
                  <Link href="/rules" style={styles.link}>
                    community rules
                  </Link>
                  . No abuse, no hate, no spam.
                </Text>
              </Pressable>
              <Button label="Start posting" onPress={submitHandle} disabled={busy || !agreed || newHandle.length < 3} />
            </>
          )}

          {step === 'done' && (
            <>
              <Text style={styles.title}>You’re signed in</Text>
              <Button label="Done" onPress={close} />
            </>
          )}

          {error && <Text style={styles.error}>{error}</Text>}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  back: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', paddingHorizontal: 16, marginTop: 4 },
  backText: { color: colors.text, fontSize: 17, fontWeight: '600' },
  content: { padding: 24, paddingTop: 8, gap: 16 },
  title: { color: colors.text, fontSize: 32, lineHeight: 38, fontWeight: '800' },
  body: { color: colors.textSecondary, fontSize: 17, lineHeight: 24 },
  input: {
    minHeight: 56,
    borderRadius: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.card,
    color: colors.text,
    fontSize: 18,
  },
  codeInput: { fontSize: 26, letterSpacing: 6, textAlign: 'center' },
  agreeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 },
  box: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  tick: { color: colors.onAccent, fontSize: 18, fontWeight: '800' },
  agreeText: { flex: 1, color: colors.textSecondary, fontSize: 16, lineHeight: 22 },
  link: { color: colors.accent, textDecorationLine: 'underline' },
  error: { color: colors.accent, fontSize: 16, lineHeight: 22 },
  pressed: { opacity: 0.75 },
});
