import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import {
  Bell,
  ChevronDown,
  Lock,
  MessageCircle,
  Search,
  Share2,
  ThumbsUp,
  Trophy,
  X
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  FlatList,
  Image,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../../global.css';

// Mock data for workouts
const mockWorkouts = [
  {
    id: '1',
    username: 'dazzelr',
    avatar: 'https://i.pravatar.cc/150?img=12',
    timeAgo: 'Yesterday',
    isPrivate: true,
    title: 'Afternoon workout 💪',
    stats: {
      time: '59min',
      volume: '10,041 kg',
      records: 10
    },
    exercises: [
      { name: 'Pull Up', sets: 2, icon: '🏋️' },
      { name: 'Lat Pulldown - Close Grip (Cable)', sets: 3, icon: '🏋️' },
      { name: 'Straight Arm Lat Pulldown (Cable)', sets: 2, icon: '🏋️' }
    ],
    totalExercises: 10,
    likes: 24,
    comments: 5,
    shares: 3
  },
  {
    id: '2',
    username: 'fitness_pro',
    avatar: 'https://i.pravatar.cc/150?img=33',
    timeAgo: '2 hours ago',
    isPrivate: false,
    title: 'Leg Day 🦵',
    stats: {
      time: '75min',
      volume: '15,230 kg',
      records: 5
    },
    exercises: [
      { name: 'Squat', sets: 4, icon: '🏋️' },
      { name: 'Romanian Deadlift', sets: 3, icon: '🏋️' },
      { name: 'Leg Press', sets: 3, icon: '🏋️' }
    ],
    totalExercises: 8,
    likes: 42,
    comments: 12,
    shares: 8
  },
  {
    id: '3',
    username: 'strength_master',
    avatar: 'https://i.pravatar.cc/150?img=45',
    timeAgo: '3 hours ago',
    isPrivate: false,
    title: 'Push Day 💥',
    stats: {
      time: '65min',
      volume: '12,500 kg',
      records: 7
    },
    exercises: [
      { name: 'Bench Press', sets: 4, icon: '🏋️' },
      { name: 'Overhead Press', sets: 3, icon: '🏋️' },
      { name: 'Tricep Dips', sets: 3, icon: '🏋️' }
    ],
    totalExercises: 9,
    likes: 38,
    comments: 8,
    shares: 5
  },
  {
    id: '4',
    username: 'cardio_queen',
    avatar: 'https://i.pravatar.cc/150?img=28',
    timeAgo: '5 hours ago',
    isPrivate: false,
    title: 'Cardio Blast 🔥',
    stats: {
      time: '45min',
      volume: '8,200 kg',
      records: 3
    },
    exercises: [
      { name: 'Running', sets: 1, icon: '🏃' },
      { name: 'Rowing', sets: 3, icon: '🚣' },
      { name: 'Cycling', sets: 2, icon: '🚴' }
    ],
    totalExercises: 6,
    likes: 56,
    comments: 15,
    shares: 12
  },
  {
    id: '5',
    username: 'yoga_zen',
    avatar: 'https://i.pravatar.cc/150?img=52',
    timeAgo: '1 day ago',
    isPrivate: false,
    title: 'Morning Flow 🧘',
    stats: {
      time: '30min',
      volume: '0 kg',
      records: 2
    },
    exercises: [
      { name: 'Sun Salutation', sets: 3, icon: '🧘' },
      { name: 'Warrior Poses', sets: 2, icon: '🧘' }
    ],
    totalExercises: 5,
    likes: 29,
    comments: 6,
    shares: 4
  }
];

// Mock data for suggested athletes
const suggestedAthletes = [
  {
    id: '1',
    username: 'rissa88',
    avatar: 'https://i.pravatar.cc/150?img=47'
  },
  {
    id: '2',
    username: 'leah',
    avatar: 'https://i.pravatar.cc/150?img=20'
  },
  {
    id: '3',
    username: 'ge',
    avatar: 'https://i.pravatar.cc/150?img=15'
  },
  {
    id: '4',
    username: 'fit_mike',
    avatar: 'https://i.pravatar.cc/150?img=32'
  }
];

type FeedType = 'Home' | 'Discover' | 'Random feed';

// Shuffle function to randomize array
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [selectedFeed, setSelectedFeed] = useState<FeedType>('Home');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [displayedWorkouts, setDisplayedWorkouts] = useState(mockWorkouts);
  const [completedWorkouts, setCompletedWorkouts] = useState<any[]>([]);

  // Load completed workouts from storage
  useFocusEffect(
    React.useCallback(() => {
      loadCompletedWorkouts();
    }, [])
  );

  const loadCompletedWorkouts = async () => {
    try {
      const data = await AsyncStorage.getItem('@completed_workouts');
      if (data) {
        const workouts = JSON.parse(data);
        setCompletedWorkouts(workouts);
        
        // Convert completed workouts to feed format and merge with mock data
        const formattedWorkouts = workouts.map((workout: any) => ({
          id: workout.id,
          username: 'dazzelr',
          avatar: 'https://i.pravatar.cc/150?img=12',
          timeAgo: formatTimeAgo(workout.date),
          isPrivate: workout.visibility === 'Only me',
          title: workout.title,
          stats: {
            time: formatDuration(workout.duration),
            volume: `${workout.volume} kg`,
            records: 0
          },
          exercises: workout.exercises.slice(0, 3).map((ex: any) => ({
            name: ex.name,
            sets: ex.sets.filter((s: any) => s.completed).length,
            icon: '🏋️'
          })),
          totalExercises: workout.exercises.length,
          likes: 0,
          comments: 0,
          shares: 0
        }));
        
        // Merge with mock workouts
        setDisplayedWorkouts([...formattedWorkouts, ...mockWorkouts]);
      }
    } catch (error) {
      console.error('Error loading completed workouts:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else {
      return `${diffInDays} days ago`;
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

  // Randomize feed when "Discover" is selected
  useEffect(() => {
    if (selectedFeed === 'Discover') {
      setDisplayedWorkouts(shuffleArray([...completedWorkouts, ...mockWorkouts]));
    } else {
      loadCompletedWorkouts();
    }
  }, [selectedFeed]);

  const renderWorkoutCard = ({ item }: { item: typeof mockWorkouts[0] }) => (
    <Pressable 
      className={`mb-4 mx-4 p-4 rounded-2xl ${isDark ? 'bg-card-dark' : 'bg-card'}`}
      onPress={() => {
        // Only navigate if it's a saved workout (has valid id)
        if (item.id) {
          router.push(`/workout-detail?id=${item.id}`);
        }
      }}
    >
      {/* User Header */}
      <View className="flex-row items-center mb-3">
        <Image
          source={{ uri: item.avatar }}
          className="w-12 h-12 rounded-full mr-3"
        />
        <View className="flex-1">
          <Text className={`font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
            {item.username}
          </Text>
          <View className="flex-row items-center mt-1">
            <Text className={`text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
              {item.timeAgo}
            </Text>
            {item.isPrivate && (
              <View className="flex-row items-center ml-2">
                <Lock size={12} color={isDark ? '#94A3B8' : '#64748B'} />
                <Text className={`text-sm ml-1 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                  Only you
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Workout Title */}
      <Text className={`text-2xl font-bold mb-4 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
        {item.title}
      </Text>

      {/* Stats */}
      <View className="flex-row mb-4">
        <View className="mr-6">
          <Text className={`text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
            Time
          </Text>
          <Text className={`text-base font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
            {item.stats.time}
          </Text>
        </View>
        <View className="mr-6">
          <Text className={`text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
            Volume
          </Text>
          <Text className={`text-base font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
            {item.stats.volume}
          </Text>
        </View>
        <View>
          <Text className={`text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
            Records
          </Text>
          <View className="flex-row items-center">
            <Trophy size={16} color="#FCD34D" />
            <Text className={`text-base font-semibold ml-1 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              {item.stats.records}
            </Text>
          </View>
        </View>
      </View>

      {/* Exercises */}
      <View className="mb-3">
        {item.exercises.map((exercise, index) => (
          <View key={index} className="flex-row items-center mb-2">
            <Text className={`flex-1 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              {exercise.sets} sets {exercise.name}
            </Text>
          </View>
        ))}
        {item.totalExercises > item.exercises.length && (
          <Pressable>
            <Text className={`text-sm mt-2 ${isDark ? 'text-primary-dark' : 'text-primary'}`}>
              See {item.totalExercises - item.exercises.length} more exercises
            </Text>
          </Pressable>
        )}
      </View>

      {/* Interaction Buttons */}
      <View className={`flex-row items-center pt-3 ${isDark ? 'border-t border-border-dark' : 'border-t border-border'}`}>
        <Pressable className="flex-row items-center mr-6">
          <ThumbsUp size={20} color={isDark ? '#94A3B8' : '#64748B'} />
          <Text className={`ml-2 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
            {item.likes}
          </Text>
        </Pressable>
        <Pressable className="flex-row items-center mr-6">
          <MessageCircle size={20} color={isDark ? '#94A3B8' : '#64748B'} />
          <Text className={`ml-2 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
            {item.comments}
          </Text>
        </Pressable>
        <Pressable className="flex-row items-center">
          <Share2 size={20} color={isDark ? '#94A3B8' : '#64748B'} />
          <Text className={`ml-2 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
            {item.shares}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );

  const renderSuggestedAthlete = ({ item }: { item: typeof suggestedAthletes[0] }) => (
    <View className="mr-3 items-center">
      <View className="relative">
        <Image
          source={{ uri: item.avatar }}
          className="w-16 h-16 rounded-full"
        />
        <Pressable className="absolute -top-1 -right-1 bg-destructive rounded-full p-1">
          <X size={12} color="#FFFFFF" />
        </Pressable>
      </View>
      <Text className={`text-xs mt-2 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
        {item.username}
      </Text>
    </View>
  );

  return (
    <SafeAreaView 
      className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background'}`} 
      edges={['top', 'left', 'right']}
    >
      {/* Header */}
      <View className={`flex-row items-center justify-between px-4 py-3 ${isDark ? 'bg-background-dark' : 'bg-background'}`}>
        <View className="relative z-50">
          <Pressable 
            className="flex-row items-center"
            onPress={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <Text className={`font-semibold mr-1 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              {selectedFeed}
            </Text>
            <ChevronDown 
              size={16} 
              color={isDark ? '#F5F5F5' : '#11181C'} 
              style={{ transform: [{ rotate: isDropdownOpen ? '180deg' : '0deg' }] }}
            />
          </Pressable>
          
          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <View 
              className={`absolute top-10 left-0 rounded-lg shadow-lg min-w-[140px] ${isDark ? 'bg-card-dark' : 'bg-card'}`}
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.25,
                shadowRadius: 3.84,
                elevation: 10,
              }}
            >
              {(['Home', 'Discover'] as FeedType[]).map((option) => (
                <Pressable
                  key={option}
                  onPress={() => {
                    setSelectedFeed(option);
                    setIsDropdownOpen(false);
                  }}
                  className={`px-4 py-3 ${selectedFeed === option ? (isDark ? 'bg-muted-dark' : 'bg-muted') : ''}`}
                >
                  <Text className={`font-medium ${selectedFeed === option 
                    ? (isDark ? 'text-primary-dark' : 'text-primary')
                    : (isDark ? 'text-foreground-dark' : 'text-foreground')
                  }`}>
                    {option}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
        <View className="flex-row items-center">
          <Pressable className="mr-4">
            <Search size={22} color={isDark ? '#F5F5F5' : '#11181C'} />
          </Pressable>
          <Pressable className="relative">
            <Bell size={22} color={isDark ? '#F5F5F5' : '#11181C'} />
            <View className="absolute -top-1 -right-1 w-2 h-2 bg-destructive rounded-full" />
          </Pressable>
        </View>
      </View>
      
      {/* Overlay to close dropdown when clicking outside */}
      {isDropdownOpen && (
        <Pressable 
          className="absolute inset-0 z-40"
          style={{ top: 60 }}
          onPress={() => setIsDropdownOpen(false)}
        />
      )}

      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
      >
        {/* Workout Feed */}
        <FlatList
          data={displayedWorkouts}
          renderItem={renderWorkoutCard}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ListHeaderComponent={
            <View className="pt-2" />
          }
        />

        <View className="mt-6 mb-4">
          <View className="flex-row items-center justify-between px-4 mb-3">
            <Text className={`text-lg font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              Suggested Athletes
            </Text>
            <Pressable>
              <Text className={`text-sm ${isDark ? 'text-primary-dark' : 'text-primary'}`}>
                + Invite a friend
              </Text>
            </Pressable>
          </View>
          <FlatList
            data={suggestedAthletes}
            renderItem={renderSuggestedAthlete}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16 }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
