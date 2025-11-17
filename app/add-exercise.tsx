import { useColorScheme } from '@/hooks/use-color-scheme';
import { getReplaceExerciseId, loadWorkoutData, saveWorkoutData, setPendingExercises } from '@/utils/workout-storage';
import { useRouter } from 'expo-router';
import { Search, TrendingUp } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../global.css';


const mockExercises = [
  { 
    id: '1', 
    name: 'Pull Up', 
    primaryMuscle: 'Lats',
    secondaryMuscles: ['Biceps', 'Rear Delts', 'Rhomboids']
  },
  { 
    id: '2', 
    name: 'Lat Pulldown - Close Grip (Cable)', 
    primaryMuscle: 'Lats',
    secondaryMuscles: ['Biceps', 'Rear Delts']
  },
  { 
    id: '3', 
    name: 'Straight Arm Lat Pulldown (Cable)', 
    primaryMuscle: 'Lats',
    secondaryMuscles: ['Rear Delts', 'Rhomboids']
  },
  { 
    id: '4', 
    name: 'Seated Cable Row - Bar Wide Grip', 
    primaryMuscle: 'Lats',
    secondaryMuscles: ['Rhomboids', 'Middle Traps', 'Rear Delts', 'Biceps']
  },
  { 
    id: '5', 
    name: 'Barbell Bench Press', 
    primaryMuscle: 'Chest',
    secondaryMuscles: ['Front Delts', 'Triceps']
  },
  { 
    id: '6', 
    name: 'Incline Dumbbell Press', 
    primaryMuscle: 'Upper Chest',
    secondaryMuscles: ['Front Delts', 'Triceps']
  },
  { 
    id: '7', 
    name: 'Push Up', 
    primaryMuscle: 'Chest',
    secondaryMuscles: ['Front Delts', 'Triceps', 'Core']
  },
  { 
    id: '8', 
    name: 'Dumbbell Flyes', 
    primaryMuscle: 'Chest',
    secondaryMuscles: ['Front Delts']
  },
  { 
    id: '9', 
    name: 'Barbell Back Squat', 
    primaryMuscle: 'Quads',
    secondaryMuscles: ['Glutes', 'Hamstrings', 'Calves', 'Core']
  },
  { 
    id: '10', 
    name: 'Leg Press', 
    primaryMuscle: 'Quads',
    secondaryMuscles: ['Glutes', 'Hamstrings', 'Calves']
  },
  { 
    id: '11', 
    name: 'Romanian Deadlift', 
    primaryMuscle: 'Hamstrings',
    secondaryMuscles: ['Glutes', 'Lower Back', 'Calves']
  },
  { 
    id: '12', 
    name: 'Conventional Deadlift', 
    primaryMuscle: 'Lower Back',
    secondaryMuscles: ['Glutes', 'Hamstrings', 'Quads', 'Traps', 'Lats']
  },
  { 
    id: '13', 
    name: 'Barbell Bent Over Row', 
    primaryMuscle: 'Lats',
    secondaryMuscles: ['Rhomboids', 'Middle Traps', 'Rear Delts', 'Biceps']
  },
  { 
    id: '14', 
    name: 'Overhead Press (Barbell)', 
    primaryMuscle: 'Front Delts',
    secondaryMuscles: ['Side Delts', 'Triceps', 'Core', 'Upper Traps']
  },
  { 
    id: '15', 
    name: 'Lateral Raise (Dumbbell)', 
    primaryMuscle: 'Side Delts',
    secondaryMuscles: ['Front Delts', 'Rear Delts']
  },
  { 
    id: '16', 
    name: 'Barbell Bicep Curl', 
    primaryMuscle: 'Biceps',
    secondaryMuscles: ['Forearms', 'Brachialis']
  },
  { 
    id: '17', 
    name: 'Tricep Dips', 
    primaryMuscle: 'Triceps',
    secondaryMuscles: ['Front Delts', 'Chest']
  },
  { 
    id: '18', 
    name: 'Standing Calf Raise', 
    primaryMuscle: 'Calves',
    secondaryMuscles: ['Soleus']
  },
];

export default function AddExerciseScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'equipment' | 'muscles'>('equipment');
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);
  const [replaceExerciseId, setReplaceExerciseId] = useState<string | null>(null);
  const [isReplaceMode, setIsReplaceMode] = useState(false);

  useEffect(() => {
    const replaceId = getReplaceExerciseId();
    if (replaceId) {
      setReplaceExerciseId(replaceId);
      setIsReplaceMode(true);
    }
  }, []);

  const filteredExercises = mockExercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.primaryMuscle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.secondaryMuscles.some(muscle => muscle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleExerciseSelection = (exerciseId: string) => {
    if (isReplaceMode) {
      // In replace mode, only allow one exercise to be selected
      setSelectedExercises(prev => 
        prev.includes(exerciseId) ? [] : [exerciseId]
      );
    } else {
      // In add mode, allow multiple selections
      setSelectedExercises(prev => 
        prev.includes(exerciseId)
          ? prev.filter(id => id !== exerciseId)
          : [...prev, exerciseId]
      );
    }
  };

  const renderExerciseItem = ({ item }: { item: typeof mockExercises[0] }) => {
    const isSelected = selectedExercises.includes(item.id);
    
    return (
      <Pressable
        className={`flex-row items-center py-4 px-4 border-b ${isDark ? 'border-border-dark' : 'border-border'}`}
        onPress={() => toggleExerciseSelection(item.id)}
      >
        {isSelected && (
          <View className={`w-1 h-full absolute left-0 ${isDark ? 'bg-primary-dark' : 'bg-primary'}`} />
        )}
        <View className="flex-1 mr-3 ml-2">
          <Text className={`text-base font-medium mb-1 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
            {item.name}
          </Text>
          <Text className={`text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
            {item.primaryMuscle}
            {item.secondaryMuscles.length > 0 && ` • ${item.secondaryMuscles.join(', ')}`}
          </Text>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            router.push({
              pathname: '/exercise-detail',
              params: {
                name: item.name,
                primaryMuscle: item.primaryMuscle,
                secondaryMuscles: item.secondaryMuscles.join(','),
              },
            } as any);
          }}
        >
          <TrendingUp size={20} color={isDark ? '#9BA1A6' : '#687076'} />
        </Pressable>
      </Pressable>
    );
  };

  return (
    <SafeAreaView 
      className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background'}`} 
      edges={['top', 'left', 'right']}
    >
      {/* Header */}
      <View className={`flex-row items-center justify-between px-4 py-3 ${isDark ? 'bg-background-dark' : 'bg-background'}`}>
        <Pressable onPress={() => router.back()}>
          <Text className={`text-base ${isDark ? 'text-primary-dark' : 'text-primary'}`}>
            Cancel
          </Text>
        </Pressable>
        <Text className={`text-lg font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
          {isReplaceMode ? 'Replace Exercise' : 'Add Exercise'}
        </Text>
        <Pressable>
          <Text className={`text-base ${isDark ? 'text-primary-dark' : 'text-primary'}`}>
            Create
          </Text>
        </Pressable>
      </View>

      <View className={`px-4 py-3 ${isDark ? 'bg-background-dark' : 'bg-background'}`}>
        <View className={`flex-row items-center px-4 py-3 rounded-lg ${isDark ? 'bg-card-dark' : 'bg-card'}`}>
          <Search size={20} color={isDark ? '#9BA1A6' : '#687076'} />
          <TextInput
            className={`flex-1 ml-3 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}
            placeholder="Search exercise"
            placeholderTextColor={isDark ? '#9BA1A6' : '#687076'}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
        </View>
      </View>

      <View className="flex-row px-4 mb-4">
        <Pressable
          onPress={() => setSelectedFilter('equipment')}
          className={`flex-1 py-2 px-4 rounded-lg mr-2 ${
            selectedFilter === 'equipment'
              ? (isDark ? 'bg-primary-dark' : 'bg-primary')
              : (isDark ? 'bg-card-dark' : 'bg-card')
          }`}
        >
          <Text
            className={`text-center font-medium ${
              selectedFilter === 'equipment'
                ? (isDark ? 'text-primary-foreground-dark' : 'text-primary-foreground')
                : (isDark ? 'text-foreground-dark' : 'text-foreground')
            }`}
          >
            All Equipment
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setSelectedFilter('muscles')}
          className={`flex-1 py-2 px-4 rounded-lg ${
            selectedFilter === 'muscles'
              ? (isDark ? 'bg-primary-dark' : 'bg-primary')
              : (isDark ? 'bg-card-dark' : 'bg-card')
          }`}
        >
          <Text
            className={`text-center font-medium ${
              selectedFilter === 'muscles'
                ? (isDark ? 'text-primary-foreground-dark' : 'text-primary-foreground')
                : (isDark ? 'text-foreground-dark' : 'text-foreground')
            }`}
          >
            All Muscles
          </Text>
        </Pressable>
      </View>

      <View className="px-4 mb-2">
        <Text className={`text-sm font-semibold ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
          Recent Exercises
        </Text>
      </View>

      <FlatList
        data={filteredExercises}
        renderItem={renderExerciseItem}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 }}
      />

      {selectedExercises.length > 0 && (
        <View className={`absolute bottom-0 left-0 right-0 px-4 py-4 ${isDark ? 'bg-background-dark' : 'bg-background'} border-t ${isDark ? 'border-border-dark' : 'border-border'}`}>
          <Pressable
            className={`w-full py-4 rounded-lg flex-row items-center justify-center ${isDark ? 'bg-primary-dark' : 'bg-primary'}`}
            onPress={async () => {
              if (isReplaceMode && replaceExerciseId) {
                // Replace mode: replace the exercise in the workout data
                const { exercises: currentExercises, duration } = await loadWorkoutData();
                const exerciseIndex = currentExercises.findIndex((ex: any) => ex.id === replaceExerciseId);
                
                if (exerciseIndex !== -1 && selectedExercises.length > 0) {
                  const selectedExerciseData = mockExercises.find(ex => ex.id === selectedExercises[0]);
                  
                  if (selectedExerciseData) {
                    // Get the existing exercise to preserve sets, notes, and restTimer
                    const existingExercise = currentExercises[exerciseIndex];
                    
                    // Replace with new exercise but preserve existing data
                    const replacedExercise = {
                      id: selectedExerciseData.id,
                      name: selectedExerciseData.name,
                      primaryMuscle: selectedExerciseData.primaryMuscle,
                      secondaryMuscles: selectedExerciseData.secondaryMuscles,
                      notes: existingExercise.notes || '',
                      restTimer: existingExercise.restTimer || 50,
                      sets: existingExercise.sets || [{
                        id: Date.now().toString() + Math.random(),
                        weight: 0,
                        reps: 0,
                        rpe: null,
                        completed: false,
                        setType: '1',
                      }],
                    };
                    
                    // Replace the exercise in the array
                    const updatedExercises = [...currentExercises];
                    updatedExercises[exerciseIndex] = replacedExercise;
                    
                    // Save the updated workout
                    await saveWorkoutData(updatedExercises, duration);
                  }
                }
              } else {
                // Add mode: use pending exercises
                const selectedExercisesData = mockExercises.filter(ex => selectedExercises.includes(ex.id));
                const exercisesToAdd = selectedExercisesData.map(ex => ({
                  id: ex.id,
                  name: ex.name,
                  primaryMuscle: ex.primaryMuscle,
                  secondaryMuscles: ex.secondaryMuscles,
                }));
                setPendingExercises(exercisesToAdd);
              }
              
              router.back();
            }}
          >
            <Text className={`text-lg font-semibold ${isDark ? 'text-primary-foreground-dark' : 'text-primary-foreground'}`}>
              {isReplaceMode 
                ? `Replace Exercise`
                : `Add ${selectedExercises.length} ${selectedExercises.length === 1 ? 'exercise' : 'exercises'}`
              }
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

