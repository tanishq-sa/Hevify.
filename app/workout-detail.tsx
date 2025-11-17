import { useColorScheme } from '@/hooks/use-color-scheme';
import { getWorkoutById } from '@/utils/workout-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, Lock, MessageCircle, MoreVertical, Share2, ThumbsUp } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Image,
    Pressable,
    ScrollView,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../global.css';

export default function WorkoutDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const params = useLocalSearchParams();
  const [workout, setWorkout] = useState<any>(null);

  useEffect(() => {
    loadWorkout();
  }, []);

  const loadWorkout = async () => {
    try {
      const workoutId = params.id as string;
      if (workoutId) {
        const foundWorkout = await getWorkoutById(workoutId);
        if (foundWorkout) {
          setWorkout(foundWorkout);
        }
      }
    } catch (error) {
      console.error('Error loading workout:', error);
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
    }) + ' - ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateMuscleDistribution = (exercises: any[]) => {
    const muscleGroups: { [key: string]: number } = {};
    let totalSets = 0;

    exercises.forEach((exercise) => {
      const completedSets = exercise.sets.filter((set: any) => set.completed).length;
      totalSets += completedSets;

      // Count primary muscle
      if (exercise.primaryMuscle) {
        muscleGroups[exercise.primaryMuscle] = (muscleGroups[exercise.primaryMuscle] || 0) + completedSets;
      }

      // Count secondary muscles (with less weight)
      if (exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0) {
        exercise.secondaryMuscles.forEach((muscle: string) => {
          muscleGroups[muscle] = (muscleGroups[muscle] || 0) + (completedSets * 0.5);
        });
      }
    });

    // Calculate percentages
    const distribution = Object.entries(muscleGroups)
      .map(([muscle, count]) => ({
        muscle,
        percentage: Math.round((count / totalSets) * 100)
      }))
      .sort((a, b) => b.percentage - a.percentage);

    return distribution;
  };

  const getSetTypeLabel = (setType?: string) => {
    switch (setType) {
      case 'W': return 'W';
      case 'F': return 'F';
      case 'D': return 'D';
      default: return null;
    }
  };

  if (!workout) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background'}`}>
        <View className="flex-1 items-center justify-center">
          <Text className={isDark ? 'text-foreground-dark' : 'text-foreground'}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const muscleDistribution = calculateMuscleDistribution(workout.exercises);

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background'}`}>
      {/* Header */}
      <View className={`flex-row items-center justify-between px-4 py-3 border-b ${isDark ? 'border-border-dark' : 'border-border'}`}>
        <Pressable onPress={() => router.back()}>
          <ChevronLeft size={24} color={isDark ? '#F5F5F5' : '#11181C'} />
        </Pressable>
        <Text className={`text-lg font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
          Workout Detail
        </Text>
        <Pressable>
          <MoreVertical size={24} color={isDark ? '#F5F5F5' : '#11181C'} />
        </Pressable>
      </View>

      <ScrollView className="flex-1">
        {/* User Info */}
        <View className="p-4">
          <View className="flex-row items-center mb-3">
            <Image
              source={{ uri: 'https://i.pravatar.cc/150?img=12' }}
              className="w-12 h-12 rounded-full mr-3"
            />
            <View className="flex-1">
              <Text className={`text-base font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                dazzelr
              </Text>
              <View className="flex-row items-center">
                <Text className={`text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                  {formatDate(workout.createdAt || workout.date)}
                </Text>
                {workout.visibility === 'Only me' && (
                  <>
                    <Text className={`text-sm mx-2 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>•</Text>
                    <Lock size={12} color={isDark ? '#9BA1A6' : '#687076'} />
                    <Text className={`text-sm ml-1 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                      Only you
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Title */}
          <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
            {workout.title}
          </Text>

          {/* Stats */}
          <View className="flex-row mb-4">
            <View className="flex-1">
              <Text className={`text-xs ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                Time
              </Text>
              <Text className={`text-lg font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                {formatDuration(workout.duration)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className={`text-xs ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                Volume
              </Text>
              <Text className={`text-lg font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                {workout.volume.toLocaleString()} kg
              </Text>
            </View>
            <View className="flex-1">
              <Text className={`text-xs ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                Sets
              </Text>
              <Text className={`text-lg font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                {workout.sets}
              </Text>
            </View>
            <View className="flex-1">
              <Text className={`text-xs ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                Records
              </Text>
              <View className="flex-row items-center">
                <Text className={`text-lg font-semibold mr-1 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                  🏅
                </Text>
                <Text className={`text-lg font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                  0
                </Text>
              </View>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row items-center gap-4 pt-3 border-t" style={{ borderTopColor: isDark ? '#27272A' : '#E4E4E7' }}>
            <Pressable className="flex-row items-center">
              <ThumbsUp size={20} color={isDark ? '#9BA1A6' : '#687076'} />
              <Text className={`ml-2 text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                0
              </Text>
            </Pressable>
            <Pressable className="flex-row items-center">
              <MessageCircle size={20} color={isDark ? '#9BA1A6' : '#687076'} />
              <Text className={`ml-2 text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                0
              </Text>
            </Pressable>
            <Pressable className="flex-row items-center">
              <Share2 size={20} color={isDark ? '#9BA1A6' : '#687076'} />
            </Pressable>
          </View>
        </View>

        {/* Muscle Split */}
        {muscleDistribution.length > 0 && (
          <View className="mt-4 p-4">
            <Text className={`text-base font-semibold mb-3 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              Muscle Split
            </Text>
            {muscleDistribution.map((item, index) => (
              <View key={index} className="mb-3">
                <Text className={`text-sm mb-1 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                  {item.muscle}
                </Text>
                <View className="flex-row items-center">
                  <View className={`h-2 rounded-full ${isDark ? 'bg-muted-dark' : 'bg-muted'}`} style={{ flex: 1 }}>
                    <View 
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: '#3B82F6'
                      }}
                    />
                  </View>
                  <Text className={`ml-2 text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                    {item.percentage}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Workout Exercises */}
        <View className="mt-4 p-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className={`text-base font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              Workout
            </Text>
            <Pressable>
              <Text className="text-base font-semibold" style={{ color: '#3B82F6' }}>
                Edit Workout
              </Text>
            </Pressable>
          </View>

          {workout.exercises.map((exercise: any, exerciseIndex: number) => (
            <View key={exerciseIndex} className="mb-6">
              {/* Exercise Header */}
              <View className="flex-row items-center mb-3">
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isDark ? 'bg-muted-dark' : 'bg-muted'}`}>
                  <Text className="text-lg">🏋️</Text>
                </View>
                <Text className={`text-base font-semibold ${isDark ? 'text-primary-dark' : 'text-primary'}`}>
                  {exercise.name}
                </Text>
              </View>

              {/* Sets Header */}
              <View className="flex-row px-2 mb-2">
                <Text className={`w-12 text-xs ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                  SET
                </Text>
                <Text className={`flex-1 text-xs ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                  {exercise.sets[0]?.weight !== undefined ? 'WEIGHT & REPS' : (exercise.sets[0]?.reps !== undefined ? 'REPS' : 'DURATION')}
                </Text>
              </View>

              {/* Sets */}
              {exercise.sets.map((set: any, setIndex: number) => {
                if (!set.completed) return null;
                
                const setTypeLabel = getSetTypeLabel(set.setType);
                const isEven = setIndex % 2 === 0;
                
                return (
                  <View 
                    key={setIndex} 
                    className={`flex-row items-center px-2 py-3 mb-1 ${isEven ? '' : (isDark ? 'bg-muted-dark/30' : 'bg-muted/30')}`}
                  >
                    <View className="w-12 flex-row items-center">
                      <Text className={`text-sm ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                        {setIndex + 1}
                      </Text>
                      {setTypeLabel && (
                        <Text className={`ml-1 text-xs font-semibold ${setTypeLabel === 'W' ? 'text-yellow-500' : 'text-orange-500'}`}>
                          {setTypeLabel}
                        </Text>
                      )}
                    </View>
                    <View className="flex-1">
                      {set.weight !== undefined && set.weight > 0 ? (
                        <Text className={`text-sm ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                          {set.weight}kg x {set.reps} reps
                          {set.rpe && (
                            <Text className={`text-xs ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                              {' '}@ {set.rpe} rpe
                            </Text>
                          )}
                        </Text>
                      ) : set.reps !== undefined && set.reps > 0 ? (
                        <Text className={`text-sm ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                          {set.reps} reps
                        </Text>
                      ) : (
                        <Text className={`text-sm ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                          {set.duration || 0}s
                        </Text>
                      )}
                    </View>
                    {/* Show badge for PR */}
                    {set.rpe && set.rpe >= 9 && (
                      <View className="ml-2">
                        <Text className="text-lg">🏅</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

