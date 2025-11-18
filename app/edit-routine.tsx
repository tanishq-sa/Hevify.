import { useColorScheme } from '@/hooks/use-color-scheme';
import { calculateRoutineDuration, calculateTotalSets, getPendingRoutineExercises, getRoutineById, Routine, RoutineExercise, RoutineSet, saveRoutine } from '@/utils/routine-storage';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronDown, Clock, Dumbbell, MoreVertical, Plus, X } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../global.css';

export default function EditRoutineScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const params = useLocalSearchParams();
  const routineId = params.id as string;

  const [routineName, setRoutineName] = useState('Monday');
  const [routineNotes, setRoutineNotes] = useState('');
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRoutine();
  }, [routineId]);

  // Handle exercises coming back from add-exercise screen
  useFocusEffect(
    useCallback(() => {
      const pendingExercises = getPendingRoutineExercises();
      if (pendingExercises.length > 0) {
        const newExercises: RoutineExercise[] = pendingExercises.map((ex: any) => ({
          id: ex.id,
          name: ex.name,
          equipment: ex.equipment,
          primaryMuscle: ex.primaryMuscle,
          secondaryMuscles: ex.secondaryMuscles,
          restTimer: 45, // Default rest timer
          notes: '',
          sets: [{
            id: Date.now().toString() + Math.random(),
            setNumber: '1',
            weight: ex.equipment === 'Bodyweight' ? undefined : 0,
            repRange: ex.equipment === 'Bodyweight' ? undefined : '8 to 12',
            reps: ex.equipment === 'Bodyweight' ? 0 : undefined,
          }],
        }));
        setExercises(prev => [...prev, ...newExercises]);
      }
    }, [])
  );

  const loadRoutine = async () => {
    try {
      if (routineId) {
        const routine = await getRoutineById(routineId);
        if (routine) {
          setRoutineName(routine.name);
          setRoutineNotes(routine.notes);
          setExercises(routine.exercises);
        }
      }
      setIsLoading(false);
    } catch (error) {
      console.error('Error loading routine:', error);
      setIsLoading(false);
    }
  };

  const handleUpdate = async () => {
    try {
      const routine: Routine = {
        id: routineId || Date.now().toString(),
        name: routineName,
        notes: routineNotes,
        exercises,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveRoutine(routine);
      router.back();
    } catch (error) {
      console.error('Error saving routine:', error);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const addExercise = () => {
    // Navigate to exercise selection
    router.push('/add-exercise-to-routine');
  };

  const removeExercise = (exerciseId: string) => {
    setExercises(prev => prev.filter(ex => ex.id !== exerciseId));
  };

  const addSet = (exerciseId: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        const isBodyweight = ex.equipment === 'Bodyweight';
        const newSet: RoutineSet = {
          id: Date.now().toString() + Math.random(),
          setNumber: (ex.sets.length + 1).toString(),
          ...(isBodyweight 
            ? { reps: 0 } 
            : { weight: 0, repRange: '8 to 12' }
          ),
        };
        return { ...ex, sets: [...ex.sets, newSet] };
      }
      return ex;
    }));
  };

  const removeSet = (exerciseId: string, setId: string) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        const filtered = ex.sets.filter(s => s.id !== setId);
        // Renumber sets
        return {
          ...ex,
          sets: filtered.map((set, index) => ({
            ...set,
            setNumber: (index + 1).toString(),
          })),
        };
      }
      return ex;
    }));
  };

  const updateSet = (exerciseId: string, setId: string, updates: Partial<RoutineSet>) => {
    setExercises(prev => prev.map(ex => {
      if (ex.id === exerciseId) {
        return {
          ...ex,
          sets: ex.sets.map(set => set.id === setId ? { ...set, ...updates } : set),
        };
      }
      return ex;
    }));
  };

  const updateExercise = (exerciseId: string, updates: Partial<RoutineExercise>) => {
    setExercises(prev => prev.map(ex => 
      ex.id === exerciseId ? { ...ex, ...updates } : ex
    ));
  };

  const estDuration = calculateRoutineDuration({ 
    id: '', 
    name: routineName, 
    notes: routineNotes, 
    exercises, 
    createdAt: '', 
    updatedAt: '' 
  });
  const totalExercises = exercises.length;
  const totalSets = calculateTotalSets({ 
    id: '', 
    name: routineName, 
    notes: routineNotes, 
    exercises, 
    createdAt: '', 
    updatedAt: '' 
  });

  if (isLoading) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background'}`}>
        <View className="flex-1 items-center justify-center">
          <Text className={isDark ? 'text-foreground-dark' : 'text-foreground'}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background'}`} edges={['top']}>
      {/* Header */}
      <View className={`flex-row items-center justify-between px-4 py-3 border-b ${isDark ? 'border-border-dark' : 'border-border'}`}>
        <Pressable onPress={handleCancel}>
          <Text className="text-blue-500 text-base">Cancel</Text>
        </Pressable>
        <Text className={`text-lg font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
          Edit Routine
        </Text>
        <Pressable
          onPress={handleUpdate}
          className="px-4 py-2 rounded-lg"
          style={{ backgroundColor: '#3B82F6' }}
        >
          <Text className="text-white font-semibold">Update</Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Routine Summary */}
        <View className="px-4 py-4 flex-row items-center justify-between">
          <View className="items-center">
            <Text className={`text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
              Est Duration
            </Text>
            <Text className={`text-lg font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              {estDuration}min
            </Text>
          </View>
          <View className="items-center">
            <Text className={`text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
              Exercises
            </Text>
            <Text className={`text-lg font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              {totalExercises}
            </Text>
          </View>
          <View className="items-center">
            <Text className={`text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
              Sets
            </Text>
            <Text className={`text-lg font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              {totalSets}
            </Text>
          </View>
        </View>

        {/* Day/Routine Name */}
        <View className={`px-4 py-3 border-b ${isDark ? 'border-border-dark' : 'border-border'}`}>
          <View className="flex-row items-center justify-between">
            <TextInput
              value={routineName}
              onChangeText={setRoutineName}
              className={`text-xl font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}
              placeholder="Routine name"
              placeholderTextColor={isDark ? '#666' : '#999'}
            />
            <Pressable>
              <X size={20} color={isDark ? '#F5F5F5' : '#11181C'} />
            </Pressable>
          </View>
        </View>

        {/* Routine Notes */}
        <View className="px-4 py-3">
          <View className={`flex-row items-center ${isDark ? 'bg-card-dark' : 'bg-card'} rounded-lg px-3 py-2`}>
            <TextInput
              value={routineNotes}
              onChangeText={setRoutineNotes}
              placeholder="Add routine notes here"
              placeholderTextColor={isDark ? '#666' : '#999'}
              className={`flex-1 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}
              multiline
            />
            <View className={`w-8 h-8 rounded-full ${isDark ? 'bg-muted-dark' : 'bg-muted'} items-center justify-center ml-2`}>
              <Plus size={16} color={isDark ? '#F5F5F5' : '#11181C'} />
            </View>
          </View>
        </View>

        {/* Exercises */}
        {exercises.map((exercise) => (
          <View key={exercise.id} className="px-4 mb-4">
            {/* Exercise Header */}
            <View className="flex-row items-center justify-between mb-3">
              <View className="flex-row items-center flex-1">
                <View className={`w-12 h-12 rounded-full ${isDark ? 'bg-muted-dark' : 'bg-muted'} items-center justify-center mr-3`}>
                  <Dumbbell size={20} color={isDark ? '#F5F5F5' : '#11181C'} />
                </View>
                <Pressable 
                  className="flex-1"
                  onPress={() => {
                    router.push({
                      pathname: '/exercise-detail',
                      params: {
                        name: exercise.name,
                        primaryMuscle: exercise.primaryMuscle || '',
                        secondaryMuscles: exercise.secondaryMuscles?.join(',') || '',
                      },
                    } as any);
                  }}
                >
                  <Text className={`text-base font-semibold ${isDark ? 'text-primary' : 'text-primary'}`}>
                    {exercise.name}
                  </Text>
                </Pressable>
              </View>
              <Pressable onPress={() => removeExercise(exercise.id)}>
                <MoreVertical size={20} color={isDark ? '#F5F5F5' : '#11181C'} />
              </Pressable>
            </View>

            {/* Exercise Notes */}
            <View className={`mb-3 ${isDark ? 'bg-background-dark' : 'bg-background'} rounded-lg px-3 py-2`}>
              <TextInput
                value={exercise.notes}
                onChangeText={(text) => updateExercise(exercise.id, { notes: text })}
                placeholder="Add exercise notes here"
                placeholderTextColor={isDark ? '#666' : '#999'}
                className={`${isDark ? 'text-foreground-dark' : 'text-foreground'}`}
                multiline
              />
            </View>

            {/* Rest Timer */}
            <View className="flex-row items-center mb-3">
              <Clock size={16} color="#3B82F6" />
              <Text className="text-blue-500 ml-2 text-sm">
                Rest Timer: {exercise.restTimer}s
              </Text>
            </View>

            {/* Sets Table */}
            <View className={`${isDark ? 'bg-background-dark' : 'bg-background'} rounded-lg overflow-hidden mb-3`}>
              {/* Table Header */}
              <View className={`flex-row ${isDark ? 'bg-background-dark' : 'bg-background'} px-3 py-2 border-b ${isDark ? 'border-border-dark' : 'border-border'}`}>
                <View className="flex-1">
                  <Text className={`text-xs font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                    SET
                  </Text>
                </View>
                {exercise.sets[0]?.weight !== undefined && (
                  <View className="flex-1">
                    <Text className={`text-xs font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                      KG
                    </Text>
                  </View>
                )}
                <View className="flex-1 flex-row items-center">
                  <Text className={`text-xs font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                    {exercise.sets[0]?.repRange ? 'REP RANGE' : 'REPS'}
                  </Text>
                  <ChevronDown size={12} color={isDark ? '#F5F5F5' : '#11181C'} />
                </View>
              </View>

              {/* Sets Rows */}
              {exercise.sets.map((set) => (
                <View key={set.id} className={`flex-row px-3 py-3 border-b ${isDark ? 'border-border-dark' : 'border-border'}`}>
                  <View className="flex-1">
                    <Text className={`${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                      {set.setNumber}
                    </Text>
                  </View>
                  {set.weight !== undefined && (
                    <View className="flex-1">
                      <TextInput
                        value={set.weight?.toString() || ''}
                        onChangeText={(text) => updateSet(exercise.id, set.id, { weight: parseFloat(text) || 0 })}
                        keyboardType="numeric"
                        className={`${isDark ? 'text-foreground-dark' : 'text-foreground'}`}
                        placeholder="0"
                        placeholderTextColor={isDark ? '#666' : '#999'}
                      />
                    </View>
                  )}
                  <View className="flex-1 flex-row items-center justify-between">
                    {set.repRange ? (
                      <TextInput
                        value={set.repRange}
                        onChangeText={(text) => updateSet(exercise.id, set.id, { repRange: text })}
                        className={`${isDark ? 'text-foreground-dark' : 'text-foreground'}`}
                        placeholder="8 to 12"
                        placeholderTextColor={isDark ? '#666' : '#999'}
                      />
                    ) : (
                      <TextInput
                        value={set.reps?.toString() || ''}
                        onChangeText={(text) => updateSet(exercise.id, set.id, { reps: parseInt(text) || 0 })}
                        keyboardType="numeric"
                        className={`${isDark ? 'text-foreground-dark' : 'text-foreground'}`}
                        placeholder="0"
                        placeholderTextColor={isDark ? '#666' : '#999'}
                      />
                    )}
                    <Pressable onPress={() => removeSet(exercise.id, set.id)}>
                      <X size={16} color={isDark ? '#F5F5F5' : '#11181C'} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>

            {/* Add Set Button */}
            <Pressable
              onPress={() => addSet(exercise.id)}
              className={`${isDark ? 'bg-primary-dark' : 'bg-primary'} rounded-lg py-3 items-center mb-4`}
            >
              <View className="flex-row items-center">
                <Plus size={16} color={isDark ? '#F5F5F5' : '#11181C'} />
                <Text className={`ml-2 font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                  Add Set
                </Text>
              </View>
            </Pressable>
          </View>
        ))}

        {/* Add Exercise Button */}
        <View className="px-4 mb-6">
          <Pressable
            onPress={addExercise}
            className={`${isDark ? 'bg-card-dark' : 'bg-card'} rounded-lg py-4 items-center`}
          >
            <View className="flex-row items-center">
              <Plus size={20} color={isDark ? '#F5F5F5' : '#11181C'} />
              <Text className={`ml-2 font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                Add Exercise
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

