import { auth } from '@/config/firebase';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { initializeAuthPersistence } from '@/utils/auth-persistence';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import 'react-native-reanimated';
import '../global.css';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Initialize auth persistence (stores auth state in AsyncStorage)
    const persistenceUnsubscribe = initializeAuthPersistence();

    // Listen to auth state changes
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
    });

    return () => {
      unsubscribe();
      persistenceUnsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated === null) {
      // Still checking auth state
      return;
    }

    const inAuthGroup = segments[0] === '(tabs)' || 
                       segments[0] === 'log-workout' || 
                       segments[0] === 'add-exercise' ||
                       segments[0] === 'add-exercise-to-routine' ||
                       segments[0] === 'exercise-detail' ||
                       segments[0] === 'reorder-exercises' ||
                       segments[0] === 'save-workout' ||
                       segments[0] === 'workout-detail' ||
                       segments[0] === 'new-routine' ||
                       segments[0] === 'edit-routine' ||
                       segments[0] === 'user-profile';

    if (!isAuthenticated && inAuthGroup) {
      // User is not authenticated but trying to access protected route
      router.replace('/login');
    } else if (isAuthenticated && (segments[0] === 'login' || segments[0] === 'signup')) {
      // User is authenticated but on login/signup page
      router.replace('/(tabs)');
    }
  }, [isAuthenticated, segments]);

  // Show loading screen while checking auth state
  if (isAuthenticated === null) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" />
        </View>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView>
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="log-workout" options={{ headerShown: false }} />
        <Stack.Screen name="add-exercise" options={{ headerShown: false }} />
        <Stack.Screen name="add-exercise-to-routine" options={{ headerShown: false }} />
        <Stack.Screen name="exercise-detail" options={{ headerShown: false }} />
        <Stack.Screen name="reorder-exercises" options={{ headerShown: false }} />
        <Stack.Screen name="save-workout" options={{ headerShown: false }} />
        <Stack.Screen name="workout-detail" options={{ headerShown: false }} />
        <Stack.Screen name="new-routine" options={{ headerShown: false }} />
        <Stack.Screen name="edit-routine" options={{ headerShown: false }} />
        <Stack.Screen name="user-profile" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
    </GestureHandlerRootView>
  );
}
