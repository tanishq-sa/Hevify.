import { useColorScheme } from '@/hooks/use-color-scheme';
import { clearWorkoutData, hasWorkoutInProgress, loadWorkoutData } from '@/utils/workout-storage';
import { useRouter, useSegments } from 'expo-router';
import { Play, X } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import '../global.css';

export function WorkoutOverlay() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const segments = useSegments();
  const [isWorkoutActive, setIsWorkoutActive] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showDiscardModal, setShowDiscardModal] = useState(false);

  // Hide overlay when on log-workout screen
  const isOnWorkoutScreen = segments.some(segment => segment === 'log-workout');

  const checkWorkoutStatus = useCallback(async () => {
    try {
      const hasWorkout = await hasWorkoutInProgress();
      setIsWorkoutActive(hasWorkout);
      
      if (hasWorkout) {
        const { duration: savedDuration } = await loadWorkoutData();
        setDuration(savedDuration);
      } else {
        setDuration(0);
      }
    } catch (error) {
      console.error('Error checking workout status:', error);
      setIsWorkoutActive(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkWorkoutStatus();
    
    // Check every 5 seconds for workout status changes
    const interval = setInterval(checkWorkoutStatus, 5000);
    
    return () => clearInterval(interval);
  }, [checkWorkoutStatus]);

  // Also check when component comes into focus
  useEffect(() => {
    const focusInterval = setInterval(checkWorkoutStatus, 1000);
    return () => clearInterval(focusInterval);
  }, [checkWorkoutStatus]);

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResume = () => {
    router.push('/log-workout');
  };

  const handleDiscard = () => {
    setShowDiscardModal(true);
  };

  const confirmDiscard = async () => {
    try {
      await clearWorkoutData();
      setIsWorkoutActive(false);
      setDuration(0);
      setShowDiscardModal(false);
    } catch (error) {
      console.error('Error discarding workout:', error);
    }
  };

  // Hide overlay when loading, no workout active, or on workout screen
  if (isLoading || !isWorkoutActive || isOnWorkoutScreen) {
    return null;
  }

  return (
    <View
      className={`absolute left-0 right-0 border-t ${
        isDark ? 'bg-card-dark border-border-dark' : 'bg-card border-border'
      }`}
      style={{
        bottom: 60, // Position above tab bar (typical tab bar height is ~60px)
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
      }}
    >
      <View className="px-4 py-4">
        <Text
          className={`text-sm font-medium mb-4 text-center ${
            isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'
          }`}
        >
          Workout in Progress
        </Text>
        
        <View className="flex-row items-center justify-between gap-3">
          <Pressable
            onPress={handleResume}
            className={`flex-row items-center justify-center flex-1 px-4 py-2.5 rounded-lg ${
              isDark ? 'bg-primary-dark active:opacity-80' : 'bg-primary active:opacity-90'
            }`}
          >
            <Play 
              size={16} 
              color={isDark ? '#0A0A0A' : '#FFFFFF'} 
              fill={isDark ? '#0A0A0A' : '#FFFFFF'} 
            />
            <Text className={`font-semibold ml-2 ${isDark ? 'text-primary-foreground-dark' : 'text-primary-foreground'}`}>
              Resume
            </Text>
          </Pressable>
          
          <Pressable
            onPress={handleDiscard}
            className={`flex-row items-center justify-center flex-1 px-4 py-2.5 rounded-lg ${
              isDark ? 'bg-destructive-dark active:opacity-80' : 'bg-destructive active:opacity-90'
            }`}
          >
            <X 
              size={16} 
              color="#FFFFFF" 
            />
            <Text className="text-white font-semibold ml-2">
              Discard
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Discard Confirmation Modal */}
      <Modal
        visible={showDiscardModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDiscardModal(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onPress={() => setShowDiscardModal(false)}
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
              Discard Workout
            </Text>
            <Text
              className={`text-base mb-6 ${
                isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'
              }`}
            >
              Are you sure you want to discard this workout? This action cannot be undone.
            </Text>
            
            <View className="flex-row gap-3">
              <Pressable
                className={`flex-1 py-3 rounded-lg items-center ${
                  isDark ? 'bg-muted-dark' : 'bg-muted'
                }`}
                onPress={() => setShowDiscardModal(false)}
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
                onPress={confirmDiscard}
              >
                <Text className="text-white font-semibold">
                  Discard
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

