import { useColorScheme } from '@/hooks/use-color-scheme';
import { calculateRoutineDuration, calculateTotalSets, getPendingRoutineExercises, Routine, RoutineExercise, RoutineSet, saveRoutine } from '@/utils/routine-storage';
import { REST_TIMER_OPTIONS } from '@/utils/workout-constants';
import { useFocusEffect, useRouter } from 'expo-router';
import { ChevronDown, Clock, Dumbbell, MoreVertical, Plus, Settings, X } from 'lucide-react-native';
import { useCallback, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../global.css';

export default function NewRoutineScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();

  const [routineName, setRoutineName] = useState('');
  const [routineNotes, setRoutineNotes] = useState('');
  const [exercises, setExercises] = useState<RoutineExercise[]>([]);
  const [restTimerModal, setRestTimerModal] = useState<{ isOpen: boolean; exerciseId: string | null }>({
    isOpen: false,
    exerciseId: null,
  });

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

  const handleSave = async () => {
    try {
      if (!routineName.trim()) {
        // Show error or use default name
        setRoutineName('New Routine');
      }
      
      const routine: Routine = {
        id: Date.now().toString(),
        name: routineName.trim() || 'New Routine',
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

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background'}`} edges={['top']}>
      {/* Header */}
      <View className={`flex-row items-center justify-between px-4 py-3 border-b ${isDark ? 'border-border-dark' : 'border-border'}`}>
        <Pressable onPress={handleCancel}>
          <Text className="text-blue-500 text-base">Cancel</Text>
        </Pressable>
        <Text className={`text-lg font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
          New Routine
        </Text>
        <Pressable
          onPress={handleSave}
          className="px-4 py-2 rounded-lg"
          style={{ backgroundColor: '#3B82F6' }}
        >
          <Text className="text-white font-semibold">Save</Text>
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
              className={`text-xl font-semibold flex-1 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}
              placeholder="Routine name"
              placeholderTextColor={isDark ? '#666' : '#999'}
            />
            {routineName.length > 0 && (
              <Pressable onPress={() => setRoutineName('')}>
                <X size={20} color={isDark ? '#F5F5F5' : '#11181C'} />
              </Pressable>
            )}
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
                placeholder="Add Exercise notes here"
                placeholderTextColor={isDark ? '#666' : '#999'}
                className={`${isDark ? 'text-foreground-dark' : 'text-foreground'}`}
                multiline
              />
            </View>

            {/* Rest Timer */}
            <Pressable
              className="flex-row items-center mb-3"
              onPress={() => {
                setRestTimerModal({ isOpen: true, exerciseId: exercise.id });
              }}
            >
              <Clock size={16} color={isDark ? '#60A5FA' : '#3B82F6'} />
              <Text className={`text-sm ml-2 ${isDark ? 'text-primary-dark' : 'text-primary'}`}>
                Rest Timer: {formatRestTimer(exercise.restTimer)}
              </Text>
            </Pressable>

            {/* Sets Table */}
            <View className={`${isDark ? 'bg-background-dark' : 'bg-background'} rounded-lg overflow-hidden mb-3`}>
              {/* Table Header */}
              <View className={`flex-row ${isDark ? 'bg-background-dark' : 'bg-background'} px-3 py-2 ${isDark ? 'border-border-dark' : 'border-border'}`}>
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
              {exercise.sets.map((set, index) => (
                <View key={set.id} className={`flex-row px-3 py-3 ${index % 2 === 1 ? (isDark ? 'bg-card-dark' : 'bg-card') : ''}`}>
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
                        style={{
                          color: set.weight && set.weight > 0
                            ? (isDark ? '#F5F5F5' : '#11181C')
                            : (isDark ? '#9BA1A6' : '#9CA3AF')
                        }}
                        placeholder="0"
                        placeholderTextColor={isDark ? '#666' : '#999'}
                      />
                    </View>
                  )}
                  <View className="flex-1 flex-row items-center justify-between">
                    {set.repRange !== undefined ? (
                      <TextInput
                        value={set.repRange === '8 to 12' ? '' : set.repRange}
                        onChangeText={(text) => {
                          // Update with user input
                          updateSet(exercise.id, set.id, { repRange: text });
                        }}
                        onFocus={() => {
                          // Clear the default value when user focuses on the field
                          if (set.repRange === '8 to 12') {
                            updateSet(exercise.id, set.id, { repRange: '' });
                          }
                        }}
                        onBlur={() => {
                          // If field is empty on blur, set back to default
                          const currentSet = exercises.find(ex => ex.id === exercise.id)?.sets.find(s => s.id === set.id);
                          if (!currentSet?.repRange || currentSet.repRange.trim() === '') {
                            updateSet(exercise.id, set.id, { repRange: '8 to 12' });
                          }
                        }}
                        style={{
                          color: set.repRange && set.repRange.trim() !== '' && set.repRange !== '8 to 12'
                            ? (isDark ? '#F5F5F5' : '#11181C')
                            : (isDark ? '#9BA1A6' : '#9CA3AF')
                        }}
                        placeholder="8 to 12"
                        placeholderTextColor={isDark ? '#9BA1A6' : '#9CA3AF'}
                      />
                    ) : (
                      <TextInput
                        value={set.reps?.toString() || ''}
                        onChangeText={(text) => updateSet(exercise.id, set.id, { reps: parseInt(text) || 0 })}
                        keyboardType="numeric"
                        style={{
                          color: set.reps && set.reps > 0
                            ? (isDark ? '#F5F5F5' : '#11181C')
                            : (isDark ? '#9BA1A6' : '#9CA3AF')
                        }}
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
              className={`${isDark ? 'bg-blue-500 ' : 'bg-blue-500'} rounded-lg py-3 items-center mb-4`}
            >
              <View className="flex-row items-center">
                <Plus size={16} color={isDark ? '#FFFFFF' : '#FFFFFF'} />
                <Text className={`ml-2 font-semibold ${isDark ? 'text-white' : 'text-white'}`}>
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

      {/* Rest Timer Modal */}
      <Modal
        visible={restTimerModal.isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setRestTimerModal({ isOpen: false, exerciseId: null });
        }}
      >
        <View className="flex-1 justify-end bg-black/50">
          <Pressable 
            className="flex-1"
            onPress={() => {
              setRestTimerModal({ isOpen: false, exerciseId: null });
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
              
              const restTimerOptions = REST_TIMER_OPTIONS;
              
              return (
                <>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className={`text-xl font-bold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                      Rest Timer
                    </Text>
                    <Pressable onPress={() => {
                      setRestTimerModal({ isOpen: false, exerciseId: null });
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
                            updateExercise(exercise.id, { restTimer: seconds });
                            setRestTimerModal({ isOpen: false, exerciseId: null });
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
    </SafeAreaView>
  );
}

