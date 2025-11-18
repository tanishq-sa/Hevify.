import { useColorScheme } from '@/hooks/use-color-scheme';
import { setPendingRoutineExercises } from '@/utils/routine-storage';
import { useRouter } from 'expo-router';
import { ChevronLeft, Dumbbell, Search, TrendingUp } from 'lucide-react-native';
import { useState } from 'react';
import { FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../global.css';

const mockExercises = [
  { 
    id: '1', 
    name: 'Pull Up', 
    primaryMuscle: 'Lats',
    secondaryMuscles: ['Biceps', 'Rear Delts', 'Rhomboids'],
    equipment: 'Bodyweight'
  },
  { 
    id: '2', 
    name: 'Lat Pulldown - Close Grip (Cable)', 
    primaryMuscle: 'Lats',
    secondaryMuscles: ['Biceps', 'Rear Delts'],
    equipment: 'Cable'
  },
  { 
    id: '3', 
    name: 'Straight Arm Lat Pulldown (Cable)', 
    primaryMuscle: 'Lats',
    secondaryMuscles: ['Rear Delts', 'Rhomboids'],
    equipment: 'Cable'
  },
  { 
    id: '4', 
    name: 'Seated Cable Row - Bar Wide Grip', 
    primaryMuscle: 'Lats',
    secondaryMuscles: ['Rhomboids', 'Middle Traps', 'Rear Delts', 'Biceps'],
    equipment: 'Cable'
  },
  { 
    id: '5', 
    name: 'Barbell Bench Press', 
    primaryMuscle: 'Chest',
    secondaryMuscles: ['Front Delts', 'Triceps'],
    equipment: 'Barbell'
  },
  { 
    id: '6', 
    name: 'Incline Bench Press (Barbell)', 
    primaryMuscle: 'Chest',
    secondaryMuscles: ['Front Delts', 'Triceps'],
    equipment: 'Barbell'
  },
  { 
    id: '7', 
    name: 'Chest Fly (Dumbbell)', 
    primaryMuscle: 'Chest',
    secondaryMuscles: ['Front Delts'],
    equipment: 'Dumbbell'
  },
  { 
    id: '8', 
    name: 'Push Up', 
    primaryMuscle: 'Chest',
    secondaryMuscles: ['Front Delts', 'Triceps', 'Core'],
    equipment: 'Bodyweight'
  },
  { 
    id: '9', 
    name: 'Dumbbell Flyes', 
    primaryMuscle: 'Chest',
    secondaryMuscles: ['Front Delts'],
    equipment: 'Dumbbell'
  },
  { 
    id: '10', 
    name: 'Barbell Back Squat', 
    primaryMuscle: 'Quads',
    secondaryMuscles: ['Glutes', 'Hamstrings', 'Calves', 'Core'],
    equipment: 'Barbell'
  },
  { 
    id: '11', 
    name: 'Leg Press', 
    primaryMuscle: 'Quads',
    secondaryMuscles: ['Glutes', 'Hamstrings', 'Calves'],
    equipment: 'Machine'
  },
  { 
    id: '12', 
    name: 'Romanian Deadlift', 
    primaryMuscle: 'Hamstrings',
    secondaryMuscles: ['Glutes', 'Lower Back', 'Calves'],
    equipment: 'Barbell'
  },
  { 
    id: '13', 
    name: 'Conventional Deadlift', 
    primaryMuscle: 'Lower Back',
    secondaryMuscles: ['Glutes', 'Hamstrings', 'Quads', 'Traps', 'Lats'],
    equipment: 'Barbell'
  },
  { 
    id: '14', 
    name: 'Barbell Bent Over Row', 
    primaryMuscle: 'Lats',
    secondaryMuscles: ['Rhomboids', 'Middle Traps', 'Rear Delts', 'Biceps'],
    equipment: 'Barbell'
  },
  { 
    id: '15', 
    name: 'Overhead Press (Barbell)', 
    primaryMuscle: 'Front Delts',
    secondaryMuscles: ['Side Delts', 'Triceps', 'Core', 'Upper Traps'],
    equipment: 'Barbell'
  },
  { 
    id: '16', 
    name: 'Seated Shoulder Press (Machine)', 
    primaryMuscle: 'Shoulders',
    secondaryMuscles: ['Front Delts', 'Triceps'],
    equipment: 'Machine'
  },
  { 
    id: '17', 
    name: 'Lateral Raise (Dumbbell)', 
    primaryMuscle: 'Side Delts',
    secondaryMuscles: ['Front Delts', 'Rear Delts'],
    equipment: 'Dumbbell'
  },
  { 
    id: '18', 
    name: 'Barbell Bicep Curl', 
    primaryMuscle: 'Biceps',
    secondaryMuscles: ['Forearms', 'Brachialis'],
    equipment: 'Barbell'
  },
  { 
    id: '19', 
    name: 'Tricep Dips', 
    primaryMuscle: 'Triceps',
    secondaryMuscles: ['Front Delts', 'Chest'],
    equipment: 'Bodyweight'
  },
  { 
    id: '20', 
    name: 'Standing Calf Raise', 
    primaryMuscle: 'Calves',
    secondaryMuscles: ['Soleus'],
    equipment: 'Machine'
  },
];

export default function AddExerciseToRoutineScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'equipment' | 'muscles'>('equipment');
  const [selectedExercises, setSelectedExercises] = useState<string[]>([]);

  const filteredExercises = mockExercises.filter((exercise) =>
    exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.primaryMuscle.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exercise.secondaryMuscles.some(muscle => muscle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const toggleExerciseSelection = (exerciseId: string) => {
    setSelectedExercises(prev => 
      prev.includes(exerciseId)
        ? prev.filter(id => id !== exerciseId)
        : [...prev, exerciseId]
    );
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
        <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isDark ? 'bg-card-dark' : 'bg-card'}`}>
          <Dumbbell size={18} color={isDark ? '#9BA1A6' : '#687076'} />
        </View>
        <Pressable 
          className="flex-1 mr-3"
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
          <Text className={`text-base font-medium mb-1 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
            {item.name}
          </Text>
          <Text className={`text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
            {item.primaryMuscle}
            {item.secondaryMuscles.length > 0 && ` • ${item.secondaryMuscles.join(', ')}`}
          </Text>
        </Pressable>
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

  const handleAddExercises = () => {
    if (selectedExercises.length === 0) return;
    
    // Store selected exercises in temporary storage
    const exercisesData = mockExercises
      .filter(ex => selectedExercises.includes(ex.id))
      .map(ex => ({
        id: ex.id,
        name: ex.name,
        primaryMuscle: ex.primaryMuscle,
        secondaryMuscles: ex.secondaryMuscles,
        equipment: ex.equipment,
      }));
    
    setPendingRoutineExercises(exercisesData);
    router.back();
  };

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
          Add Exercise
        </Text>
        <View style={{ width: 24 }} />
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
            onPress={handleAddExercises}
          >
            <Text className={`text-lg font-semibold ${isDark ? 'text-primary-foreground-dark' : 'text-primary-foreground'}`}>
              Add {selectedExercises.length} {selectedExercises.length === 1 ? 'exercise' : 'exercises'}
            </Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

