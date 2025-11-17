import { auth, db } from '@/config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, setDoc, where } from 'firebase/firestore';

const PENDING_EXERCISES_KEY = '@workout:pending_exercises';
const CURRENT_WORKOUT_KEY = '@workout:current_workout';
const WORKOUT_DURATION_KEY = '@workout:duration';

// Temporary storage for passing exercises between screens
let pendingExercises: any[] = [];
let replaceExerciseId: string | null = null;

export const setPendingExercises = (exercises: any[]) => {
  pendingExercises = exercises;
};

export const getPendingExercises = () => {
  const exercises = [...pendingExercises];
  pendingExercises = [];
  return exercises;
};

export const setReplaceExerciseId = (exerciseId: string | null) => {
  replaceExerciseId = exerciseId;
};

export const getReplaceExerciseId = () => {
  const id = replaceExerciseId;
  replaceExerciseId = null;
  return id;
};

// Save current workout to local storage (for offline support)
export const saveWorkoutData = async (exercises: any[], duration: number) => {
  try {
    const user = auth.currentUser;
    if (!user) return;

    // Save to local storage for offline access
    await AsyncStorage.setItem(CURRENT_WORKOUT_KEY, JSON.stringify(exercises));
    await AsyncStorage.setItem(WORKOUT_DURATION_KEY, duration.toString());

    // Also save to Firestore
    const workoutRef = doc(db, 'workouts', `current_${user.uid}`);
    await setDoc(workoutRef, {
      exercises,
      duration,
      userId: user.uid,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (error) {
    console.error('Error saving workout data:', error);
  }
};

// Load current workout from local storage or Firestore
export const loadWorkoutData = async (): Promise<{ exercises: any[], duration: number }> => {
  try {
    // Try local storage first (faster)
    const [exercisesData, durationData] = await Promise.all([
      AsyncStorage.getItem(CURRENT_WORKOUT_KEY),
      AsyncStorage.getItem(WORKOUT_DURATION_KEY),
    ]);
    
    if (exercisesData && durationData) {
      return {
        exercises: JSON.parse(exercisesData),
        duration: parseInt(durationData, 10),
      };
    }

    // Fallback to Firestore
    const user = auth.currentUser;
    if (user) {
      const workoutRef = doc(db, 'workouts', `current_${user.uid}`);
      const workoutDoc = await getDoc(workoutRef);
      
      if (workoutDoc.exists()) {
        const data = workoutDoc.data();
        return {
          exercises: data.exercises || [],
          duration: data.duration || 0,
        };
      }
    }
    
    return { exercises: [], duration: 0 };
  } catch (error) {
    console.error('Error loading workout data:', error);
    return { exercises: [], duration: 0 };
  }
};

// Clear workout data
export const clearWorkoutData = async () => {
  try {
    const user = auth.currentUser;
    
    // Clear local storage
    await AsyncStorage.multiRemove([CURRENT_WORKOUT_KEY, WORKOUT_DURATION_KEY]);
    
    // Clear Firestore
    if (user) {
      const workoutRef = doc(db, 'workouts', `current_${user.uid}`);
      await setDoc(workoutRef, {
        exercises: [],
        duration: 0,
        userId: user.uid,
        updatedAt: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('Error clearing workout data:', error);
  }
};

// Check if there's a workout in progress
export const hasWorkoutInProgress = async (): Promise<boolean> => {
  try {
    const exercisesData = await AsyncStorage.getItem(CURRENT_WORKOUT_KEY);
    return exercisesData !== null && exercisesData !== '[]';
  } catch (error) {
    console.error('Error checking workout status:', error);
    return false;
  }
};

// Save completed workout to Firestore
export const saveCompletedWorkout = async (workoutData: any) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const workoutRef = await addDoc(collection(db, 'workouts'), {
      ...workoutData,
      userId: user.uid,
      createdAt: new Date().toISOString(),
    });

    return workoutRef.id;
  } catch (error) {
    console.error('Error saving completed workout:', error);
    throw error;
  }
};

// Get user's completed workouts from Firestore
export const getCompletedWorkouts = async (limitCount: number = 50) => {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const workoutsRef = collection(db, 'workouts');
    const q = query(
      workoutsRef,
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(limitCount as number)
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
  } catch (error) {
    console.error('Error getting completed workouts:', error);
    return [];
  }
};

// Get a specific workout by ID
export const getWorkoutById = async (workoutId: string) => {
  try {
    const user = auth.currentUser;
    if (!user) return null;

    const workoutRef = doc(db, 'workouts', workoutId);
    const workoutDoc = await getDoc(workoutRef);
    
    if (workoutDoc.exists()) {
      const data = workoutDoc.data();
      // Check if workout belongs to user
      if (data.userId === user.uid) {
        return {
          id: workoutDoc.id,
          ...data,
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error getting workout by ID:', error);
    return null;
  }
};
