import { useColorScheme } from '@/hooks/use-color-scheme';
import { loadWorkoutData, saveWorkoutData } from '@/utils/workout-storage';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import { GripVertical, Minus } from 'lucide-react-native';
import { useCallback, useEffect, useState } from 'react';
import { Dimensions, Pressable, ScrollView, Text, View } from 'react-native';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { scheduleOnRN } from 'react-native-worklets';
import '../global.css';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const ITEM_HEIGHT = 80;

type DraggableItemProps = {
  exercise: WorkoutExercise;
  index: number;
  totalItems: number;
  isDark: boolean;
  onRemove: () => void;
  onMove: (fromIndex: number, toIndex: number) => void;
};

function DraggableItem({ exercise, index, totalItems, isDark, onRemove, onMove }: DraggableItemProps) {
  const translateY = useSharedValue(0);
  const isActive = useSharedValue(false);
  const startY = useSharedValue(0);
  const targetIndex = useSharedValue(index);
  const previousIndex = useSharedValue(index);

  // Reset translateY when index changes (e.g., after reorder or remove)
  useEffect(() => {
    if (previousIndex.value !== index) {
      // Smoothly animate to new position
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 90,
      });
      previousIndex.value = index;
    }
  }, [index]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      isActive.value = true;
      startY.value = translateY.value;
      targetIndex.value = index;
    })
    .onUpdate((event: { translationY: number }) => {
      translateY.value = startY.value + event.translationY;
      
      // Calculate new position based on drag
      const newPosition = index * ITEM_HEIGHT + event.translationY;
      const newIndex = Math.max(0, Math.min(totalItems - 1, Math.round(newPosition / ITEM_HEIGHT)));
      
      // Update target index but don't trigger state update yet
      if (newIndex !== targetIndex.value) {
        targetIndex.value = newIndex;
      }
    })
    .onEnd(() => {
      // Only update state when drag ends
      const finalIndex = targetIndex.value;
      if (finalIndex !== index) {
        scheduleOnRN(onMove, index, finalIndex);
      }
      
      // Animate back to position
      translateY.value = withSpring(0, {
        damping: 20,
        stiffness: 90,
      });
      isActive.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: translateY.value,
        },
        {
          scale: isActive.value ? 1.05 : 1,
        },
      ],
      zIndex: isActive.value ? 1000 : 1,
      opacity: isActive.value ? 0.95 : 1,
      shadowColor: isActive.value ? '#000' : 'transparent',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isActive.value ? 0.25 : 0,
      shadowRadius: isActive.value ? 8 : 0,
      elevation: isActive.value ? 10 : 0,
    };
  });

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          {
            marginBottom: 8,
          },
          animatedStyle,
        ]}
      >
        <View
          className={`flex-row items-center px-4 py-4 ${
            isDark ? 'bg-card-dark' : 'bg-card'
          }`}
          style={{ height: ITEM_HEIGHT }}
        >
          {/* Remove Button */}
          <Pressable
            onPress={onRemove}
            className="w-8 h-8 rounded-full bg-red-500 items-center justify-center mr-3"
          >
            <Minus size={16} color="#FFFFFF" />
          </Pressable>

          {/* Exercise Image */}
          <View className="w-12 h-12 rounded-full bg-white items-center justify-center mr-3">
            <Image
              source={{ uri: `https://api.exercisedb.io/image/${exercise.primaryMuscle}` }}
              style={{ width: 40, height: 40 }}
              contentFit="contain"
            />
          </View>

          {/* Exercise Name */}
          <Text className={`flex-1 text-base ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
            {exercise.name}
          </Text>

          {/* Drag Handle */}
          <View className="ml-2">
            <GripVertical size={20} color={isDark ? '#9BA1A6' : '#687076'} />
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

type ExerciseSet = {
  id: string;
  weight: number;
  reps: number;
  rpe: number | null;
  completed: boolean;
  setType?: 'W' | '1' | 'F' | 'D';
};

type WorkoutExercise = {
  id: string;
  name: string;
  primaryMuscle: string;
  secondaryMuscles: string[];
  notes: string;
  restTimer: number;
  sets: ExerciseSet[];
};

export default function ReorderExercisesScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [exercises, setExercises] = useState<WorkoutExercise[]>([]);
  const [duration, setDuration] = useState(0);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const { exercises: savedExercises, duration: savedDuration } = await loadWorkoutData();
        if (savedExercises.length > 0) {
          setExercises(savedExercises);
          setDuration(savedDuration);
        } else {
          router.back();
        }
      };
      loadData();
    }, [router])
  );


  const removeExercise = async (exerciseId: string) => {
    setExercises(prev => {
      const updated = prev.filter(ex => ex.id !== exerciseId);
      saveWorkoutData(updated, duration);
      return updated;
    });
  };

  const moveExercise = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;
    const newExercises = [...exercises];
    const [removed] = newExercises.splice(fromIndex, 1);
    newExercises.splice(toIndex, 0, removed);
    setExercises(newExercises);
    saveWorkoutData(newExercises, duration);
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView 
        className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background'}`}
        edges={['top']}
      >
        {/* Header */}
        <View className={`flex-row items-center justify-between px-4 py-3 border-b ${
          isDark ? 'border-border-dark' : 'border-border'
        }`}>
          <Text className={`text-xl font-bold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
            Reorder
          </Text>
        </View>

        {/* Exercise List */}
        {exercises.length > 0 ? (
          <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
            {exercises.map((exercise, index) => (
              <DraggableItem
                key={exercise.id}
                exercise={exercise}
                index={index}
                totalItems={exercises.length}
                isDark={isDark}
                onRemove={() => removeExercise(exercise.id)}
                onMove={moveExercise}
              />
            ))}
          </ScrollView>
        ) : (
          <View className="flex-1 items-center justify-center">
            <Text className={`text-base ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
              No exercises to reorder
            </Text>
          </View>
        )}

        {/* Done Button */}
        <View className={`px-4 pb-4 pt-2 border-t ${isDark ? 'border-border-dark' : 'border-border'}`}>
          <Pressable
            className={`py-4 rounded-lg items-center ${isDark ? 'bg-primary-dark' : 'bg-primary'}`}
            onPress={() => router.back()}
          >
            <Text className={`text-base font-semibold ${isDark ? 'text-black' : 'text-white'}`}>
              Done
            </Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

