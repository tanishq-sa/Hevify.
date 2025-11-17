import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { ChevronLeft, Clock, Dumbbell, Plus, Settings, X } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../global.css';

export default function LogWorkoutScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [duration, setDuration] = useState(0); // Duration in seconds

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

  // Start timer when component mounts
  useEffect(() => {
    const interval = setInterval(() => {
      setDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
        <View className="flex-row items-center">
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
              0 kg
            </Text>
          </View>
          <View className="flex-row items-center">
            <View>
              <Text className={`text-xs ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                Sets
              </Text>
              <Text className={`text-base font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                0
              </Text>
            </View>
            <View className="flex-row ml-3">
              <View className={`w-6 h-6 rounded-full ${isDark ? 'bg-muted-dark' : 'bg-muted'} mr-1`} />
              <View className={`w-5 h-5 rounded-full ${isDark ? 'bg-muted-dark' : 'bg-muted'}`} />
            </View>
          </View>
        </View>
      </View>

      {/* Empty State */}
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
        >
          <View className="mr-2">
            <Plus size={20} color={isDark ? '#0A0A0A' : '#FFFFFF'} />
          </View>
          <Text className={`text-lg font-semibold ${isDark ? 'text-primary-foreground-dark' : 'text-primary-foreground'}`}>
            Add Exercise
          </Text>
        </Pressable>

        {/* Bottom Buttons */}
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
    </SafeAreaView>
  );
}

