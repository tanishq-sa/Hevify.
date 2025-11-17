import { useColorScheme } from '@/hooks/use-color-scheme';
import { clearWorkoutData, getPendingExercises, loadWorkoutData, saveWorkoutData, setReplaceExerciseId } from '@/utils/workout-storage';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowUpDown, Check, ChevronLeft, Clock, Dumbbell, MoreVertical, Plus, RefreshCw, Settings, Trash2, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, Vibration, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Swipeable from 'react-native-gesture-handler/Swipeable';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../global.css';

  type ExerciseSet = {
    id: string;
    weight: number;
    reps: number;
    rpe: number | null;
    completed: boolean;
    setType?: 'W' | '1' | 'F' | 'D'; // W=Warm Up, 1=Normal, F=Failure, D=Drop Set
  };

type WorkoutExercise = {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  notes: string;
  restTimer: number; // in seconds
  sets: ExerciseSet[];
};

export default function LogWorkoutScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const params = useLocalSearchParams();
  const [duration, setDuration] = useState(0);
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const timerStartTimeRef = useRef<number>(Date.now());
  const restTimerStartRef = useRef<{ [exerciseId: string]: number }>({});
  const [restTimerDisplay, setRestTimerDisplay] = useState<{ [exerciseId: string]: number }>({});
  const restTimerNotifiedRef = useRef<{ [exerciseId: string]: boolean }>({});
  const [rpeModal, setRpeModal] = useState<{ isOpen: boolean; exerciseId: string | null; setId: string | null }>({
    isOpen: false,
    exerciseId: null,
    setId: null,
  });
  const [setTypeModal, setSetTypeModal] = useState<{ isOpen: boolean; exerciseId: string | null; setId: string | null }>({
    isOpen: false,
    exerciseId: null,
    setId: null,
  });
  const [muscleDistributionModal, setMuscleDistributionModal] = useState(false);
  const [restTimerModal, setRestTimerModal] = useState<{ isOpen: boolean; exerciseId: string | null }>({
    isOpen: false,
    exerciseId: null,
  });
  const [exerciseMenuModal, setExerciseMenuModal] = useState<{ isOpen: boolean; exerciseId: string | null }>({
    isOpen: false,
    exerciseId: null,
  });
  const [clockModal, setClockModal] = useState(false);
  const [clockMode, setClockMode] = useState<'timer' | 'stopwatch'>('timer');
  const [clockTime, setClockTime] = useState(60); // in seconds, default 1 minute
  const [clockRunning, setClockRunning] = useState(false);
  const clockStartTimeRef = useRef<number | null>(null);
  const clockIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerValueRef = useRef<number>(60); // Preserve timer value
  const stopwatchValueRef = useRef<number>(0); // Preserve stopwatch value
  const isModalOpeningRef = useRef(false);
  const isActionInProgressRef = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      const { exercises: savedExercises, duration: savedDuration } = await loadWorkoutData();
      if (savedExercises.length > 0) {
        const migratedExercises = savedExercises.map(ex => ({
          ...ex,
          sets: ex.sets.map((set: ExerciseSet) => ({
            ...set,
            setType: set.setType || '1',
          })),
        }));
        setExercises(migratedExercises);
        setDuration(savedDuration);
        timerStartTimeRef.current = Date.now() - (savedDuration * 1000);
      }
      setIsLoaded(true);
    };
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Handle pending exercises first (new exercises to add)
      const newExercises = getPendingExercises();
      if (newExercises.length > 0) {
        const workoutExercises: WorkoutExercise[] = newExercises.map((ex: any) => ({
          id: ex.id,
          name: ex.name,
          primaryMuscle: ex.primaryMuscle,
          secondaryMuscles: ex.secondaryMuscles || [],
          notes: '',
          restTimer: 50,
          sets: [{
            id: Date.now().toString() + Math.random(),
            weight: 0,
            reps: 0,
            rpe: null,
            completed: false,
            setType: '1',
          }],
        }));
        setExercises(prev => {
          const toAdd = workoutExercises.map((e: WorkoutExercise) => {
            const existingIds = prev.map(ex => ex.id);
            if (existingIds.includes(e.id)) {
              return {
                ...e,
                id: Date.now().toString() + Math.random().toString(),
              };
            }
            return e;
          });
          const updated = [...prev, ...toAdd];
          // Calculate current duration for saving
          const currentDuration = Math.floor((Date.now() - timerStartTimeRef.current) / 1000);
          saveWorkoutData(updated, currentDuration);
          return updated;
        });
      } else {
        // Only reload if no pending exercises (e.g., returning from reorder page)
        const reloadData = async () => {
          const { exercises: savedExercises, duration: savedDuration } = await loadWorkoutData();
          if (savedExercises.length > 0) {
            const migratedExercises = savedExercises.map(ex => ({
              ...ex,
              sets: ex.sets.map((set: ExerciseSet) => ({
                ...set,
                setType: set.setType || '1',
              })),
            }));
            setExercises(migratedExercises);
            // Update timer start time to maintain correct duration calculation
            timerStartTimeRef.current = Date.now() - (savedDuration * 1000);
            // Set duration based on calculated elapsed time
            const currentDuration = Math.floor((Date.now() - timerStartTimeRef.current) / 1000);
            setDuration(currentDuration);
          }
        };
        reloadData();
      }
    }, [])
  );

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else if (seconds < 3600) {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins}m ${secs}s`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const mins = Math.floor((seconds % 3600) / 60);
      const secs = seconds % 60;
      return `${hours}h ${mins}m`;
    }
  };

  const formatRestTimer = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    } else {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      if (secs === 0) {
        return `${mins} min`;
      } else {
        return `${mins} min ${secs} sec`;
      }
    }
  };

  const formatRestTimerMMSS = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Get the active rest timer (the one that's currently counting down)
  const getActiveRestTimer = () => {
    for (const [exerciseId, remaining] of Object.entries(restTimerDisplay)) {
      if (remaining > 0) {
        const exercise = exercises.find(e => e.id === exerciseId);
        return { exerciseId, remaining, exercise };
      }
    }
    return null;
  };

  const activeRestTimer = getActiveRestTimer();

  useEffect(() => {
    if (!isLoaded) return;
    
    const interval = setInterval(() => {
      // Calculate duration based on elapsed time from start
      const elapsed = Math.floor((Date.now() - timerStartTimeRef.current) / 1000);
      setDuration(elapsed);
      
      // Calculate rest timer countdowns for each exercise
      const restTimers: { [exerciseId: string]: number } = {};
      exercises.forEach(exercise => {
        if (restTimerStartRef.current[exercise.id]) {
          const elapsedRest = Math.floor((Date.now() - restTimerStartRef.current[exercise.id]) / 1000);
          const remaining = Math.max(0, exercise.restTimer - elapsedRest);
          restTimers[exercise.id] = remaining;
          
          // Trigger sound and vibration when timer reaches 0
          if (remaining === 0 && !restTimerNotifiedRef.current[exercise.id]) {
            restTimerNotifiedRef.current[exercise.id] = true;
            
            // Vibrate with pattern: vibrate 3 times with pauses
            Vibration.vibrate([0, 500, 200, 500, 200, 500]);
            
            // Haptic feedback
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {
              // Haptics might not be available on all devices
            });
            
            // Additional haptic pattern for emphasis
            setTimeout(() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
            }, 300);
          }
          
          // Clear timer when it reaches 0
          if (remaining === 0) {
            delete restTimerStartRef.current[exercise.id];
            // Reset notification flag after a delay
            setTimeout(() => {
              delete restTimerNotifiedRef.current[exercise.id];
            }, 1000);
          }
        }
      });
      setRestTimerDisplay(restTimers);
      
      // Save every 5 seconds
      if (elapsed % 5 === 0) {
        saveWorkoutData(exercises, elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isLoaded, exercises]);

  useFocusEffect(
    useCallback(() => {
      // TODO: enhance this with proper state management
    }, [])
  );

  const addSet = (exerciseId: string) => {
    setExercises(prev => {
      const updated = prev.map(ex => {
        if (ex.id === exerciseId) {
          const newSet: ExerciseSet = {
            id: Date.now().toString() + Math.random(),
            weight: 0,
            reps: 0,
            rpe: null,
            completed: false,
            setType: '1',
          };
          return { ...ex, sets: [...ex.sets, newSet] };
        }
        return ex;
      });
      saveWorkoutData(updated, duration);
      return updated;
    });
  };

  const updateSet = (exerciseId: string, setId: string, field: keyof ExerciseSet, value: any) => {
    setExercises(prev => {
      const updated = prev.map(ex => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map(set => 
              set.id === setId ? { ...set, [field]: value } : set
            ),
          };
        }
        return ex;
      });
      saveWorkoutData(updated, duration);
      return updated;
    });
  };

  const deleteSet = (exerciseId: string, setId: string) => {
    setExercises(prev => {
      const updated = prev.map(ex => {
        if (ex.id === exerciseId) {
          const filteredSets = ex.sets.filter(set => set.id !== setId);
          return { ...ex, sets: filteredSets };
        }
        return ex;
      }).filter(ex => ex.sets.length > 0); // Remove exercise if no sets left
      
      saveWorkoutData(updated, duration);
      return updated;
    });
  };

  const toggleSetCompleted = (exerciseId: string, setId: string) => {
    setExercises(prev => {
      const updated = prev.map(ex => {
        if (ex.id === exerciseId) {
          const updatedSets = ex.sets.map(set => 
            set.id === setId ? { ...set, completed: !set.completed } : set
          );
          // Start rest timer when a set is completed
          const setBeingCompleted = updatedSets.find(s => s.id === setId);
          if (setBeingCompleted?.completed) {
            restTimerStartRef.current[exerciseId] = Date.now();
          }
          return {
            ...ex,
            sets: updatedSets,
          };
        }
        return ex;
      });
      saveWorkoutData(updated, duration);
      return updated;
    });
  };

  const getRpeDescription = (rpe: number): { title: string; subtitle: string } => {
    const descriptions: Record<number, { title: string; subtitle: string }> = {
      6: { title: 'Easy Effort', subtitle: 'Could have done 4+ more reps' },
      6.5: { title: 'Easy-Moderate Effort', subtitle: 'Could have done 3-4 more reps' },
      7: { title: 'Moderate Effort', subtitle: 'Could have done 3 more reps' },
      7.5: { title: 'Moderate-Hard Effort', subtitle: 'Could have done 2-3 more reps' },
      8: { title: 'Hard Effort', subtitle: 'Could have done 2 more reps' },
      8.5: { title: 'Very Hard Effort', subtitle: 'Could have done 1-2 more reps' },
      9: { title: 'Extremely Hard Effort', subtitle: 'Could have definitely done 1 more rep' },
      9.5: { title: 'Maximum Effort', subtitle: 'Could have maybe done 1 more rep' },
      10: { title: 'Absolute Maximum', subtitle: 'Could not have done any more reps' },
    };
    return descriptions[rpe] || { title: 'Select RPE', subtitle: '' };
  };

  const rpeValues = [6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5, 10];

  const API_BASE_URL = 'https://musclegroup-image-generator-main-production.up.railway.app';

  const mapMuscleToAPI = (muscle: string): string => {
    const muscleMap: { [key: string]: string } = {
      'Lats': 'latissimus',
      'Chest': 'chest',
      'Upper Chest': 'chest',
      'Quads': 'quadriceps',
      'Hamstrings': 'hamstring',
      'Lower Back': 'back_lower',
      'Back': 'back',
      'Front Delts': 'shoulders_front',
      'Side Delts': 'shoulders',
      'Rear Delts': 'shoulders_back',
      'Shoulders': 'shoulders',
      'Biceps': 'biceps',
      'Triceps': 'triceps',
      'Calves': 'calfs',
      'Glutes': 'gluteus',
      'Rhomboids': 'back_upper',
      'Middle Traps': 'back_upper',
      'Upper Traps': 'back_upper',
      'Traps': 'back_upper',
      'Core': 'abs',
      'Forearms': 'forearms',
      'Brachialis': 'biceps',
      'Soleus': 'calfs',
    };
    return muscleMap[muscle] || muscle.toLowerCase().replace(/\s+/g, '_');
  };

  const calculateMuscleDistribution = () => {
    const muscleCounts: { [key: string]: number } = {};
    
    exercises.forEach(exercise => {
      const completedSets = exercise.sets.filter(set => set.completed).length;
      
      if (exercise.primaryMuscle) {
        const primary = exercise.primaryMuscle;
        muscleCounts[primary] = (muscleCounts[primary] || 0) + completedSets;
      }
      
      exercise.secondaryMuscles.forEach(secondary => {
        if (secondary) {
          muscleCounts[secondary] = (muscleCounts[secondary] || 0) + (completedSets * 0.5);
        }
      });
    });
    
    return Object.entries(muscleCounts)
      .map(([muscle, count]) => ({ muscle, count: Math.round(count * 10) / 10 }))
      .sort((a, b) => b.count - a.count);
  };

  const muscleDistribution = calculateMuscleDistribution();

  const handleSetTypeSelect = (setType: 'W' | '1' | 'F' | 'D' | 'X') => {
    if (setTypeModal.exerciseId && setTypeModal.setId) {
      if (setType === 'X') {
        // Remove set
        setExercises(prev => {
          const updated = prev.map(ex => {
            if (ex.id === setTypeModal.exerciseId) {
              const filteredSets = ex.sets.filter(set => set.id !== setTypeModal.setId);
              // Ensure at least one set remains
              if (filteredSets.length === 0) {
                return ex;
              }
              return { ...ex, sets: filteredSets };
            }
            return ex;
          });
          saveWorkoutData(updated, duration);
          return updated;
        });
      } else {
        // Update set type
        updateSet(setTypeModal.exerciseId, setTypeModal.setId, 'setType', setType);
      }
      setSetTypeModal({ isOpen: false, exerciseId: null, setId: null });
    }
  };

  const getSetTypeInfo = (setType?: 'W' | '1' | 'F' | 'D' | 'X') => {
    const defaultType = setType || '1';
    const types = {
      'W': { label: 'Warm Up Set', color: '#FF9500', icon: 'W', bgColor: '#FF9500' },
      '1': { label: 'Normal Set', color: '#FFFFFF', icon: '1', bgColor: '#FFFFFF' },
      'F': { label: 'Failure Set', color: '#FF3B30', icon: 'F', bgColor: '#FF3B30' },
      'D': { label: 'Drop Set', color: '#007AFF', icon: 'D', bgColor: '#007AFF' },
      'X': { label: 'Remove Set', color: '#FF3B30', icon: 'X', bgColor: '#FF3B30' },
    };
    return types[defaultType];
  };
  
  const getAllMuscles = () => {
    const primaryMuscles: string[] = [];
    const secondaryMuscles: string[] = [];
    
    exercises.forEach(exercise => {
      const hasCompletedSets = exercise.sets.some(set => set.completed);
      
      if (hasCompletedSets) {
        if (exercise.primaryMuscle && !primaryMuscles.includes(exercise.primaryMuscle)) {
          primaryMuscles.push(exercise.primaryMuscle);
        }
        exercise.secondaryMuscles.forEach(secondary => {
          if (secondary && !secondaryMuscles.includes(secondary) && !primaryMuscles.includes(secondary)) {
            secondaryMuscles.push(secondary);
          }
        });
      }
    });
    
    return {
      primary: primaryMuscles.map(m => mapMuscleToAPI(m)).join(','),
      secondary: secondaryMuscles.map(m => mapMuscleToAPI(m)).join(','),
    };
  };

  const muscleGroups = getAllMuscles();
  const muscleImageUrl = muscleGroups.primary 
    ? `${API_BASE_URL}/getMulticolorImage?primaryMuscleGroups=${encodeURIComponent(muscleGroups.primary)}&secondaryMuscleGroups=${encodeURIComponent(muscleGroups.secondary)}&primaryColor=60,165,250&secondaryColor=100,165,250&transparentBackground=1`
    : `${API_BASE_URL}/getBaseImage?transparentBackground=1`;

  const totalSets = exercises.reduce((sum, ex) => sum + ex.sets.filter(set => set.completed).length, 0);
  const totalVolume = exercises.reduce((sum, ex) => 
    sum + ex.sets
      .filter(set => set.completed)
      .reduce((setSum, set) => setSum + (set.weight * set.reps), 0), 0
  );

  // Right action component for swipe-to-delete
  const renderRightActions = (exerciseId: string, setId: string) => (
    <View style={{
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#EF4444',
      paddingHorizontal: 20,
      marginLeft: 10,
    }}>
      <Pressable
        onPress={() => {
          deleteSet(exerciseId, setId);
        }}
        style={{ padding: 10 }}
      >
        <Trash2 size={24} color="#FFFFFF" />
      </Pressable>
    </View>
  );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView 
        className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background'}`} 
        edges={['top', 'left', 'right']}
      >
      {/* Header */}
      <View className={`flex-row items-center justify-between px-4 py-3 ${isDark ? 'bg-background-dark' : 'bg-background'}`}>
        <Pressable onPress={() => router.back()}>
          <ChevronLeft size={24} color={isDark ? '#F5F5F5' : '#11181C'} />
        </Pressable>
        <Text className={`text-lg font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
          Log Workout
        </Text>
        <View className="flex-row items-center">
          <Pressable 
            className="mr-3"
            onPress={() => {
              if (!isActionInProgressRef.current) {
                isActionInProgressRef.current = true;
                setClockModal(true);
                setTimeout(() => {
                  isActionInProgressRef.current = false;
                }, 300);
              }
            }}
          >
            <Clock size={20} color={isDark ? '#F5F5F5' : '#11181C'} />
          </Pressable>
          <Pressable 
            className="px-6 py-3 rounded-xl"
            style={{
              backgroundColor: '#3B82F6',
            }}
            onPress={async () => {
              // Save current workout data before navigating
              await saveWorkoutData(exercises, duration);
              router.push('/save-workout');
            }}
          >
            <Text className="font-semibold text-white text-base">
              Finish
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Workout Summary Bar */}
      <View className={`px-4 py-3 ${isDark ? 'bg-card-dark' : 'bg-card'} border-b ${isDark ? 'border-border-dark' : 'border-border'}`}>
        <View className="flex-row items-end">
          <View>
            <Text className={`text-xs ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
              Duration
            </Text>
            <Text className={`text-base font-semibold ${isDark ? 'text-primary-dark' : 'text-primary'}`}>
              {formatDuration(duration)}
            </Text>
          </View>
          <View className="flex-1 items-center">
            <Text className={`text-xs ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
              Volume
            </Text>
            <Text className={`text-base font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              {totalVolume} kg
            </Text>
          </View>
          <View className="flex-row items-end">
            <View>
              <Text className={`text-xs ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                Sets
              </Text>
              <Text className={`text-base font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                {totalSets}
              </Text>
            </View>
            <Pressable 
              className="ml-4"
              onPress={() => {
                if (!muscleDistributionModal && !isModalOpeningRef.current) {
                  isModalOpeningRef.current = true;
                  setMuscleDistributionModal(true);
                }
              }}
            >
              <Image
                source={{ uri: muscleImageUrl }}
                style={{ width: 32, height: 36 }}
                contentFit="contain"
              />
            </Pressable>
          </View>
        </View>
      </View>


      {exercises.length === 0 ? (
        /* Empty State */
        <View className="flex-1 items-center justify-center px-4">
          <View className="items-center mb-8">
            <View className={`w-24 h-24 rounded-full items-center justify-center mb-6 ${isDark ? 'bg-card-dark' : 'bg-card'}`}>
              <Dumbbell 
                size={48} 
                color={isDark ? '#9BA1A6' : '#687076'} 
                strokeWidth={1.5}
              />
            </View>
            <Text className={`text-2xl font-bold mb-2 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              Get started
            </Text>
            <Text className={`text-base ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
              Add an exercise to start your workout
            </Text>
          </View>

          {/* Add Exercise Button */}
          <Pressable 
            className={`w-full py-4 rounded-lg flex-row items-center justify-center mb-6 ${isDark ? 'bg-primary-dark' : 'bg-primary'}`}
            onPress={() => {
              if (!isActionInProgressRef.current) {
                isActionInProgressRef.current = true;
                router.push('/add-exercise' as any);
                setTimeout(() => {
                  isActionInProgressRef.current = false;
                }, 500);
              }
            }}
          >
            <View className="mr-2">
              <Plus size={20} color={isDark ? '#0A0A0A' : '#FFFFFF'} />
            </View>
            <Text className={`text-lg font-semibold ${isDark ? 'text-primary-foreground-dark' : 'text-primary-foreground'}`}>
              Add Exercise
            </Text>
          </Pressable>

          <View className="flex-row w-full gap-3">
            <Pressable 
              className={`flex-1 py-3 rounded-lg items-center ${isDark ? 'bg-card-dark' : 'bg-card'}`}
            >
              <Settings size={20} color={isDark ? '#F5F5F5' : '#11181C'} />
              <Text className={`mt-2 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                Settings
              </Text>
            </Pressable>
            <Pressable 
              className={`flex-1 py-3 rounded-lg items-center ${isDark ? 'bg-card-dark' : 'bg-card'}`}
              onPress={() => router.back()}
            >
              <X size={20} color="#EF4444" />
              <Text className="mt-2 text-destructive">
                Discard Workout
              </Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <ScrollView 
          className="flex-1" 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: activeRestTimer ? 220 : 0 }}
        >
          {exercises.map((exercise) => (
            <View key={exercise.id} className={`mb-4 px-4 ${isDark ? 'bg-background-dark' : 'bg-background'}`}>
              <View className="flex-row items-center mb-3 mt-4">
                <View className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${isDark ? 'bg-card-dark' : 'bg-card'}`}>
                  <Dumbbell size={24} color={isDark ? '#9BA1A6' : '#687076'} />
                </View>
                <Pressable 
                  className="flex-1"
                  onPress={() => {
                    router.push({
                      pathname: '/exercise-detail',
                      params: {
                        name: exercise.name,
                        primaryMuscle: exercise.primaryMuscle,
                        secondaryMuscles: exercise.secondaryMuscles?.join(',') || '',
                      },
                    } as any);
                  }}
                >
                  <Text className={`text-base font-semibold ${isDark ? 'text-primary-dark' : 'text-primary'}`}>
                    {exercise.name}
                  </Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    if (!exerciseMenuModal.isOpen && !isActionInProgressRef.current) {
                      isActionInProgressRef.current = true;
                      setExerciseMenuModal({ isOpen: true, exerciseId: exercise.id });
                    }
                  }}
                >
                  <MoreVertical size={20} color={isDark ? '#9BA1A6' : '#687076'} />
                </Pressable>
              </View>

              <TextInput
                className={`px-3 py-2 rounded-lg mb-3 ${isDark ? 'bg-dark text-background-dark' : 'bg-background text-foreground'}`}
                placeholder="Add notes here..."
                placeholderTextColor={isDark ? '#9BA1A6' : '#687076'}
                value={exercise.notes}
                onChangeText={(text) => {
                  setExercises(prev => prev.map(ex => 
                    ex.id === exercise.id ? { ...ex, notes: text } : ex
                  ));
                }}
              />

              <Pressable
                className="flex-row items-center mb-4"
                onPress={() => {
                  if (!isActionInProgressRef.current) {
                    isActionInProgressRef.current = true;
                    setRestTimerModal({ isOpen: true, exerciseId: exercise.id });
                  }
                }}
              >
                <Clock size={16} color={isDark ? '#60A5FA' : '#3B82F6'} />
                <Text className={`text-sm ml-2 ${isDark ? 'text-primary-dark' : 'text-primary'}`}>
                  Rest Timer: {formatRestTimer(exercise.restTimer)}
                </Text>
              </Pressable>

              <View className={`rounded-lg mb-3 ${isDark ? 'bg-background-dark' : 'bg-background'}`}>
                <View className="flex-row items-center px-3 py-2">
                  <View className="w-10 items-center">
                    <Text className={`text-xs font-semibold ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                      SET
                    </Text>
                  </View>
                  <View className="flex-1 items-center">
                    <Text className={`text-xs font-semibold ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                      PREVIOUS
                    </Text>
                  </View>
                  <View className="w-16 items-center">
                    <View className="flex-row items-center">
                      <Dumbbell size={12} color={isDark ? '#9BA1A6' : '#687076'} />
                      <Text className={`text-xs font-semibold ml-1 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                        KG
                      </Text>
                    </View>
                  </View>
                  <View className="w-16 items-center">
                    <View className="flex-row items-center">
                      <Text className={`text-xs font-semibold ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                        REPS
                      </Text>
                    </View>
                  </View>
                  <View className="w-20 items-center">
                    <Text className={`text-xs font-semibold ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                      RPE
                    </Text>
                  </View>
                  <View className="w-6 items-center">
                    <Check size={12} color={isDark ? '#9BA1A6' : '#687076'} />
                  </View>
                </View>

                {exercise.sets.map((set, index) => (
                  <Swipeable
                    key={set.id}
                    friction={1.5}
                    overshootFriction={8}
                    rightThreshold={40}
                    overshootRight={false}
                    renderRightActions={() => renderRightActions(exercise.id, set.id)}
                  >
                    <View 
                      className={`flex-row items-center px-3 py-3 ${
                        set.completed 
                          ? '' 
                          : (index % 2 === 1 ? (isDark ? 'bg-card-dark' : 'bg-secondary') : '')
                      }`}
                      style={[
                        { width: '100%' },
                        set.completed ? {
                          backgroundColor: 'rgba(70, 200, 80, 0.8)', // green-500 with 80% opacity
                        } : {}
                      ]}
                    >
                    <Pressable 
                      className="w-10 items-center justify-center"
                      onPress={() => {
                        if (!setTypeModal.isOpen && !isActionInProgressRef.current) {
                          isActionInProgressRef.current = true;
                          setSetTypeModal({ isOpen: true, exerciseId: exercise.id, setId: set.id });
                        }
                      }}
                    >
                      {(() => {
                        const setTypeInfo = getSetTypeInfo(set.setType);
                        const setType = set.setType || '1';
                        const isNormal = setType === '1';
                        const isWarmUp = setType === 'W';
                        const isFailure = setType === 'F';
                        const isDropSet = setType === 'D';
                        
                        const displayText = isNormal ? (index + 1).toString() : setTypeInfo.icon;
                        
                        let iconColor = set.completed ? '#FFFFFF' : (isDark ? '#F5F5F5' : '#11181C');
                        if (!set.completed) {
                          if (isWarmUp) iconColor = '#FF9500';
                          else if (isFailure) iconColor = '#FF3B30';
                          else if (isDropSet) iconColor = '#007AFF';
                        }
                        
                        return (
                          <View 
                            className="w-7 h-7 rounded items-center justify-center"
                          >
                            <Text 
                              className="text-xs font-bold"
                              style={{ color: iconColor }}
                            >
                              {displayText}
                            </Text>
                          </View>
                        );
                      })()}
                    </Pressable>
                    <View className="flex-1 items-center">
                      <Text className={`text-sm text-center ${set.completed ? 'text-white' : (isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground')}`}>
                        -
                      </Text>
                    </View>
                    <View className="w-16 items-center">
                      <TextInput
                        className={`text-sm text-center bg-transparent`}
                        value={set.weight.toString()}
                        onChangeText={(text) => updateSet(exercise.id, set.id, 'weight', parseFloat(text) || 0)}
                        keyboardType="numeric"
                        style={{ 
                          width: '100%',
                          color: set.completed 
                            ? '#FFFFFF'
                            : (set.weight === 0 
                              ? (isDark ? '#9BA1A6' : '#687076')
                              : (isDark ? '#F5F5F5' : '#11181C'))
                        }}
                      />
                    </View>
                    <View className="w-16 items-center">
                      <TextInput
                        className={`text-sm text-center bg-transparent`}
                        value={set.reps.toString()}
                        onChangeText={(text) => updateSet(exercise.id, set.id, 'reps', parseInt(text) || 0)}
                        keyboardType="numeric"
                        style={{ 
                          width: '100%',
                          color: set.completed 
                            ? '#FFFFFF'
                            : (set.reps === 0 
                              ? (isDark ? '#9BA1A6' : '#687076')
                              : (isDark ? '#F5F5F5' : '#11181C'))
                        }}
                      />
                    </View>
                    <View className="w-20 items-center">
                      <Pressable 
                        className={`w-12 h-9 rounded-2xl items-center justify-center ${set.completed ? 'bg-green-500' : (isDark ? 'bg-gray-500' : 'bg-gray-200')}`}
                        onPress={() => {
                          if (!rpeModal.isOpen && !isActionInProgressRef.current) {
                            isActionInProgressRef.current = true;
                            setRpeModal({ isOpen: true, exerciseId: exercise.id, setId: set.id });
                          }
                        }}
                      >
                        <Text className={`text-xs text-center ${set.completed ? 'text-white' : (isDark ? 'text-foreground-dark' : 'text-foreground')}`}>
                          {set.rpe !== null ? set.rpe : 'RPE'}
                        </Text>
                      </Pressable>
                    </View>
                    <View className="w-6 items-center">
                      <Pressable 
                        className={`w-8 h-9 rounded-2xl items-center justify-center ${set.completed ? 'bg-green-500' : (isDark ? 'bg-gray-500' : 'bg-gray-200')}`}
                        onPress={() => toggleSetCompleted(exercise.id, set.id)}
                      >
                        {set.completed ? (
                          <Check size={16} color="#FFFFFF" />
                        ) : (
                          <Check size={16} color={isDark ? '#FFFFFF' : '#000000'} strokeWidth={2} />
                        )}
                      </Pressable>
                    </View>
                  </View>
                  </Swipeable>
                ))}

                <View className="mt-4">
                  <Pressable
                    className={`py-2.5 px-10 w-full items-center rounded-2xl self-center ${isDark ? 'bg-card-dark' : 'bg-secondary'}`}
                    onPress={() => {
                      if (!isActionInProgressRef.current) {
                        isActionInProgressRef.current = true;
                        addSet(exercise.id);
                        setTimeout(() => {
                          isActionInProgressRef.current = false;
                        }, 300);
                      }
                    }}
                  >
                    <Text className="text-sm" style={{ color: isDark ? '#F5F5F5' : '#11181C' }}>
                      + Add Set
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))}

            <Pressable 
              className={`mx-4 mb-4 py-4 rounded-lg flex-row items-center justify-center ${isDark ? 'bg-primary-dark' : 'bg-primary'}`}
              onPress={() => {
                if (!isActionInProgressRef.current) {
                  isActionInProgressRef.current = true;
                  router.push('/add-exercise' as any);
                  setTimeout(() => {
                    isActionInProgressRef.current = false;
                  }, 500);
                }
              }}
            >
            <View className="mr-2">
              <Plus size={20} color={isDark ? '#0A0A0A' : '#FFFFFF'} />
            </View>
            <Text className={`text-lg font-semibold ${isDark ? 'text-primary-foreground-dark' : 'text-primary-foreground'}`}>
              Add Exercise
            </Text>
          </Pressable>

          <View className="flex-row px-4 mb-6 gap-3">
            <Pressable 
              className={`flex-1 py-3 rounded-lg items-center ${isDark ? 'bg-card-dark' : 'bg-card'}`}
            >
              <Settings size={20} color={isDark ? '#F5F5F5' : '#11181C'} />
              <Text className={`mt-2 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                Settings
              </Text>
            </Pressable>
            <Pressable 
              className={`flex-1 py-3 rounded-lg items-center ${isDark ? 'bg-card-dark' : 'bg-card'}`}
              onPress={async () => {
                await clearWorkoutData();
                router.back();
              }}
            >
              <X size={20} color="#EF4444" />
              <Text className="mt-2 text-destructive">
                Discard Workout
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      )}

      {/* Active Rest Timer Bottom Display */}
      {activeRestTimer && (
        <View className={`absolute bottom-0 left-0 right-0 ${isDark ? 'bg-card-dark' : 'bg-card'} border-t ${isDark ? 'border-border-dark' : 'border-border'} pb-12 pt-8 px-4`}>
          {/* Exercise Name */}
          <Text className={`text-center text-sm mb-6 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
            {activeRestTimer.exercise?.name}
          </Text>
          
          {/* Large Timer Display */}
          <View className="items-center mb-8">
            <Text className={`text-center text-7xl font-bold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`} style={{ fontFamily: 'monospace', letterSpacing: 2 }}>
              {formatRestTimerMMSS(activeRestTimer.remaining)}
            </Text>
          </View>
          
          {/* Control Buttons */}
          <View className="flex-row items-center justify-between px-4">
            <Pressable
              onPress={() => {
                if (activeRestTimer.exerciseId && restTimerStartRef.current[activeRestTimer.exerciseId]) {
                  const exercise = exercises.find(e => e.id === activeRestTimer.exerciseId);
                  if (exercise) {
                    // Add 15 seconds - adjust start time to effectively add time
                    const currentElapsed = Math.floor((Date.now() - restTimerStartRef.current[activeRestTimer.exerciseId]) / 1000);
                    // Move start time back by 15 seconds (subtract 15 from elapsed)
                    restTimerStartRef.current[activeRestTimer.exerciseId] = Date.now() - ((currentElapsed - 15) * 1000);
                    
                    // Update display immediately
                    const newRemaining = Math.min(exercise.restTimer - (currentElapsed - 15), exercise.restTimer + 15);
                    setRestTimerDisplay(prev => ({
                      ...prev,
                      [activeRestTimer.exerciseId!]: Math.max(0, newRemaining),
                    }));
                    
                    // Update exercise restTimer asynchronously (don't block UI)
                    setTimeout(() => {
                      const newRestTimer = Math.min(exercise.restTimer + 15, 600);
                      setExercises(prev => {
                        const updated = prev.map(ex => 
                          ex.id === activeRestTimer.exerciseId ? { ...ex, restTimer: newRestTimer } : ex
                        );
                        saveWorkoutData(updated, duration);
                        return updated;
                      });
                    }, 0);
                  }
                }
              }}
            >
              <Text className={`text-lg font-medium ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                +15
              </Text>
            </Pressable>
            
            <Pressable
              onPress={() => {
                if (activeRestTimer.exerciseId && restTimerStartRef.current[activeRestTimer.exerciseId]) {
                  const exercise = exercises.find(e => e.id === activeRestTimer.exerciseId);
                  if (exercise) {
                    // Subtract 15 seconds - update ref immediately for instant feedback
                    const currentElapsed = Math.floor((Date.now() - restTimerStartRef.current[activeRestTimer.exerciseId]) / 1000);
                    const newElapsed = Math.min(currentElapsed + 15, exercise.restTimer);
                    restTimerStartRef.current[activeRestTimer.exerciseId] = Date.now() - (newElapsed * 1000);
                    
                    // Update display immediately
                    const newRemaining = Math.max(0, exercise.restTimer - newElapsed);
                    setRestTimerDisplay(prev => ({
                      ...prev,
                      [activeRestTimer.exerciseId!]: newRemaining,
                    }));
                  }
                }
              }}
            >
              <Text className={`text-lg font-medium ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                -15
              </Text>
            </Pressable>
            
            <Pressable
              className={`px-6 py-3 rounded-xl ${isDark ? 'bg-primary-dark' : 'bg-primary'}`}
              onPress={() => {
                if (activeRestTimer.exerciseId) {
                  delete restTimerStartRef.current[activeRestTimer.exerciseId];
                  setRestTimerDisplay(prev => {
                    const updated = { ...prev };
                    delete updated[activeRestTimer.exerciseId];
                    return updated;
                  });
                }
              }}
            >
              <Text className={`text-base font-semibold ${isDark ? 'text-primary-foreground-dark' : 'text-primary-foreground'}`}>
                Skip
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* Set Type Selection Modal */}
      <Modal
        visible={setTypeModal.isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setSetTypeModal({ isOpen: false, exerciseId: null, setId: null });
          isActionInProgressRef.current = false;
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <Pressable 
            className="flex-1"
            onPress={() => {
              setSetTypeModal({ isOpen: false, exerciseId: null, setId: null });
              isActionInProgressRef.current = false;
            }}
          />
          <View className={`${isDark ? 'bg-card-dark' : 'bg-card'} rounded-t-3xl p-6 pb-8`}>
            {/* Drag Handle */}
            <View className="items-center mb-4">
              <View className={`w-12 h-1 rounded-full ${isDark ? 'bg-muted-foreground-dark' : 'bg-muted-foreground'}`} />
            </View>

            <Text className={`text-xl font-bold text-center mb-6 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              Select Set Type
            </Text>

            {/* Set Type Options */}
            <View className="space-y-3">
              {(['W', '1', 'F', 'D', 'X'] as const).map((type) => {
                const typeInfo = getSetTypeInfo(type);
                const isWarmUp = type === 'W';
                const isNormal = type === '1';
                const isFailure = type === 'F';
                const isDropSet = type === 'D';
                const isRemove = type === 'X';
                
                let iconColor = isDark ? '#F5F5F5' : '#11181C';
                if (isWarmUp) iconColor = '#FF9500';
                else if (isFailure || isRemove) iconColor = '#FF3B30';
                else if (isDropSet) iconColor = '#007AFF';
                
                let labelColor = isDark ? '#F5F5F5' : '#11181C';
                
                return (
                  <Pressable
                    key={type}
                    onPress={() => {
                      handleSetTypeSelect(type);
                      isActionInProgressRef.current = false;
                    }}
                    className={`flex-row items-center justify-between p-4 rounded-xl mb-3 ${isDark ? 'bg-muted-dark' : 'bg-muted'}`}
                  >
                    <View className="flex-row items-center flex-1">
                      <View 
                        className="w-8 h-8 rounded items-center justify-center mr-3"
                      >
                        <Text 
                          className="text-sm font-bold"
                          style={{ color: iconColor }}
                        >
                          {typeInfo.icon}
                        </Text>
                      </View>
                      <Text 
                        className="text-base flex-1"
                        style={{ color: labelColor }}
                      >
                        {typeInfo.label}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

      {/* RPE Modal */}
      <Modal
        visible={rpeModal.isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setRpeModal({ isOpen: false, exerciseId: null, setId: null });
          isActionInProgressRef.current = false;
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <Pressable 
            className="flex-1"
            onPress={() => {
              setRpeModal({ isOpen: false, exerciseId: null, setId: null });
              isActionInProgressRef.current = false;
            }}
          />
          <View className={`${isDark ? 'bg-card-dark' : 'bg-card'} rounded-t-3xl p-6 pb-8`}>
            {/* Drag Handle */}
            <View className="items-center mb-4">
              <View className={`w-12 h-1 rounded-full ${isDark ? 'bg-muted-foreground-dark' : 'bg-muted-foreground'}`} />
            </View>
            {rpeModal.exerciseId && rpeModal.setId && (() => {
              const exercise = exercises.find(e => e.id === rpeModal.exerciseId);
              const set = exercise?.sets.find(s => s.id === rpeModal.setId);
              if (!exercise || !set) return null;
              
              const currentRpe = set.rpe ?? 0;
              const description = getRpeDescription(currentRpe);

              return (
                <>
                  <Text className={`text-xl font-bold mb-2 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                    Log Set RPE
                  </Text>
                  <Text className={`text-base mb-6 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                    Set {exercise.sets.findIndex(s => s.id === set.id) + 1}: {set.weight}kg x {set.reps} reps
                  </Text>

                  {/* Large RPE Display */}
                  <View className="items-center mb-6">
                    <View className={`w-32 h-32 rounded-full items-center justify-center mb-2 ${isDark ? 'bg-muted-dark' : 'bg-muted'}`}>
                      <Text className={`text-5xl font-bold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                        {currentRpe > 0 ? currentRpe : '0'}
                      </Text>
                    </View>
                    <Text className={`text-sm mb-1 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                      RPE
                    </Text>
                    {currentRpe > 0 && (
                      <>
                        <Text className={`text-lg font-semibold mb-1 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                          {description.title}
                        </Text>
                        <Text className={`text-sm text-center ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                          {description.subtitle}
                        </Text>
                      </>
                    )}
                  </View>

                  {/* RPE Selection Buttons */}
                  <View className="flex-row flex-wrap justify-center gap-2 mb-6">
                    {rpeValues.map((rpe) => (
                      <Pressable
                        key={rpe}
                        className={`px-4 py-2 rounded-2xl ${currentRpe === rpe ? (isDark ? 'bg-primary-dark' : 'bg-primary') : (isDark ? 'bg-muted-dark' : 'bg-muted')}`}
                        onPress={() => updateSet(exercise.id, set.id, 'rpe', rpe)}
                      >
                        <Text className={`text-base font-semibold ${currentRpe === rpe ? (isDark ? 'text-primary-foreground-dark' : 'text-primary-foreground') : (isDark ? 'text-foreground-dark' : 'text-foreground')}`}>
                          {rpe}
                        </Text>
                      </Pressable>
                    ))}
                  </View>

                  {/* Done Button */}
                  <Pressable
                    className={`py-4 rounded-xl items-center ${isDark ? 'bg-primary-dark' : 'bg-primary'}`}
                    onPress={() => {
                      setRpeModal({ isOpen: false, exerciseId: null, setId: null });
                      isActionInProgressRef.current = false;
                    }}
                  >
                    <Text className={`text-base font-semibold ${isDark ? 'text-primary-foreground-dark' : 'text-primary-foreground'}`}>
                      Done
                    </Text>
                  </Pressable>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* Rest Timer Modal */}
      <Modal
        visible={restTimerModal.isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setRestTimerModal({ isOpen: false, exerciseId: null });
          isActionInProgressRef.current = false;
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <Pressable 
            className="flex-1"
            onPress={() => {
              setRestTimerModal({ isOpen: false, exerciseId: null });
              isActionInProgressRef.current = false;
            }}
          />
          <View className={`${isDark ? 'bg-card-dark' : 'bg-card'} rounded-t-3xl p-6 pb-8`}>
            {/* Drag Handle */}
            <View className="items-center mb-4">
              <View className={`w-12 h-1 rounded-full ${isDark ? 'bg-muted-foreground-dark' : 'bg-muted-foreground'}`} />
            </View>
            {restTimerModal.exerciseId && (() => {
              const exercise = exercises.find(e => e.id === restTimerModal.exerciseId);
              if (!exercise) return null;
              
              const restTimerOptions = [
                30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 90, 120, 150, 180
              ];
              
              return (
                <>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className={`text-xl font-bold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                      Rest Timer
                    </Text>
                    <Pressable onPress={() => {
                      setRestTimerModal({ isOpen: false, exerciseId: null });
                      isActionInProgressRef.current = false;
                    }}>
                      <Settings size={20} color={isDark ? '#9BA1A6' : '#687076'} />
                    </Pressable>
                  </View>
                  
                  <Text className={`text-base mb-6 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                    {exercise.name}
                  </Text>

                  {/* Rest Timer Options */}
                  <ScrollView showsVerticalScrollIndicator={false} className="max-h-96">
                    {restTimerOptions.map((seconds) => {
                      const isSelected = exercise.restTimer === seconds;
                      const mins = Math.floor(seconds / 60);
                      const secs = seconds % 60;
                      const displayText = mins > 0 
                        ? `${mins}min ${secs > 0 ? `${secs}s` : '0s'}`
                        : `${seconds}s`;
                      
                      return (
                        <Pressable
                          key={seconds}
                          className={`py-4 px-4 mb-2 rounded-lg ${isSelected ? (isDark ? 'bg-primary-dark' : 'bg-primary') : (isDark ? 'bg-muted-dark' : 'bg-muted')}`}
                          onPress={() => {
                            setExercises(prev => {
                              const updated = prev.map(ex => 
                                ex.id === exercise.id ? { ...ex, restTimer: seconds } : ex
                              );
                              saveWorkoutData(updated, duration);
                              return updated;
                            });
                            setRestTimerModal({ isOpen: false, exerciseId: null });
                            isActionInProgressRef.current = false;
                          }}
                        >
                          <Text className={`text-base font-medium text-center ${isSelected ? (isDark ? 'text-primary-foreground-dark' : 'text-primary-foreground') : (isDark ? 'text-foreground-dark' : 'text-foreground')}`}>
                            {displayText}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  {/* Done Button */}
                  <Pressable
                    className={`py-4 rounded-xl items-center mt-4 ${isDark ? 'bg-primary-dark' : 'bg-primary'}`}
                    onPress={() => {
                      setRestTimerModal({ isOpen: false, exerciseId: null });
                      isActionInProgressRef.current = false;
                    }}
                  >
                    <Text className={`text-base font-semibold ${isDark ? 'text-primary-foreground-dark' : 'text-primary-foreground'}`}>
                      Done
                    </Text>
                  </Pressable>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* Muscle Distribution Modal */}
      <Modal
        visible={muscleDistributionModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setMuscleDistributionModal(false);
          isModalOpeningRef.current = false;
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <Pressable 
            className="flex-1"
            onPress={() => {
              setMuscleDistributionModal(false);
              isModalOpeningRef.current = false;
            }}
          />
          <View className={`${isDark ? 'bg-card-dark' : 'bg-card'} rounded-t-3xl p-6 pb-8 max-h-[90%]`}>
            {/* Drag Handle */}
            <View className="items-center mb-4">
              <View className={`w-12 h-1 rounded-full ${isDark ? 'bg-muted-foreground-dark' : 'bg-muted-foreground'}`} />
            </View>

            <Text className={`text-xl font-bold text-center mb-6 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              Muscle Distribution
            </Text>
            
            {/* Anatomical Diagrams */}
            <View className="items-center mb-6">
              <Image
                source={{ uri: muscleImageUrl }}
                style={{ width: 256, height: 384 }}
                contentFit="contain"
              />
            </View>

            {/* Muscle List */}
            {muscleDistribution.length > 0 ? (
              <ScrollView showsVerticalScrollIndicator={false}>
                <View className="flex-row mb-3 px-4">
                  <Text className={`flex-1 text-sm font-semibold ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                    Muscle
                  </Text>
                  <Text className={`text-sm font-semibold ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                    Completed Sets
                  </Text>
                </View>
                {muscleDistribution.map(({ muscle, count }) => {
                  const maxCount = Math.max(...muscleDistribution.map(m => m.count));
                  const progressPercentage = maxCount > 0 ? (count / maxCount) * 100 : 0;
                  
                  return (
                    <View key={muscle} className="flex-row items-center mb-3 px-4">
                      <Text className={`text-sm mr-3 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`} style={{ minWidth: 100 }}>
                        {muscle}
                      </Text>
                      <View 
                        className={`h-2 rounded-full mr-2 flex-1 ${isDark ? 'bg-muted-dark' : 'bg-muted'}`}
                      >
                        <View 
                          className={`h-2 rounded-full ${isDark ? 'bg-primary-dark' : 'bg-primary'}`}
                          style={{ 
                            width: `${progressPercentage}%`,
                          }}
                        />
                      </View>
                      <Text className={`text-sm ${isDark ? 'text-foreground-dark' : 'text-foreground'}`} style={{ minWidth: 32 }}>
                        {count}
                      </Text>
                    </View>
                  );
                })}
              </ScrollView>
            ) : (
              <View className="items-center py-8">
                <Text className={`text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                  No completed sets yet
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Exercise Menu Modal */}
      <Modal
        visible={exerciseMenuModal.isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setExerciseMenuModal({ isOpen: false, exerciseId: null });
          isActionInProgressRef.current = false;
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <Pressable 
            className="flex-1"
            onPress={() => {
              setExerciseMenuModal({ isOpen: false, exerciseId: null });
              isActionInProgressRef.current = false;
            }}
          />
          <View className={`${isDark ? 'bg-card-dark' : 'bg-card'} rounded-t-3xl p-6 pb-8`}>
            {/* Drag Handle */}
            <View className="items-center mb-4">
              <View className={`w-12 h-1 rounded-full ${isDark ? 'bg-muted-foreground-dark' : 'bg-muted-foreground'}`} />
            </View>

            {/* Menu Options */}
            <Pressable
              className="flex-row items-center py-4 px-4"
              onPress={() => {
                setExerciseMenuModal({ isOpen: false, exerciseId: null });
                isActionInProgressRef.current = false;
                router.push('/reorder-exercises' as any);
              }}
            >
              <ArrowUpDown size={24} color={isDark ? '#F5F5F5' : '#11181C'} />
              <Text className={`ml-4 text-base ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                Reorder Exercises
              </Text>
            </Pressable>

            <Pressable
              className="flex-row items-center py-4 px-4"
              onPress={() => {
                if (exerciseMenuModal.exerciseId) {
                  setReplaceExerciseId(exerciseMenuModal.exerciseId);
                  setExerciseMenuModal({ isOpen: false, exerciseId: null });
                  isActionInProgressRef.current = false;
                  router.push('/add-exercise' as any);
                }
              }}
            >
              <RefreshCw size={24} color={isDark ? '#F5F5F5' : '#11181C'} />
              <Text className={`ml-4 text-base ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                Replace Exercise
              </Text>
            </Pressable>

            <Pressable
              className="flex-row items-center py-4 px-4"
              onPress={() => {
                setExerciseMenuModal({ isOpen: false, exerciseId: null });
                isActionInProgressRef.current = false;
                // TODO: Implement add to superset
              }}
            >
              <Plus size={24} color={isDark ? '#F5F5F5' : '#11181C'} />
              <Text className={`ml-4 text-base ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                Add To Superset
              </Text>
            </Pressable>

            <Pressable
              className="flex-row items-center py-4 px-4"
              onPress={async () => {
                if (exerciseMenuModal.exerciseId) {
                  setExercises(prev => {
                    const updated = prev.filter(ex => ex.id !== exerciseMenuModal.exerciseId);
                    saveWorkoutData(updated, duration);
                    return updated;
                  });
                }
                setExerciseMenuModal({ isOpen: false, exerciseId: null });
                isActionInProgressRef.current = false;
              }}
            >
              <X size={24} color="#EF4444" />
              <Text className="ml-4 text-base text-destructive">
                Remove Exercise
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Clock Modal */}
      <Modal
        visible={clockModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setClockModal(false);
          setClockRunning(false);
          if (clockIntervalRef.current) {
            clearInterval(clockIntervalRef.current);
            clockIntervalRef.current = null;
          }
          isActionInProgressRef.current = false;
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <Pressable 
            className="flex-1"
            onPress={() => {
              setClockModal(false);
              setClockRunning(false);
              if (clockIntervalRef.current) {
                clearInterval(clockIntervalRef.current);
                clockIntervalRef.current = null;
              }
              isActionInProgressRef.current = false;
            }}
          />
          <View className={`${isDark ? 'bg-card-dark' : 'bg-card'} rounded-t-3xl p-6 pb-8`}>
            {/* Drag Handle */}
            <View className="items-center mb-4">
              <View className={`w-12 h-1 rounded-full ${isDark ? 'bg-muted-foreground-dark' : 'bg-muted-foreground'}`} />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between mb-6">
              <View className="flex-row items-center flex-1">
                <Pressable 
                  className="mr-3"
                  onPress={() => {
                    setClockModal(false);
                    setClockRunning(false);
                    if (clockIntervalRef.current) {
                      clearInterval(clockIntervalRef.current);
                      clockIntervalRef.current = null;
                    }
                    isActionInProgressRef.current = false;
                  }}
                >
                  <Settings size={20} color={isDark ? '#9BA1A6' : '#687076'} />
                </Pressable>
                <Text className={`text-xl font-bold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                  Clock
                </Text>
              </View>
            </View>

            {/* Timer/Stopwatch Toggle */}
            <View className="flex-row mb-6 rounded-lg overflow-hidden" style={{ backgroundColor: isDark ? '#1F1F1F' : '#F5F5F5' }}>
              <Pressable
                className={`flex-1 py-3 ${clockMode === 'timer' ? (isDark ? 'bg-primary-dark' : 'bg-primary') : ''}`}
                onPress={() => {
                  // Save current stopwatch value before switching
                  if (clockMode === 'stopwatch') {
                    stopwatchValueRef.current = clockTime;
                  }
                  
                  setClockMode('timer');
                  setClockRunning(false);
                  if (clockIntervalRef.current) {
                    clearInterval(clockIntervalRef.current);
                    clockIntervalRef.current = null;
                  }
                  // Restore timer value
                  setClockTime(timerValueRef.current);
                }}
              >
                <Text className={`text-center font-semibold ${clockMode === 'timer' ? (isDark ? 'text-primary-foreground-dark' : 'text-primary-foreground') : (isDark ? 'text-foreground-dark' : 'text-foreground')}`}>
                  Timer
                </Text>
              </Pressable>
              <Pressable
                className={`flex-1 py-3 ${clockMode === 'stopwatch' ? (isDark ? 'bg-primary-dark' : 'bg-primary') : ''}`}
                onPress={() => {
                  // Save current timer value before switching
                  if (clockMode === 'timer') {
                    timerValueRef.current = clockTime;
                  }
                  
                  setClockMode('stopwatch');
                  setClockRunning(false);
                  if (clockIntervalRef.current) {
                    clearInterval(clockIntervalRef.current);
                    clockIntervalRef.current = null;
                  }
                  // Restore stopwatch value
                  setClockTime(stopwatchValueRef.current);
                }}
              >
                <Text className={`text-center font-semibold ${clockMode === 'stopwatch' ? (isDark ? 'text-primary-foreground-dark' : 'text-primary-foreground') : (isDark ? 'text-foreground-dark' : 'text-foreground')}`}>
                  Stopwatch
                </Text>
              </Pressable>
            </View>

            {/* Timer Display with Controls */}
            <View className="items-center mb-6">
              <View className="flex-row items-center justify-center">
                {/* -15s Button */}
                {clockMode === 'timer' && (
                  <Pressable
                    className="mr-6"
                    onPress={() => {
                      if (clockRunning && clockStartTimeRef.current) {
                        // Adjust running timer: subtract 15 seconds from remaining time
                        const elapsed = Math.floor((Date.now() - clockStartTimeRef.current) / 1000);
                        const currentRemaining = Math.max(0, clockTime - elapsed);
                        const newRemaining = Math.max(0, currentRemaining - 15);
                        // Adjust start time to account for the change
                        clockStartTimeRef.current = Date.now() - ((clockTime - newRemaining) * 1000);
                        setClockTime(newRemaining);
                      } else {
                        // Not running: just subtract from time
                        setClockTime(prev => Math.max(0, prev - 15));
                      }
                    }}
                  >
                    <Text className={`text-lg font-medium ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                      -15s
                    </Text>
                  </Pressable>
                )}
                
                {/* Circular Timer Display */}
                <View className={`w-56 h-56 rounded-full border-4 items-center justify-center ${isDark ? 'border-primary-dark' : 'border-primary'}`}>
                  <Text className={`text-6xl font-bold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`} style={{ fontFamily: 'monospace', letterSpacing: 2 }}>
                    {formatRestTimerMMSS(clockTime)}
                  </Text>
                </View>
                
                {/* +15s Button */}
                {clockMode === 'timer' && (
                  <Pressable
                    className="ml-6"
                    onPress={() => {
                      if (clockRunning && clockStartTimeRef.current) {
                        // Adjust running timer: add 15 seconds to remaining time
                        const elapsed = Math.floor((Date.now() - clockStartTimeRef.current) / 1000);
                        const currentRemaining = Math.max(0, clockTime - elapsed);
                        const newRemaining = Math.min(currentRemaining + 15, 3600); // Max 1 hour
                        // Adjust start time to account for the change
                        clockStartTimeRef.current = Date.now() - ((clockTime - newRemaining) * 1000);
                        setClockTime(newRemaining);
                      } else {
                        // Not running: just add to time
                        setClockTime(prev => Math.min(prev + 15, 3600)); // Max 1 hour
                      }
                    }}
                  >
                    <Text className={`text-lg font-medium ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                      +15s
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* Control Buttons */}
            {clockMode === 'stopwatch' ? (
              !clockRunning && clockTime > 0 ? (
                // Stopped with time: Show Reset + Resume
                <View className="flex-row gap-3">
                  <Pressable
                    className="flex-1 py-4 rounded-xl items-center border-2"
                    style={{
                      backgroundColor: isDark ? '#2F2F2F' : '#E5E5E5',
                      borderColor: isDark ? '#404040' : '#D4D4D4',
                    }}
                    onPress={() => {
                      setClockTime(0);
                      stopwatchValueRef.current = 0;
                      setClockRunning(false);
                      if (clockIntervalRef.current) {
                        clearInterval(clockIntervalRef.current);
                        clockIntervalRef.current = null;
                      }
                    }}
                  >
                    <Text className={`text-base font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                      Reset
                    </Text>
                  </Pressable>
                  <Pressable
                    className="flex-1 py-4 rounded-xl items-center"
                    style={{
                      backgroundColor: isDark ? '#3B82F6' : '#3B82F6',
                    }}
                    onPress={() => {
                      // Resume stopwatch
                      setClockRunning(true);
                      clockStartTimeRef.current = Date.now() - (clockTime * 1000);
                      clockIntervalRef.current = setInterval(() => {
                        const elapsed = Math.floor((Date.now() - clockStartTimeRef.current!) / 1000);
                        setClockTime(elapsed);
                        stopwatchValueRef.current = elapsed;
                      }, 100);
                    }}
                  >
                    <Text className="text-base font-semibold text-white">
                      Resume
                    </Text>
                  </Pressable>
                </View>
              ) : (
                // Running or at 0: Show single button
                <Pressable
                  className="w-full py-4 rounded-xl items-center"
                  style={{
                    backgroundColor: isDark ? '#3B82F6' : '#3B82F6',
                  }}
                  onPress={() => {
                    if (!clockRunning) {
                      // Start stopwatch
                      setClockRunning(true);
                      clockStartTimeRef.current = Date.now() - (clockTime * 1000);
                      clockIntervalRef.current = setInterval(() => {
                        const elapsed = Math.floor((Date.now() - clockStartTimeRef.current!) / 1000);
                        setClockTime(elapsed);
                        stopwatchValueRef.current = elapsed;
                      }, 100);
                    } else {
                      // Stop stopwatch
                      setClockRunning(false);
                      if (clockIntervalRef.current) {
                        clearInterval(clockIntervalRef.current);
                        clockIntervalRef.current = null;
                      }
                      stopwatchValueRef.current = clockTime;
                    }
                  }}
                >
                  <Text className="text-base font-semibold text-white">
                    {clockRunning ? 'Stop' : 'Start'}
                  </Text>
                </Pressable>
              )
            ) : (
              <Pressable
                className="w-full py-4 rounded-xl items-center"
                style={{
                  backgroundColor: isDark ? '#3B82F6' : '#3B82F6',
                }}
                onPress={() => {
                  // Timer mode only
                  if (!clockRunning) {
                    // Start timer
                    timerValueRef.current = clockTime; // Save initial timer value
                    setClockRunning(true);
                    clockStartTimeRef.current = Date.now();
                    clockIntervalRef.current = setInterval(() => {
                      const elapsed = Math.floor((Date.now() - clockStartTimeRef.current!) / 1000);
                      const remaining = Math.max(0, timerValueRef.current - elapsed);
                      setClockTime(remaining);
                      if (remaining === 0) {
                        setClockRunning(false);
                        if (clockIntervalRef.current) {
                          clearInterval(clockIntervalRef.current);
                          clockIntervalRef.current = null;
                        }
                        // Vibrate and notify when timer reaches 0
                        Vibration.vibrate([0, 200, 100, 200, 100, 200]);
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
                      }
                    }, 100);
                  } else {
                    // Stop timer
                    setClockRunning(false);
                    if (clockIntervalRef.current) {
                      clearInterval(clockIntervalRef.current);
                      clockIntervalRef.current = null;
                    }
                    // Save current remaining time
                    timerValueRef.current = clockTime;
                  }
                }}
              >
                <Text className="text-base font-semibold text-white">
                  {clockRunning ? 'Stop' : 'Start'}
                </Text>
              </Pressable>
            )}
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}
