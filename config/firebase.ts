import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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

// Initialize Auth
const auth = getAuth(app);

// Initialize Firestore
const db = getFirestore(app);

export { auth, db };
export default app;

