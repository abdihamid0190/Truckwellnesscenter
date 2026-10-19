import 'expo-sqlite/localStorage/install';
import { createClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

// Driver posts live in Supabase. The URL and publishable key are safe to ship
// in the app; the database rules in supabase/migrations decide who can do what.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = Boolean(supabaseUrl && supabaseKey);

// Until the keys are set, a placeholder client keeps the rest of the app
// working; screens check supabaseConfigured before calling it.
export const supabase = createClient(supabaseUrl || 'https://not-configured.supabase.co', supabaseKey || 'missing', {
  auth: {
    storage: localStorage,
    autoRefreshToken: supabaseConfigured,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

if (supabaseConfigured) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}
