import { useColorScheme } from '@/hooks/use-color-scheme';
import { clearWorkoutData, hasWorkoutInProgress } from '@/utils/workout-storage';
import { useRouter } from 'expo-router';
import { NotepadText, PlusIcon } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../../global.css';

export default function TabTwoScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [showWorkoutModal, setShowWorkoutModal] = useState(false);
  const [hasWorkout, setHasWorkout] = useState(false);

  useEffect(() => {
    const checkWorkout = async () => {
      const inProgress = await hasWorkoutInProgress();
      setHasWorkout(inProgress);
    };
    checkWorkout();
  }, []);

  const handleStartWorkout = async () => {
    const inProgress = await hasWorkoutInProgress();
    if (inProgress) {
      setShowWorkoutModal(true);
    } else {
      router.push('/log-workout' as any);
    }
  };

  const handleResumeWorkout = () => {
    setShowWorkoutModal(false);
    router.push('/log-workout' as any);
  };

  const handleStartNewWorkout = async () => {
    await clearWorkoutData();
    setShowWorkoutModal(false);
    router.push('/log-workout' as any);
  };

  const handleCancel = () => {
    setShowWorkoutModal(false);
  };

  const routines = [
    {
      Name: 'Chest Day',
      Exercises: 'lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos. Lorem ipsum dolor sit amet consectetur adipisicing elit'
    },
    {
      Name: 'Back Day',
      Exercises: 'Lorem Ispum',
    }
  ];

  const count = routines.length ?? 0;

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
            <Pressable className={`w-8 h-8 rounded ${isDark ? 'bg-card-dark' : 'bg-card'} items-center justify-center`}>
              <Text className={`${isDark ? 'text-foreground-dark' : 'text-foreground'} text-xl font-bold`}>+</Text>
            </Pressable>
          </View>
          
          <View className="flex-row gap-3 mb-4">
            <Pressable className={`flex-1 ${isDark ? 'bg-card-dark' : 'bg-card'} rounded-lg p-4 flex-row items-center`}>
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
              My Routines ({count})
            </Text>
            <Text className={isDark ? 'text-gray-400' : 'text-gray-600'}>▼</Text>
          </Pressable>

          {routines.map((routine, index) => (
            <View key={index} className={`${isDark ? 'bg-card-dark' : 'bg-card'} rounded-lg p-4 mb-3`}>
              <View className="flex-row items-center justify-between mb-2">
                <Text className={`text-lg font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                  {routine.Name}
                </Text>
                <Pressable>
                  <Text className={isDark ? 'text-gray-400' : 'text-gray-600'} style={{ fontSize: 20 }}>
                    ⋯
                  </Text>
                </Pressable>
              </View>
              <Text className={`${isDark ? 'text-gray-400' : 'text-gray-600'} text-sm mb-4`} numberOfLines={2}>
                {routine.Exercises}
              </Text>
              <Pressable className="bg-blue-500 dark:bg-blue-600 rounded-lg py-3 items-center">
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
              <Text className={`text-center font-semibold ${isDark ? 'text-primary-foreground-dark' : 'text-primary-foreground'}`}>
                Resume workout in progress
              </Text>
            </Pressable>

            <Pressable
              className={`py-4 rounded-lg bg-destructive`}
              onPress={handleStartNewWorkout}
            >
              <Text className={`text-center font-semibold ${isDark ? 'text-foreground' : 'text-foreground-dark'}`}>
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
    </SafeAreaView>
  );
}
