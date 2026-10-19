import type { Session } from '@supabase/supabase-js';
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { supabase, supabaseConfigured } from '@/lib/supabase';

// Driver accounts are only needed for posting. Everything else in the app
// works signed out and keeps its data on the phone.

type Auth = {
  configured: boolean;
  session: Session | null;
  userId: string | null;
  // null until the driver picks a handle after their first sign-in.
  handle: string | null;
  ready: boolean;
  sendCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<void>;
  createProfile: (handle: string) => Promise<void>;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<void>;
};

const AuthContext = createContext<Auth | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [handle, setHandle] = useState<string | null>(null);
  const [ready, setReady] = useState(!supabaseConfigured);
  const userId = session?.user.id ?? null;

  useEffect(() => {
    if (!supabaseConfigured) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (!data.session) setReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    supabase
      .from('profiles')
      .select('handle')
      .eq('id', userId)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setHandle(data?.handle ?? null);
        setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const sendCode = useCallback(async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
    if (error) throw error;
  }, []);

  const verifyCode = useCallback(async (email: string, code: string) => {
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'email' });
    if (error) throw error;
  }, []);

  const createProfile = useCallback(
    async (nextHandle: string) => {
      if (!userId) throw new Error('Not signed in');
      const { error } = await supabase.from('profiles').insert({ id: userId, handle: nextHandle });
      if (error) throw error;
      setHandle(nextHandle);
    },
    [userId],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setHandle(null);
  }, []);

  const deleteAccount = useCallback(async () => {
    const { error } = await supabase.rpc('delete_my_account');
    if (error) throw error;
    await supabase.auth.signOut({ scope: 'local' });
    setHandle(null);
  }, []);

  const auth = useMemo<Auth>(
    () => ({
      configured: supabaseConfigured,
      session,
      userId,
      handle: userId ? handle : null,
      ready,
      sendCode,
      verifyCode,
      createProfile,
      signOut,
      deleteAccount,
    }),
    [session, userId, handle, ready, sendCode, verifyCode, createProfile, signOut, deleteAccount],
  );

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export function useAuth(): Auth {
  const auth = useContext(AuthContext);
  if (!auth) throw new Error('useAuth must be used inside AuthProvider');
  return auth;
}
