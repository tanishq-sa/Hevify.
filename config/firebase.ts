import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { Platform } from 'react-native';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB9zKlNbrCiIFdeVgWREnk8xAhZgysa2E8",
  authDomain: "hevyclone-20505.firebaseapp.com",
  projectId: "hevyclone-20505",
  storageBucket: "hevyclone-20505.firebasestorage.app",
  messagingSenderId: "1030246785094",
  appId: "1:1030246785094:web:7ad5c0810e8a7557ed2a47"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Auth with AsyncStorage persistence for React Native
let auth: any;
if (Platform.OS !== 'web') {
  try {
    // For React Native, use initializeAuth with AsyncStorage
    const { getReactNativePersistence } = require('firebase/auth');
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } catch (error: any) {
    // If auth is already initialized, get the existing instance
    if (error.code === 'auth/already-initialized') {
      auth = getAuth(app);
    } else {
      // Fallback to getAuth if initializeAuth fails
      auth = getAuth(app);
    }
  }
} else {
  // For web, use getAuth (it handles persistence automatically)
  auth = getAuth(app);
}

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
export default app;
