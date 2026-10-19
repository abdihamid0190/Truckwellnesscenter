import { DarkTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { colors } from '@/constants/theme';
import { AuthProvider } from '@/state/auth';
import { StoreProvider, useStore } from '@/state/store';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Keep the splash screen up until saved data has loaded.
SplashScreen.preventAutoHideAsync();

// The app is always dark so it stays easy on the eyes in a cab at night.
const theme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.background, primary: colors.accent } };

export default function RootLayout() {
  return (
    <StoreProvider>
      <AuthProvider>
        <ThemeProvider value={theme}>
          <RootNavigator />
        </ThemeProvider>
      </AuthProvider>
    </StoreProvider>
  );
}

function RootNavigator() {
  const { loaded, profile } = useStore();

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  const hasProfile = profile !== null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <Stack.Protected guard={hasProfile} redirectTo="/welcome">
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="workout/[id]" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="gym/[id]" />
        <Stack.Screen name="sign-in" options={{ presentation: 'modal' }} />
        <Stack.Screen name="account" />
        <Stack.Screen name="rules" />
      </Stack.Protected>
      <Stack.Protected guard={!hasProfile} redirectTo="/">
        <Stack.Screen name="welcome" />
      </Stack.Protected>
    </Stack>
  );
}
