import { auth } from '@/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { onAuthStateChanged } from 'firebase/auth';

const AUTH_STATE_KEY = '@auth:user_state';

/**
 * Store auth state in AsyncStorage for persistence
 */
export const storeAuthState = async (userId: string | null) => {
  try {
    if (userId) {
      await AsyncStorage.setItem(AUTH_STATE_KEY, userId);
    } else {
      await AsyncStorage.removeItem(AUTH_STATE_KEY);
    }
  } catch (error) {
    console.error('Error storing auth state:', error);
  }
};

/**
 * Get stored auth state from AsyncStorage
 */
export const getStoredAuthState = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(AUTH_STATE_KEY);
  } catch (error) {
    console.error('Error getting stored auth state:', error);
    return null;
  }
};

/**
 * Clear stored auth state
 */
export const clearAuthState = async () => {
  try {
    await AsyncStorage.removeItem(AUTH_STATE_KEY);
  } catch (error) {
    console.error('Error clearing auth state:', error);
  }
};

/**
 * Initialize auth state persistence
 * This listens to auth state changes and stores them
 */
export const initializeAuthPersistence = () => {
  // Listen to auth state changes and store them
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    if (user) {
      storeAuthState(user.uid);
    } else {
      clearAuthState();
    }
  });

  return unsubscribe;
};

