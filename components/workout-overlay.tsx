import { useColorScheme } from '@/hooks/use-color-scheme';
import { clearWorkoutData, hasWorkoutInProgress, loadWorkoutData } from '@/utils/workout-storage';
import { useFocusEffect, useRouter, useSegments } from 'expo-router';
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
      setIsWorkoutActive(false);
      setDuration(0);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkWorkoutStatus();
    
    // Check every 1 second for workout status changes (more frequent to catch saves)
    const interval = setInterval(checkWorkoutStatus, 1000);
    
    return () => clearInterval(interval);
  }, [checkWorkoutStatus]);

  // Check immediately when screen comes into focus (e.g., after saving workout)
  useFocusEffect(
    useCallback(() => {
      // Check immediately and then again after a short delay to catch async clears
      checkWorkoutStatus();
      const timeout = setTimeout(checkWorkoutStatus, 500);
      return () => clearTimeout(timeout);
    }, [checkWorkoutStatus])
  );

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
      className={`absolute left-0 right-0 ${
        isDark ? 'bg-card-dark' : 'bg-card'
      }`}
      style={{
        bottom: 83, // Position above tab bar with more spacing
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <View className="px-5 py-5">
        <Text
          className={`text-base font-semibold mb-5 text-center ${
            isDark ? 'text-foreground-dark' : 'text-foreground'
          }`}
        >
          Workout in Progress
        </Text>
        
        <View className="flex-row items-center gap-3">
          <Pressable
            onPress={handleResume}
            className="flex-row items-center justify-center flex-1 px-5 py-3.5 rounded-xl"
            style={{
              backgroundColor: '#3B82F6',
            }}
          >
            <Play 
              size={18} 
              color="#000000" 
              fill="#000000" 
            />
            <Text className="text-white font-semibold ml-2 text-base">
              Resume
            </Text>
          </Pressable>
          
          <Pressable
            onPress={handleDiscard}
            className="flex-row items-center justify-center flex-1 px-5 py-3.5 rounded-xl"
            style={{
              backgroundColor: '#EF4444',
            }}
          >
            <X 
              size={18} 
              color="#FFFFFF" 
            />
            <Text className="text-white font-semibold ml-2 text-base">
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

