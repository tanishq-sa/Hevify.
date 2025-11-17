import AsyncStorage from '@react-native-async-storage/async-storage';

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

// Save current workout to local storage
export const saveWorkoutData = async (exercises: any[], duration: number) => {
  try {
    await AsyncStorage.setItem(CURRENT_WORKOUT_KEY, JSON.stringify(exercises));
    await AsyncStorage.setItem(WORKOUT_DURATION_KEY, duration.toString());
  } catch (error) {
    console.error('Error saving workout data:', error);
  }
};

// Load current workout from local storage
export const loadWorkoutData = async (): Promise<{ exercises: any[], duration: number }> => {
  try {
    const [exercisesData, durationData] = await Promise.all([
      AsyncStorage.getItem(CURRENT_WORKOUT_KEY),
      AsyncStorage.getItem(WORKOUT_DURATION_KEY),
    ]);
    
    return {
      exercises: exercisesData ? JSON.parse(exercisesData) : [],
      duration: durationData ? parseInt(durationData, 10) : 0,
    };
  } catch (error) {
    console.error('Error loading workout data:', error);
    return { exercises: [], duration: 0 };
  }
};

// Clear workout data
export const clearWorkoutData = async () => {
  try {
    await AsyncStorage.multiRemove([CURRENT_WORKOUT_KEY, WORKOUT_DURATION_KEY]);
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

