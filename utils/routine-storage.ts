import AsyncStorage from '@react-native-async-storage/async-storage';

const ROUTINES_KEY = '@routines:all_routines';

// Temporary storage for passing exercises between screens
let pendingRoutineExercises: any[] = [];

export const setPendingRoutineExercises = (exercises: any[]) => {
  pendingRoutineExercises = exercises;
};

export const getPendingRoutineExercises = () => {
  const exercises = [...pendingRoutineExercises];
  pendingRoutineExercises = [];
  return exercises;
};

export type RoutineSet = {
  id: string;
  setNumber: string; // "1", "2", "3", or "F" for failure
  weight?: number; // Optional for bodyweight exercises
  repRange?: string; // "8 to 12", "12 to 15", "8 to -"
  reps?: number; // For bodyweight exercises
};

export type RoutineExercise = {
  id: string;
  name: string;
  equipment?: string; // "Barbell", "Dumbbell", "Machine", etc.
  primaryMuscle?: string;
  secondaryMuscles?: string[];
  restTimer: number; // in seconds
  notes: string;
  sets: RoutineSet[];
};

export type Routine = {
  id: string;
  name: string; // Day name or routine name
  notes: string;
  exercises: RoutineExercise[];
  createdAt: string;
  updatedAt: string;
};

// Get all routines
export const getAllRoutines = async (): Promise<Routine[]> => {
  try {
    const routinesData = await AsyncStorage.getItem(ROUTINES_KEY);
    if (routinesData) {
      return JSON.parse(routinesData);
    }
    return [];
  } catch (error) {
    console.error('Error getting routines:', error);
    return [];
  }
};

// Get a specific routine by ID
export const getRoutineById = async (routineId: string): Promise<Routine | null> => {
  try {
    const routines = await getAllRoutines();
    return routines.find(r => r.id === routineId) || null;
  } catch (error) {
    console.error('Error getting routine by ID:', error);
    return null;
  }
};

// Save a routine (create or update)
export const saveRoutine = async (routine: Routine): Promise<void> => {
  try {
    const routines = await getAllRoutines();
    const existingIndex = routines.findIndex(r => r.id === routine.id);
    
    if (existingIndex >= 0) {
      // Update existing routine
      routines[existingIndex] = {
        ...routine,
        updatedAt: new Date().toISOString(),
      };
    } else {
      // Add new routine
      routines.push({
        ...routine,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    await AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
  } catch (error) {
    console.error('Error saving routine:', error);
    throw error;
  }
};

// Delete a routine
export const deleteRoutine = async (routineId: string): Promise<void> => {
  try {
    const routines = await getAllRoutines();
    const filtered = routines.filter(r => r.id !== routineId);
    await AsyncStorage.setItem(ROUTINES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error deleting routine:', error);
    throw error;
  }
};

// Calculate estimated duration for a routine
export const calculateRoutineDuration = (routine: Routine): number => {
  // Estimate: 2 minutes per set + rest time
  let totalSeconds = 0;
  routine.exercises.forEach(exercise => {
    exercise.sets.forEach((set, index) => {
      totalSeconds += 120; // 2 minutes per set
      if (index < exercise.sets.length - 1) {
        totalSeconds += exercise.restTimer; // Add rest time between sets
      }
    });
    // Add rest time between exercises (60 seconds)
    totalSeconds += 60;
  });
  return Math.ceil(totalSeconds / 60); // Return in minutes
};

// Calculate total sets for a routine
export const calculateTotalSets = (routine: Routine): number => {
  return routine.exercises.reduce((total, exercise) => total + exercise.sets.length, 0);
};

