import { useColorScheme } from '@/hooks/use-color-scheme';
import { clearWorkoutData, getPendingExercises, loadWorkoutData, saveWorkoutData } from '@/utils/workout-storage';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Check, ChevronLeft, Clock, Dumbbell, MoreVertical, Plus, Settings, X } from 'lucide-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../global.css';

type ExerciseSet = {
  id: string;
  weight: number;
  reps: number;
  rpe: number | null;
  completed: boolean;
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
  const [rpeModal, setRpeModal] = useState<{ isOpen: boolean; exerciseId: string | null; setId: string | null }>({
    isOpen: false,
    exerciseId: null,
    setId: null,
  });
  const [muscleDistributionModal, setMuscleDistributionModal] = useState(false);
  const isModalOpeningRef = useRef(false);
  const isActionInProgressRef = useRef(false);

  useEffect(() => {
    const loadData = async () => {
      const { exercises: savedExercises, duration: savedDuration } = await loadWorkoutData();
      if (savedExercises.length > 0) {
        setExercises(savedExercises);
        setDuration(savedDuration);
        timerStartTimeRef.current = Date.now() - (savedDuration * 1000);
      }
      setIsLoaded(true);
    };
    loadData();
  }, []);

  useFocusEffect(
    useCallback(() => {
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
          }],
        }));
        setExercises(prev => {
          const toAdd = workoutExercises.map((e: WorkoutExercise) => {
            // If exercise already exists, create a new unique ID for the duplicate
            const existingIds = prev.map(ex => ex.id);
            if (existingIds.includes(e.id)) {
              return {
                ...e,
                id: Date.now().toString() + Math.random().toString(),
              };
            }
            return e;
          });
          return [...prev, ...toAdd];
        });
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
    return `${seconds}s`;
  };

  // Start timer when component mounts
  useEffect(() => {
    if (!isLoaded) return;
    
    const interval = setInterval(() => {
      setDuration((prev) => {
        const newDuration = prev + 1;
        // Save duration every 5 seconds
        if (newDuration % 5 === 0) {
          saveWorkoutData(exercises, newDuration);
        }
        return newDuration;
      });
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

  const toggleSetCompleted = (exerciseId: string, setId: string) => {
    setExercises(prev => {
      const updated = prev.map(ex => {
        if (ex.id === exerciseId) {
          return {
            ...ex,
            sets: ex.sets.map(set => 
              set.id === setId ? { ...set, completed: !set.completed } : set
            ),
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

  // Map muscle names to API format
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
  
  const getAllMuscles = () => {
    const primaryMuscles: string[] = [];
    const secondaryMuscles: string[] = [];
    
    exercises.forEach(exercise => {
      const hasCompletedSets = exercise.sets.some(set => set.completed);
      
      // Only include muscles from exercises with completed sets
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
    sum + ex.sets.reduce((setSum, set) => setSum + (set.weight * set.reps), 0), 0
  );

  return (
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
          <View className="mr-3">
            <Clock size={20} color={isDark ? '#F5F5F5' : '#11181C'} />
          </View>
          <Pressable 
            className={`px-4 py-2 rounded-lg ${isDark ? 'bg-primary-dark' : 'bg-primary'}`}
          >
            <Text className={`font-semibold ${isDark ? 'text-primary-foreground-dark' : 'text-primary-foreground'}`}>
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
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {exercises.map((exercise) => (
            <View key={exercise.id} className={`mb-4 px-4 ${isDark ? 'bg-background-dark' : 'bg-background'}`}>
              <View className="flex-row items-center mb-3 mt-4">
                <View className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${isDark ? 'bg-card-dark' : 'bg-card'}`}>
                  <Dumbbell size={24} color={isDark ? '#9BA1A6' : '#687076'} />
                </View>
                <View className="flex-1">
                  <Text className={`text-base font-semibold ${isDark ? 'text-primary-dark' : 'text-primary'}`}>
                    {exercise.name}
                  </Text>
                </View>
                <Pressable>
                  <MoreVertical size={20} color={isDark ? '#9BA1A6' : '#687076'} />
                </Pressable>
              </View>

              <TextInput
                className={`px-3 py-2 rounded-lg mb-3 ${isDark ? 'bg-card-dark text-background-dark' : 'bg-background text-foreground'}`}
                placeholder="Add notes here..."
                placeholderTextColor={isDark ? '#9BA1A6' : '#687076'}
                value={exercise.notes}
                onChangeText={(text) => {
                  setExercises(prev => prev.map(ex => 
                    ex.id === exercise.id ? { ...ex, notes: text } : ex
                  ));
                }}
              />

              <View className="flex-row items-center mb-4">
                <Clock size={16} color={isDark ? '#60A5FA' : '#3B82F6'} />
                <Text className={`text-sm ml-2 ${isDark ? 'text-primary-dark' : 'text-primary'}`}>
                  Rest Timer: {formatRestTimer(exercise.restTimer)}
                </Text>
              </View>

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
                  <View key={set.id} className="flex-row items-center px-3 py-3">
                    <View className="w-10 items-center">
                      <Text className={`text-sm text-center ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                        {index + 1}
                      </Text>
                    </View>
                    <View className="flex-1 items-center">
                      <Text className={`text-sm text-center ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
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
                          color: set.weight === 0 
                            ? (isDark ? '#9BA1A6' : '#687076')
                            : (isDark ? '#F5F5F5' : '#11181C')
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
                          color: set.reps === 0 
                            ? (isDark ? '#9BA1A6' : '#687076')
                            : (isDark ? '#F5F5F5' : '#11181C')
                        }}
                      />
                    </View>
                    <View className="w-20 items-center">
                      <Pressable 
                        className={`w-12 h-9 rounded-2xl items-center justify-center ${isDark ? 'bg-card-dark' : 'bg-secondary'}`}
                        onPress={() => {
                          if (!rpeModal.isOpen && !isActionInProgressRef.current) {
                            isActionInProgressRef.current = true;
                            setRpeModal({ isOpen: true, exerciseId: exercise.id, setId: set.id });
                          }
                        }}
                      >
                        <Text className={`text-xs text-center ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                          {set.rpe !== null ? set.rpe : 'RPE'}
                        </Text>
                      </Pressable>
                    </View>
                    <View className="w-6 items-center">
                      <Pressable 
                        className={`w-8 h-9 rounded-2xl items-center justify-center ${set.completed ? 'bg-green-500' : (isDark ? 'bg-card-dark' : 'bg-secondary')}`}
                        onPress={() => toggleSetCompleted(exercise.id, set.id)}
                      >
                        {set.completed && <Check size={16} color="#FFFFFF" />}
                      </Pressable>
                    </View>
                  </View>
                ))}

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
                      <Text className={`flex-1 text-sm ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                        {muscle}
                      </Text>
                      <View className="flex-row items-center" style={{ width: 120 }}>
                        <View 
                          className={`h-2 rounded-full mr-2 ${isDark ? 'bg-muted-dark' : 'bg-muted'}`}
                          style={{ flex: 1 }}
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
    </SafeAreaView>
  );
}
