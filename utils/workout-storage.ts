import { auth, db } from '@/config/firebase';
import { deleteCurrentWorkoutDocument, getUserDocument } from '@/utils/firestore-init';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';

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

// Save current workout to local storage only (for offline support)
// This is only for the active workout - NOT saved to cloud until user clicks "Save" after "Finish"
// Completed workouts are only saved to cloud when user clicks "Save" after "Finish"
export const saveWorkoutData = async (exercises: any[], duration: number) => {
  try {
    // Only save to local storage (AsyncStorage) during active workout
    // Cloud sync happens only when workout is completed and saved
    await AsyncStorage.setItem(CURRENT_WORKOUT_KEY, JSON.stringify(exercises));
    await AsyncStorage.setItem(WORKOUT_DURATION_KEY, duration.toString());
  } catch (error) {
    console.error('Error saving workout data:', error);
  }
};

// Load current workout from local storage only
// Active workouts are stored locally, not in cloud
export const loadWorkoutData = async (): Promise<{ exercises: any[], duration: number }> => {
  try {
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
    
    return { exercises: [], duration: 0 };
  } catch (error) {
    console.error('Error loading workout data:', error);
    return { exercises: [], duration: 0 };
  }
};

// Clear in-memory workout data (pending exercises and replace exercise ID)
// This clears temporary variables used for passing data between screens
export const clearInMemoryWorkoutData = () => {
  pendingExercises = [];
  replaceExerciseId = null;
};

// Clear workout data from local storage and memory
// This is called after saving a completed workout or discarding
// Active workouts are only stored locally, so we only need to clear AsyncStorage
export const clearWorkoutData = async () => {
  try {
    // Clear all workout-related keys from local storage
    await AsyncStorage.multiRemove([
      CURRENT_WORKOUT_KEY,
      WORKOUT_DURATION_KEY,
      PENDING_EXERCISES_KEY, // Also clear pending exercises if any
    ]);
    
    // Clear in-memory variables
    clearInMemoryWorkoutData();

    // Also clear any persisted "current workout" document in Firestore (legacy support)
    const user = auth.currentUser;
    if (user) {
      await deleteCurrentWorkoutDocument(user.uid);
    }
    
    // Verify deletion by checking if keys still exist
    const [workoutExists, durationExists] = await Promise.all([
      AsyncStorage.getItem(CURRENT_WORKOUT_KEY),
      AsyncStorage.getItem(WORKOUT_DURATION_KEY),
    ]);
    
    if (workoutExists || durationExists) {
      console.warn('Workout data may not have been fully cleared from local storage');
      // Force remove individually if multiRemove didn't work
      if (workoutExists) await AsyncStorage.removeItem(CURRENT_WORKOUT_KEY);
      if (durationExists) await AsyncStorage.removeItem(WORKOUT_DURATION_KEY);
    }
  } catch (error) {
    console.error('Error clearing workout data:', error);
    // Try individual removals as fallback
    try {
      await AsyncStorage.removeItem(CURRENT_WORKOUT_KEY);
      await AsyncStorage.removeItem(WORKOUT_DURATION_KEY);
      await AsyncStorage.removeItem(PENDING_EXERCISES_KEY);
    } catch (fallbackError) {
      console.error('Error in fallback clear:', fallbackError);
    } finally {
      // Always clear in-memory variables even if storage clear fails
      clearInMemoryWorkoutData();
    }
  }
};

// Check if there's a workout in progress
export const hasWorkoutInProgress = async (): Promise<boolean> => {
  try {
    const exercisesData = await AsyncStorage.getItem(CURRENT_WORKOUT_KEY);
    const hasData = exercisesData !== null && exercisesData !== '[]' && exercisesData.trim() !== '';
    console.log('hasWorkoutInProgress check:', { exercisesData, hasData });
    return hasData;
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

    // Fetch user document to get username and avatar
    const userDoc = await getUserDocument(user.uid);
    const username = (userDoc as any)?.username || user.email?.split('@')[0] || 'User';
    const avatar = (userDoc as any)?.avatar || null;

    const workoutRef = await addDoc(collection(db, 'workouts'), {
      ...workoutData,
      userId: user.uid,
      username, // Store username in workout document
      avatar, // Store avatar in workout document
      visibility: workoutData.visibility || 'Everyone', // Default to Everyone if not specified
      likes: workoutData.likes || [], // Initialize likes array
      comments: workoutData.comments || [], // Initialize comments array
      createdAt: new Date().toISOString(),
    });

    console.log('Workout saved to Firestore with ID:', workoutRef.id);
    return workoutRef.id;
  } catch (error) {
    console.error('Error saving completed workout:', error);
    throw error;
  }
};

// Track if we've already warned about the missing index
let hasWarnedAboutIndex = false;

// Get user's completed workouts from Firestore
export const getCompletedWorkouts = async (limitCount: number = 50) => {
  try {
    const user = auth.currentUser;
    if (!user) return [];

    const workoutsRef = collection(db, 'workouts');
    
    try {
      // Try query with index first
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
    } catch (indexError: any) {
      // If index error, fall back to simpler query without orderBy
      if (indexError.code === 'failed-precondition' || indexError.message?.includes('index')) {
        // Only warn once per app session
        if (!hasWarnedAboutIndex) {
          hasWarnedAboutIndex = true;
          console.warn('Firestore index not found. Using fallback query. To improve performance, create the index at: https://console.firebase.google.com/project/hevyclone-20505/firestore/indexes');
        }
        
        // Fallback: Get all user workouts and sort in memory
        const q = query(
          workoutsRef,
          where('userId', '==', user.uid),
          limit(limitCount as number)
        );

        const querySnapshot = await getDocs(q);
        const workouts = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        // Sort by createdAt in memory
        return workouts.sort((a: any, b: any) => {
          const aTime = a.createdAt || a.date || '';
          const bTime = b.createdAt || b.date || '';
          return bTime.localeCompare(aTime);
        });
      }
      throw indexError;
    }
  } catch (error) {
    console.error('Error getting completed workouts:', error);
    return [];
  }
};

// Get a specific workout by ID (works for all public workouts and user's own workouts)
export const getWorkoutById = async (workoutId: string) => {
  try {
    const user = auth.currentUser;
    if (!user) {
      console.error('User not authenticated');
      return null;
    }

    const workoutRef = doc(db, 'workouts', workoutId);
    const workoutDoc = await getDoc(workoutRef);
    
    if (workoutDoc.exists()) {
      const data = workoutDoc.data();
      // Allow access if workout is public OR belongs to current user
      if (data.visibility === 'Everyone' || data.userId === user.uid) {
        return {
          id: workoutDoc.id,
          ...data,
        };
      } else {
        console.error('Workout is private and does not belong to current user');
        return null;
      }
    }
    console.error('Workout document does not exist');
    return null;
  } catch (error) {
    console.error('Error getting workout by ID:', error);
    return null;
  }
};
