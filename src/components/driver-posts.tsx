import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Button, Card, Chip, SectionLabel } from '@/components/ui';
import { colors } from '@/constants/theme';
import {
  addTip,
  blockDriver,
  deleteTip,
  getParkingVotes,
  getTips,
  ParkingVote,
  reportTip,
  summarizeParking,
  timeAgo,
  Tip,
  TIP_MAX_LENGTH,
  tipProblem,
  voteParking,
} from '@/data/posts';
import { useAuth } from '@/state/auth';

const verdictText = {
  yes: 'Drivers say you can park a rig here',
  no: 'Drivers say there’s no rig parking',
  mixed: 'Drivers disagree on rig parking',
  none: 'No parking reports yet',
};

function useSignedInDriver(): string | null {
  const { userId, handle } = useAuth();
  return userId && handle ? userId : null;
}

function goSignIn() {
  router.push('/sign-in');
}

export function ParkingCard({ gymId }: { gymId: string }) {
  const driverId = useSignedInDriver();
  const [votes, setVotes] = useState<ParkingVote[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    getParkingVotes(gymId)
      .then((next) => {
        setVotes(next);
        setError(null);
      })
      .catch(() => setError('Couldn’t load parking reports.'));
  }, [gymId]);

  useEffect(load, [load]);

  const mine = votes?.find((vote) => vote.userId === driverId);
  const summary = summarizeParking(votes ?? []);

  const vote = async (canPark: boolean) => {
    if (!driverId) return goSignIn();
    const previous = votes;
    // Show the vote right away, then confirm with the server.
    setVotes([
      { userId: driverId, canPark, votedAt: new Date().toISOString() },
      ...(votes ?? []).filter((v) => v.userId !== driverId),
    ]);
    try {
      await voteParking(gymId, driverId, canPark);
      load();
    } catch {
      setVotes(previous);
      setError('Your vote didn’t save. Try again.');
    }
  };

  return (
    <Card>
      <SectionLabel>Truck parking</SectionLabel>
      {votes === null && !error ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : (
        <>
          <Text style={styles.verdict}>{verdictText[summary.verdict]}</Text>
          {summary.verdict !== 'none' && (
            <Text style={styles.muted}>
              {summary.yes} yes · {summary.no} no · last report {timeAgo(summary.lastVotedAt!)}
            </Text>
          )}
        </>
      )}
      <Text style={styles.question}>Could you park a truck here?</Text>
      <View style={styles.row}>
        <Chip label="Yes" selected={mine?.canPark === true} onPress={() => vote(true)} style={styles.flex} />
        <Chip label="No" selected={mine?.canPark === false} onPress={() => vote(false)} style={styles.flex} />
      </View>
      {!driverId && <Text style={styles.muted}>Join or sign in to vote. It takes a minute.</Text>}
      {error && <Text style={styles.error}>{error}</Text>}
    </Card>
  );
}

export function TipsCard({ gymId }: { gymId: string }) {
  const driverId = useSignedInDriver();
  const [tips, setTips] = useState<Tip[] | null>(null);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [openTip, setOpenTip] = useState<number | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    getTips(gymId)
      .then(setTips)
      .catch(() => setNotice('Couldn’t load tips.'));
  }, [gymId]);

  // Reload when the driver signs in, so tips from blocked drivers drop out.
  useEffect(load, [load, driverId]);

  const post = async () => {
    if (!driverId) return goSignIn();
    const problem = tipProblem(draft);
    if (problem) return setNotice(problem);
    setBusy(true);
    try {
      await addTip(gymId, driverId, draft);
      setDraft('');
      setNotice(null);
      load();
    } catch {
      setNotice('Your tip didn’t post. Try again.');
    } finally {
      setBusy(false);
    }
  };

  const act = async (action: () => Promise<void>, done: string) => {
    try {
      await action();
      setOpenTip(null);
      setNotice(done);
      load();
    } catch {
      setNotice('That didn’t go through. Try again.');
    }
  };

  return (
    <Card>
      <SectionLabel>Driver tips</SectionLabel>
      {tips === null ? (
        <Text style={styles.muted}>Loading…</Text>
      ) : tips.length === 0 ? (
        <Text style={styles.muted}>No tips yet. Day pass price, showers, where to park?</Text>
      ) : (
        tips.map((tip) => (
          <View key={tip.id} style={styles.tip}>
            <Text style={styles.tipBody}>{tip.body}</Text>
            <View style={styles.tipMeta}>
              <Text style={styles.muted}>
                {tip.handle} · {timeAgo(tip.createdAt)}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`More options for tip from ${tip.handle}`}
                onPress={() => setOpenTip(openTip === tip.id ? null : tip.id)}
                hitSlop={8}
                style={styles.more}>
                <Text style={styles.moreText}>•••</Text>
              </Pressable>
            </View>
            {openTip === tip.id &&
              (tip.userId === driverId ? (
                <View style={styles.row}>
                  <Button
                    label="Delete my tip"
                    variant="outline"
                    onPress={() => act(() => deleteTip(tip.id), 'Tip deleted.')}
                    style={styles.flex}
                  />
                </View>
              ) : !driverId ? (
                <Button label="Join or sign in to report or block" variant="outline" onPress={goSignIn} />
              ) : (
                <View style={styles.row}>
                  <Button
                    label="Report"
                    variant="outline"
                    onPress={() => act(() => reportTip(tip.id, driverId), 'Thanks. We’ll review that tip.')}
                    style={styles.flex}
                  />
                  <Button
                    label="Block driver"
                    variant="outline"
                    onPress={() =>
                      act(() => blockDriver(driverId, tip.userId), `You won’t see tips from ${tip.handle} anymore.`)
                    }
                    style={styles.flex}
                  />
                </View>
              ))}
          </View>
        ))
      )}

      {driverId ? (
        <View style={styles.compose}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Add a tip for other drivers"
            placeholderTextColor={colors.textMuted}
            multiline
            maxLength={TIP_MAX_LENGTH}
            accessibilityLabel="Add a tip"
            style={styles.input}
          />
          <Button label="Post tip" onPress={post} disabled={busy || draft.trim().length < 2} />
        </View>
      ) : (
        <Button label="Join or sign in to add a tip" variant="outline" onPress={goSignIn} />
      )}
      {notice && <Text style={styles.notice}>{notice}</Text>}
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 10 },
  flex: { flex: 1 },
  verdict: { color: colors.text, fontSize: 18, fontWeight: '600' },
  question: { color: colors.textSecondary, fontSize: 16, marginTop: 4 },
  muted: { color: colors.textMuted, fontSize: 14, lineHeight: 20 },
  error: { color: colors.accent, fontSize: 15 },
  notice: { color: colors.textSecondary, fontSize: 15 },
  tip: { gap: 6, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border },
  tipBody: { color: colors.text, fontSize: 16, lineHeight: 22 },
  tipMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  more: { minWidth: 44, minHeight: 32, alignItems: 'flex-end', justifyContent: 'center' },
  moreText: { color: colors.textSecondary, fontSize: 16, letterSpacing: 1 },
  compose: { gap: 10 },
  input: {
    minHeight: 80,
    borderRadius: 14,
    padding: 14,
    backgroundColor: colors.background,
    color: colors.text,
    fontSize: 16,
    textAlignVertical: 'top',
  },
});
