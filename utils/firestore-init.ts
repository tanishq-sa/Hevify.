import { db } from '@/config/firebase';
import { deleteDoc, doc, getDoc, increment, setDoc, updateDoc } from 'firebase/firestore';

/**
 * Initialize user document in Firestore
 * Call this after user signs up or signs in for the first time
 * Matches the schema defined in docs/firestore-schema.md
 */
export const initializeUserDocument = async (userId: string, userData: {
  username?: string;
  email: string;
  avatar?: string;
  bio?: string;
}) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Create new user document with all schema fields
      await setDoc(userRef, {
        username: userData.username || userData.email.split('@')[0],
        email: userData.email,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        ...(userData.avatar && { avatar: userData.avatar }),
        ...(userData.bio && { bio: userData.bio }),
        stats: {
          totalWorkouts: 0,
          totalVolume: 0,
          totalSets: 0,
          records: 0,
        },
      });
      console.log('User document initialized');
    } else {
      // Update existing user document - merge new fields if provided
      const updateData: any = {
        updatedAt: new Date().toISOString(),
      };
      
      if (userData.username) updateData.username = userData.username;
      if (userData.email) updateData.email = userData.email;
      if (userData.avatar !== undefined) updateData.avatar = userData.avatar;
      if (userData.bio !== undefined) updateData.bio = userData.bio;
      
      // Ensure stats exist if they don't
      const existingData = userDoc.data();
      if (!existingData.stats) {
        updateData.stats = {
          totalWorkouts: 0,
          totalVolume: 0,
          totalSets: 0,
          records: 0,
        };
      }
      
      await updateDoc(userRef, updateData);
    }
  } catch (error) {
    console.error('Error initializing user document:', error);
    throw error;
  }
};

/**
 * Update user stats after completing a workout
 * Uses Firestore increment for atomic updates
 */
export const updateUserStats = async (userId: string, workoutData: {
  volume?: number;
  sets?: number;
  records?: number;
}) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      // Initialize user document if it doesn't exist
      await initializeUserDocument(userId, {
        email: '', // Will be updated by caller if needed
      });
    }

    // Use atomic increments for stats
    const updates: any = {
      'stats.totalWorkouts': increment(1),
      updatedAt: new Date().toISOString(),
    };

    if (workoutData.volume !== undefined) {
      updates['stats.totalVolume'] = increment(workoutData.volume);
    }
    if (workoutData.sets !== undefined) {
      updates['stats.totalSets'] = increment(workoutData.sets);
    }
    if (workoutData.records !== undefined) {
      updates['stats.records'] = increment(workoutData.records);
    }

    await updateDoc(userRef, updates);
  } catch (error) {
    console.error('Error updating user stats:', error);
    throw error;
  }
};

/**
 * Get user stats
 * Returns default stats if user document doesn't exist or stats are missing
 */
export const getUserStats = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      const data = userDoc.data();
      return data.stats || {
        totalWorkouts: 0,
        totalVolume: 0,
        totalSets: 0,
        records: 0,
      };
    }
    
    // Return default stats if user document doesn't exist
    return {
      totalWorkouts: 0,
      totalVolume: 0,
      totalSets: 0,
      records: 0,
    };
  } catch (error) {
    console.error('Error getting user stats:', error);
    // Return default stats on error
    return {
      totalWorkouts: 0,
      totalVolume: 0,
      totalSets: 0,
      records: 0,
    };
  }
};

/**
 * Initialize current workout document
 * Matches the schema: workouts/current_{userId}
 */
export const initializeCurrentWorkout = async (userId: string) => {
  try {
    const workoutRef = doc(db, 'workouts', `current_${userId}`);
    const workoutDoc = await getDoc(workoutRef);

    if (!workoutDoc.exists()) {
      await setDoc(workoutRef, {
        exercises: [],
        duration: 0,
        userId,
        updatedAt: new Date().toISOString(),
      });
      console.log('Current workout document initialized');
    }
  } catch (error) {
    console.error('Error initializing current workout:', error);
    throw error;
  }
};

/**
 * Delete the current workout document if it exists (legacy support)
 */
export const deleteCurrentWorkoutDocument = async (userId: string) => {
  try {
    const workoutRef = doc(db, 'workouts', `current_${userId}`);
    await deleteDoc(workoutRef);
  } catch (error: any) {
    if (error?.code !== 'not-found') {
      console.warn('Unable to delete current workout document:', error);
    }
  }
};

/**
 * Get user document with all fields
 * Returns null if user doesn't exist
 */
export const getUserDocument = async (userId: string) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data(),
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting user document:', error);
    return null;
  }
};

