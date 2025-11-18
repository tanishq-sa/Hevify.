import { useColorScheme } from '@/hooks/use-color-scheme';
import { deleteRoutine, getAllRoutines, Routine, RoutineExercise } from '@/utils/routine-storage';
import { clearWorkoutData, hasWorkoutInProgress, setPendingExercises } from '@/utils/workout-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { MoreVertical, NotepadText, PlusIcon, Share2, Trash2 } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../../global.css';


export default function TabTwoScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [hasWorkout, setHasWorkout] = useState(false);
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [routineMenuModal, setRoutineMenuModal] = useState<{ isOpen: boolean; routineId: string | null }>({
    isOpen: false,
    routineId: null,
  });
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ isOpen: boolean; routineId: string | null; routineName: string }>({
    isOpen: false,
    routineId: null,
    routineName: '',
  });

  useEffect(() => {
    const checkWorkout = async () => {
      const inProgress = await hasWorkoutInProgress();
      setHasWorkout(inProgress);
    };
    checkWorkout();
  }, []);

  const loadRoutines = useCallback(async () => {
    try {
      const allRoutines = await getAllRoutines();
      setRoutines(allRoutines);
    } catch (error) {
      console.error('Error loading routines:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRoutines();
    }, [loadRoutines])
  );

  const handleStartWorkout = async () => {
    const inProgress = await hasWorkoutInProgress();
    if (inProgress) {
      setShowWorkoutModal(true);
    } else {
      router.push('/log-workout' as any);
    }
  };

  const handleCancel = () => {
    setShowWorkoutModal(false);
  };

  const convertRoutineToWorkoutExercises = (routineExercises: RoutineExercise[]) => {
    return routineExercises.map((ex) => ({
      id: ex.id,
      name: ex.name,
      primaryMuscle: ex.primaryMuscle || '',
      secondaryMuscles: ex.secondaryMuscles || [],
      notes: ex.notes || '',
      restTimer: ex.restTimer || 45,
      routineSets: ex.sets || [], // Pass routine sets data
    }));
  };

  const handleStartRoutine = async (routine: Routine) => {
    const inProgress = await hasWorkoutInProgress();
    if (inProgress) {
      setShowWorkoutModal(true);
      // Store the routine to start after user confirms
      (window as any).pendingRoutine = routine;
    } else {
      // Convert routine exercises to workout format
      const workoutExercises = convertRoutineToWorkoutExercises(routine.exercises);
      setPendingExercises(workoutExercises);
      router.push('/log-workout' as any);
    }
  };

  const handleResumeWorkout = () => {
    setShowWorkoutModal(false);
    (window as any).pendingRoutine = null;
    router.push('/log-workout' as any);
  };

  const handleStartNewWorkout = async () => {
    await clearWorkoutData();
    setShowWorkoutModal(false);
    (window as any).pendingRoutine = null;
    router.push('/log-workout' as any);
  };

  const handleStartNewWorkoutFromRoutine = async () => {
    const routine = (window as any).pendingRoutine as Routine | undefined;
    await clearWorkoutData();
    setShowWorkoutModal(false);
    
    if (routine) {
      // Convert routine exercises to workout format
      const workoutExercises = convertRoutineToWorkoutExercises(routine.exercises);
      setPendingExercises(workoutExercises);
      (window as any).pendingRoutine = null;
    }
    
    router.push('/log-workout' as any);
  };

  const getSetTypeLabel = (setType?: string) => {
    switch (setType) {
      case 'W': return 'Warm-up';
      case 'F': return 'Failure';
      case 'D': return 'Drop';
      default: return null;
    }
  };

  const formatDateForShare = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    
    return `${dayName}, ${month} ${day}, ${year} at ${hours}:${minutesStr}${ampm}`;
  };

  const formatRoutineForShare = (routine: Routine) => {
    let shareText = `${routine.name}\n\n`;
    
    if (routine.createdAt) {
      shareText += `${formatDateForShare(routine.createdAt)}\n\n\n`;
    } else if (routine.notes) {
      shareText += `${routine.notes}\n\n`;
    }
    
    if (routine.exercises.length === 0) {
      shareText += 'No exercises added yet';
      return shareText;
    }
    
    routine.exercises.forEach((exercise) => {
      shareText += `${exercise.name}\n\n`;
      
      if (exercise.sets && exercise.sets.length > 0) {
        let setNumber = 1;
        exercise.sets.forEach((set) => {
          shareText += `Set ${setNumber}: `;
          
          if (set.weight !== undefined && set.weight > 0) {
            shareText += `${set.weight} kg`;
            if (set.repRange) {
              shareText += ` x ${set.repRange}`;
            } else if (set.reps !== undefined && set.reps > 0) {
              shareText += ` x ${set.reps}`;
            }
          } else if (set.repRange) {
            shareText += set.repRange;
          } else if (set.reps !== undefined && set.reps > 0) {
            shareText += `${set.reps} reps`;
          } else {
            shareText += 'Not set';
          }
          
          const setTypeLabel = getSetTypeLabel((set as any).setType);
          if (setTypeLabel) {
            shareText += ` [${setTypeLabel}]`;
          }
          
          shareText += '\n';
          setNumber++;
        });
      } else {
        shareText += 'No sets added\n';
      }
      
      shareText += '\n';
    });
    
    return shareText;
  };

  const handleShareRoutine = async (routine: Routine) => {
    try {
      const shareText = formatRoutineForShare(routine);
      
      if (!shareText || shareText.trim() === '') {
        console.error('Share text is empty');
        return;
      }
      
      await Share.share({
        message: shareText,
        ...(Platform.OS === 'android' && { title: routine.name }),
      });
      setRoutineMenuModal({ isOpen: false, routineId: null });
    } catch (error) {
      console.error('Error sharing routine:', error);
    }
  };

  const handleDeleteRoutine = async (routineId: string) => {
    try {
      await deleteRoutine(routineId);
      setDeleteConfirmModal({ isOpen: false, routineId: null, routineName: '' });
      loadRoutines(); // Reload routines after deletion
    } catch (error) {
      console.error('Error deleting routine:', error);
    }
  };

 
  return (
    <SafeAreaView 
      className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background'}`} 
      edges={['top', 'left', 'right']}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className={`text-2xl font-bold text-center w-full ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
            Workout
          </Text>
        </View>

        <View className="px-4 mb-6">
          <Text className={`text-lg font-semibold mb-3 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
            Quick Start
          </Text>
          <Pressable 
            className={`${isDark ? 'bg-card-dark' : 'bg-card'} rounded-lg p-4 flex-row items-center`}
            onPress={handleStartWorkout}
          >
            <View className={`w-8 h-8 rounded-full ${isDark ? 'bg-muted-dark' : 'bg-muted'} items-center justify-center mr-3`}>
              <PlusIcon 
                color={isDark ? '#F5F5F5' : '#11181C'} 
              />
            </View>
            <Text className={`${isDark ? 'text-foreground-dark' : 'text-foreground'} text-base`}>
              Start Empty Workout
            </Text>
          </Pressable>
        </View>

        <View className="px-4 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className={`text-lg font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              Routines
            </Text>
            <Pressable 
              className={`w-8 h-8 rounded ${isDark ? 'bg-card-dark' : 'bg-card'} items-center justify-center`}
              onPress={() => router.push('/new-routine' as any)}
            >
              <Text className={`${isDark ? 'text-foreground-dark' : 'text-foreground'} text-xl font-bold`}>+</Text>
            </Pressable>
          </View>
          
          <View className="flex-row gap-3 mb-4">
            <Pressable 
              className={`flex-1 ${isDark ? 'bg-card-dark' : 'bg-card'} rounded-lg p-4 flex-row items-center`}
              onPress={() => router.push('/new-routine' as any)}
            >
              <View className={`w-8 h-8 rounded ${isDark ? 'bg-muted-dark' : 'bg-muted'} items-center justify-center mr-3`}>
                <NotepadText 
                  color={isDark ? '#F5F5F5' : '#11181C'} 
                />
              </View>
              <Text className={`${isDark ? 'text-foreground-dark' : 'text-foreground'} text-sm`}>
                New Routine
              </Text>
            </Pressable>
          </View>

          {/* My Routines Collapsible */}
          <Pressable className="flex-row items-center justify-between mb-3">
            <Text className={`text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              My Routines ({routines.length})
            </Text>
            <Text className={isDark ? 'text-gray-400' : 'text-gray-600'}>▼</Text>
          </Pressable>

          {routines.length > 0 && routines.map((routine) => (
            <View key={routine.id} className={`${isDark ? 'bg-card-dark' : 'bg-card'} rounded-lg p-4 mb-3`}>
              <Pressable 
                onPress={() => router.push({ pathname: '/edit-routine', params: { id: routine.id } } as any)}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text className={`text-lg font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                    {routine.name}
                  </Text>
                  <Pressable 
                    onPress={(e) => {
                      e.stopPropagation();
                      setRoutineMenuModal({ isOpen: true, routineId: routine.id });
                    }}
                  >
                    <MoreVertical size={20} color={isDark ? '#9BA1A6' : '#687076'} />
                  </Pressable>
                </View>
                <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mb-4`} numberOfLines={2}>
                  {routine.exercises.length > 0 
                    ? routine.exercises.map((exercise) => exercise.name).join(', ')
                    : routine.notes || 'No exercises added yet'
                  }
                </Text>
              </Pressable>
              <Pressable 
                className="bg-blue-500 dark:bg-blue-600 rounded-lg py-3 items-center"
                onPress={() => handleStartRoutine(routine)}
              >
                <Text className="text-white font-semibold">Start Routine</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Workout in Progress Modal */}
      <Modal
        visible={showWorkoutModal}
        transparent
        animationType="fade"
        onRequestClose={handleCancel}
      >
        <View className="flex-1 items-center justify-center bg-black/50">
          <View className={`mx-4 rounded-2xl p-6 w-11/12 ${isDark ? 'bg-card-dark' : 'bg-card'}`}>
            <Text className={`text-xl font-bold mb-2 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              You have a workout in progress
            </Text>
            <Text className={`text-base mb-6 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
              If you start a new workout, your old workout will be permanently deleted.
            </Text>

            <Pressable
              className={`py-4 rounded-lg mb-3 ${isDark ? 'bg-primary-dark' : 'bg-primary'}`}
              onPress={handleResumeWorkout}
            >
              <Text className={`text-center font-semibold text-white`}>
                Resume workout in progress
              </Text>
            </Pressable>

            <Pressable
              className={`py-4 rounded-lg bg-destructive`}
              onPress={() => {
                const routine = (window as any).pendingRoutine;
                if (routine) {
                  handleStartNewWorkoutFromRoutine();
                } else {
                  handleStartNewWorkout();
                }
              }}
            >
              <Text className={`text-center font-semibold text-white`}>
                Start new workout
              </Text>
            </Pressable>

            {/* Cancel Button */}
            <Pressable
              className={`py-4 rounded-lg ${isDark ? 'bg-card-dark' : 'bg-card'}`}
              onPress={handleCancel}
            >
              <Text className={`text-center font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                Cancel
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Routine Menu Modal */}
      <Modal
        visible={routineMenuModal.isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setRoutineMenuModal({ isOpen: false, routineId: null })}
      >
        <View className="flex-1 justify-end bg-black/50">
          <Pressable 
            className="flex-1"
            onPress={() => setRoutineMenuModal({ isOpen: false, routineId: null })}
          />
          <View className={`${isDark ? 'bg-card-dark' : 'bg-card'} rounded-t-3xl p-6 pb-8`}>
            {/* Drag Handle */}
            <View className="items-center mb-4">
              <View className={`w-12 h-1 rounded-full ${isDark ? 'bg-muted-foreground-dark' : 'bg-muted-foreground'}`} />
            </View>

            {routineMenuModal.routineId && (() => {
              const routine = routines.find(r => r.id === routineMenuModal.routineId);
              if (!routine) return null;

              return (
                <>
                  <Text className={`text-xl font-bold mb-6 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                    {routine.name}
                  </Text>

                  <Pressable
                    className="flex-row items-center py-4 px-4 mb-2"
                    onPress={() => handleShareRoutine(routine)}
                  >
                    <Share2 size={24} color={isDark ? '#F5F5F5' : '#11181C'} />
                    <Text className={`ml-4 text-base ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                      Share Routine
                    </Text>
                  </Pressable>

                  <Pressable
                    className="flex-row items-center py-4 px-4"
                    onPress={() => {
                      setRoutineMenuModal({ isOpen: false, routineId: null });
                      setDeleteConfirmModal({ 
                        isOpen: true, 
                        routineId: routine.id, 
                        routineName: routine.name 
                      });
                    }}
                  >
                    <Trash2 size={24} color="#EF4444" />
                    <Text className="ml-4 text-base text-destructive">
                      Remove Routine
                    </Text>
                  </Pressable>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={deleteConfirmModal.isOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmModal({ isOpen: false, routineId: null, routineName: '' })}
      >
        <Pressable
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onPress={() => setDeleteConfirmModal({ isOpen: false, routineId: null, routineName: '' })}
        >
          <Pressable
            className={`rounded-2xl p-6 w-11/12 max-w-sm ${
              isDark ? 'bg-card-dark' : 'bg-card'
            }`}
            onPress={(e) => e.stopPropagation()}
          >
            <Text
              className={`text-xl font-bold mb-2 ${
                isDark ? 'text-foreground-dark' : 'text-foreground'
              }`}
            >
              Remove Routine
            </Text>
            <Text
              className={`text-base mb-6 ${
                isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'
              }`}
            >
              Are you sure you want to remove "{deleteConfirmModal.routineName}"? This action cannot be undone.
            </Text>
            
            <View className="flex-row gap-3">
              <Pressable
                className={`flex-1 py-3 rounded-lg items-center ${
                  isDark ? 'bg-muted-dark' : 'bg-muted'
                }`}
                onPress={() => setDeleteConfirmModal({ isOpen: false, routineId: null, routineName: '' })}
              >
                <Text
                  className={`font-semibold ${
                    isDark ? 'text-foreground-dark' : 'text-foreground'
                  }`}
                >
                  Cancel
                </Text>
              </Pressable>
              
              <Pressable
                className="flex-1 py-3 rounded-lg items-center bg-destructive active:opacity-90"
                onPress={() => {
                  if (deleteConfirmModal.routineId) {
                    handleDeleteRoutine(deleteConfirmModal.routineId);
                  }
                }}
              >
                <Text className="text-white font-semibold">
                  Remove
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
