import { auth } from '@/config/firebase';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { updateUserStats } from '@/utils/firestore-init';
import { clearWorkoutData as clearWorkout, loadWorkoutData as loadWorkout, saveCompletedWorkout } from '@/utils/workout-storage';
import { useRouter } from 'expo-router';
import { ChevronLeft, Lock, Users } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../global.css';

export default function SaveWorkoutScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  
  const [workoutTitle, setWorkoutTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'Everyone' | 'Private'>('Everyone');
  const [visibilityModal, setVisibilityModal] = useState(false);

  // Load workout data from storage
  const [workoutData, setWorkoutData] = useState<any>(null);

  React.useEffect(() => {
    loadWorkoutData();
  }, []);

  const loadWorkoutData = async () => {
    try {
      const data = await loadWorkout();
      setWorkoutData(data);
    } catch (error) {
      console.error('Error loading workout data:', error);
      // Set default empty workout data on error
      setWorkoutData({
        duration: 0,
        exercises: []
      });
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  const calculateTotalVolume = (exercises: any[]) => {
    let totalVolume = 0;
    exercises.forEach((exercise) => {
      exercise.sets.forEach((set: any) => {
        if (set.completed) {
          totalVolume += set.weight * set.reps;
        }
      });
    });
    return totalVolume;
  };

  const calculateTotalSets = (exercises: any[]) => {
    let totalSets = 0;
    exercises.forEach((exercise) => {
      totalSets += exercise.sets.filter((set: any) => set.completed).length;
    });
    return totalSets;
  };

  const handleSave = async () => {
    try {
      // Filter exercises to only include those with completed sets
      // And filter sets to only include completed ones
      const filteredExercises = (workoutData?.exercises || [])
        .map((exercise: any) => {
          // Filter to only completed sets
          const completedSets = (exercise.sets || []).filter((set: any) => set.completed);
          
          // Only include exercise if it has at least one completed set
          if (completedSets.length === 0) {
            return null;
          }
          
          return {
            ...exercise,
            sets: completedSets, // Only include completed sets
          };
        })
        .filter((exercise: any) => exercise !== null); // Remove exercises with no completed sets

      // Calculate stats from filtered exercises (only completed sets)
      const totalVolume = calculateTotalVolume(filteredExercises);
      const totalSets = calculateTotalSets(filteredExercises);

      // Create workout summary with only completed sets
      const workoutSummary = {
        title: workoutTitle || 'Workout title',
        description: description || '',
        duration: workoutData?.duration || 0,
        exercises: filteredExercises, // Only exercises with completed sets
        volume: totalVolume, // Only counts completed sets
        sets: totalSets, // Only counts completed sets
        visibility,
      };

      // Save to Firestore (only after clicking Save)
      await saveCompletedWorkout(workoutSummary);

      // Update user stats (only counts completed sets)
      if (auth.currentUser) {
        await updateUserStats(auth.currentUser.uid, {
          volume: totalVolume,
          sets: totalSets,
        });
      }
    } catch (error) {
      console.error('Error saving workout:', error);
      throw error; // Re-throw to prevent navigation if save fails
    } finally {
      // Always clear local workout data after save attempt
      // This ensures local storage and memory are cleared even if there's an error
      try {
        await clearWorkout();
        // Also clear component state to free memory
        setWorkoutData(null);
        setWorkoutTitle('');
        setDescription('');
        setVisibility('Everyone');
      } catch (clearError) {
        console.error('Error clearing workout data:', clearError);
      }
    }

    // Navigate to home only after successful save
    router.replace('/(tabs)');
  };

  const handleDiscard = async () => {
    try {
      await clearWorkout();
      // Clear component state to free memory
      setWorkoutData(null);
      setWorkoutTitle('');
      setDescription('');
      setVisibility('Everyone');
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error discarding workout:', error);
    }
  };

  if (!workoutData) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background'}`}>
        <View className="flex-1 items-center justify-center">
          <Text className={isDark ? 'text-foreground-dark' : 'text-foreground'}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const totalVolume = calculateTotalVolume(workoutData.exercises);
  const totalSets = calculateTotalSets(workoutData.exercises);

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background'}`}>
      {/* Header */}
      <View className={`flex-row items-center justify-between px-4 py-3 border-b ${isDark ? 'border-border-dark' : 'border-border'}`}>
        <Pressable onPress={() => router.back()}>
          <ChevronLeft size={24} color={isDark ? '#F5F5F5' : '#11181C'} />
        </Pressable>
        <Text className={`text-lg font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
          Save Workout
        </Text>
        <Pressable 
          className="px-6 py-3 rounded-xl"
          style={{
            backgroundColor: '#3B82F6',
          }}
          onPress={handleSave}
        >
          <Text className="font-semibold text-white text-base">
            Save
          </Text>
        </Pressable>
      </View>

      <ScrollView className="flex-1">
        {/* Workout Title */}
        <View className="px-4 py-4">
          <TextInput
            className={`text-2xl font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}
            placeholder="Workout title"
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            value={workoutTitle}
            onChangeText={setWorkoutTitle}
          />
        </View>

        {/* Stats */}
        <View className="flex-row px-4 py-4">
          <View className="flex-1">
            <Text className={`text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
              Duration
            </Text>
            <Text className={`text-xl font-semibold ${isDark ? 'text-primary-dark' : 'text-primary'}`}>
              {formatDuration(workoutData.duration)}
            </Text>
          </View>
          <View className="flex-1">
            <Text className={`text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
              Volume
            </Text>
            <Text className={`text-xl font-semibold ${isDark ? 'text-primary-dark' : 'text-primary'}`}>
              {totalVolume} kg
            </Text>
          </View>
          <View className="flex-1">
            <Text className={`text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
              Sets
            </Text>
            <Text className={`text-xl font-semibold ${isDark ? 'text-primary-dark' : 'text-primary'}`}>
              {totalSets}
            </Text>
          </View>
        </View>

        {/* When */}
        <View className={`px-4 py-4 border-t ${isDark ? 'border-border-dark' : 'border-border'}`}>
          <Text className={`text-sm mb-2 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
            When
          </Text>
          <Text className={`text-base ${isDark ? 'text-primary-dark' : 'text-primary'}`}>
            {new Date().toLocaleDateString('en-US', { 
              day: '2-digit', 
              month: 'short', 
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}
          </Text>
        </View>

        {/* Add Photo/Video */}
        <Pressable className={`mx-4 my-4 p-6 border-2 border-dashed rounded-xl flex-row items-center justify-center ${isDark ? 'border-border-dark' : 'border-border'}`}>
          <View className={`w-12 h-12 rounded ${isDark ? 'bg-muted-dark' : 'bg-muted'} items-center justify-center mr-3`}>
            <Text className="text-2xl">📷</Text>
          </View>
          <Text className={`text-base ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
            Add a photo / video
          </Text>
        </Pressable>

        {/* Description */}
        <View className={`px-4 py-4 border-t ${isDark ? 'border-border-dark' : 'border-border'}`}>
          <Text className={`text-sm mb-2 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
            Description
          </Text>
          <TextInput
            className={`text-base ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}
            placeholder="How did your workout go? Leave some notes here..."
            placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        {/* Visibility */}
        <Pressable 
          className={`px-4 py-4 flex-row items-center justify-between border-t ${isDark ? 'border-border-dark' : 'border-border'}`}
          onPress={() => setVisibilityModal(true)}
        >
          <View className="flex-row items-center">
            {visibility === 'Private' ? (
              <Lock size={20} color={isDark ? '#F5F5F5' : '#11181C'} style={{ marginRight: 8 }} />
            ) : (
              <Users size={20} color={isDark ? '#F5F5F5' : '#11181C'} style={{ marginRight: 8 }} />
            )}
            <Text className={`text-base ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              Visibility
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className={`text-base mr-2 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              {visibility}
            </Text>
            <Text className={`text-base ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
              →
            </Text>
          </View>
        </Pressable>

        {/* Visibility Modal */}
        <Modal
          visible={visibilityModal}
          transparent
          animationType="slide"
          onRequestClose={() => setVisibilityModal(false)}
        >
          <View className="flex-1 justify-end bg-black/50">
            <Pressable 
              className="flex-1"
              onPress={() => setVisibilityModal(false)}
            />
            <View className={`${isDark ? 'bg-card-dark' : 'bg-card'} rounded-t-3xl p-6 pb-8`}>
              {/* Drag Handle */}
              <View className="items-center mb-4">
                <View className={`w-12 h-1 rounded-full ${isDark ? 'bg-muted-foreground-dark' : 'bg-muted-foreground'}`} />
              </View>

              {/* Header */}
              <Text className={`text-xl font-bold mb-6 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                Visibility
              </Text>

              {/* Everyone Option */}
              <Pressable
                className={`flex-row items-center py-4 px-4 mb-2 rounded-lg ${
                  visibility === 'Everyone' 
                    ? (isDark ? 'bg-primary-dark' : 'bg-primary') 
                    : (isDark ? 'bg-muted-dark' : 'bg-muted')
                }`}
                onPress={() => {
                  setVisibility('Everyone');
                  setVisibilityModal(false);
                }}
              >
                <Users 
                  size={24} 
                  color={visibility === 'Everyone' 
                    ? '#FFFFFF' 
                    : (isDark ? '#F5F5F5' : '#11181C')
                  } 
                />
                <View className="ml-4 flex-1">
                  <Text className={`text-base font-semibold ${
                    visibility === 'Everyone' 
                      ? 'text-white' 
                      : (isDark ? 'text-foreground-dark' : 'text-foreground')
                  }`}>
                    Everyone
                  </Text>
                  <Text className={`text-sm mt-1 ${
                    visibility === 'Everyone' 
                      ? 'text-white/80' 
                      : (isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground')
                  }`}>
                    Anyone can see this workout
                  </Text>
                </View>
                {visibility === 'Everyone' && (
                  <View className="w-6 h-6 rounded-full bg-white items-center justify-center">
                    <View className="w-3 h-3 rounded-full bg-primary" />
                  </View>
                )}
              </Pressable>

              {/* Private Option */}
              <Pressable
                className={`flex-row items-center py-4 px-4 rounded-lg ${
                  visibility === 'Private' 
                    ? (isDark ? 'bg-primary-dark' : 'bg-primary') 
                    : (isDark ? 'bg-muted-dark' : 'bg-muted')
                }`}
                onPress={() => {
                  setVisibility('Private');
                  setVisibilityModal(false);
                }}
              >
                <Lock 
                  size={24} 
                  color={visibility === 'Private' 
                    ? '#FFFFFF' 
                    : (isDark ? '#F5F5F5' : '#11181C')
                  } 
                />
                <View className="ml-4 flex-1">
                  <Text className={`text-base font-semibold ${
                    visibility === 'Private' 
                      ? 'text-white' 
                      : (isDark ? 'text-foreground-dark' : 'text-foreground')
                  }`}>
                    Private
                  </Text>
                  <Text className={`text-sm mt-1 ${
                    visibility === 'Private' 
                      ? 'text-white/80' 
                      : (isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground')
                  }`}>
                    Only you can see this workout
                  </Text>
                </View>
                {visibility === 'Private' && (
                  <View className="w-6 h-6 rounded-full bg-white items-center justify-center">
                    <View className="w-3 h-3 rounded-full bg-primary" />
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Discard Workout */}
        <Pressable 
          className="mx-4 my-6 py-4 items-center"
          onPress={handleDiscard}
        >
          <Text className="text-base font-semibold text-red-500">
            Discard Workout
          </Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

