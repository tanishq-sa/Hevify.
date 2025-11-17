import { auth, db } from '@/config/firebase';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getWorkoutComments, getWorkoutLikes, toggleLike } from '@/utils/workout-interactions';
import { useRouter } from 'expo-router';
import { collection, doc, getDoc, getDocs, limit, orderBy, query, where } from 'firebase/firestore';
import {
  Bell,
  ChevronDown,
  Lock,
  MessageCircle,
  Search,
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

// Function to fetch suggested athletes (other users)
const fetchSuggestedAthletes = async (currentUserId: string, limitCount: number = 10) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, limit(limitCount));
    const querySnapshot = await getDocs(q);
    
      const users: any[] = [];
      querySnapshot.forEach((doc) => {
        const userData = doc.data();
        // Exclude current user
        if (doc.id !== currentUserId) {
          users.push({
            id: doc.id,
            username: userData.username || userData.email?.split('@')[0] || 'User',
            avatar: userData.avatar || null // Only use Firebase avatar, no fallback
          });
        }
      });
    
    // Shuffle and return up to 4 users
    return shuffleArray(users).slice(0, 4);
  } catch (error) {
    console.error('Error fetching suggested athletes:', error);
    return [];
  }
};

// Track if we've already warned about the missing index
let hasWarnedAboutPublicWorkoutIndex = false;

// Function to fetch public workouts from all users
const fetchPublicWorkouts = async (limitCount: number = 50) => {
  try {
    const workoutsRef = collection(db, 'workouts');
    
    try {
      // Query for public workouts (visibility === 'Everyone')
      const q = query(
        workoutsRef,
        where('visibility', '==', 'Everyone'),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const querySnapshot = await getDocs(q);
      const workouts: any[] = [];
      const userIds = new Set<string>();
      
      // Collect all unique user IDs
      querySnapshot.docs.forEach((workoutDoc) => {
        const workoutData = workoutDoc.data();
        if (workoutData.userId) {
          userIds.add(workoutData.userId);
        }
      });
      
      // Batch fetch all user data
      const userDataMap = new Map<string, any>();
      await Promise.all(
        Array.from(userIds).map(async (userId) => {
          try {
            const userDoc = await getDoc(doc(db, 'users', userId));
            if (userDoc.exists()) {
              userDataMap.set(userId, userDoc.data());
            }
          } catch (error) {
            console.error(`Error fetching user data for ${userId}:`, error);
          }
        })
      );
      
      // Map workouts with user data
      querySnapshot.docs.forEach((workoutDoc) => {
        const workoutData = workoutDoc.data();
        const userData = workoutData.userId ? userDataMap.get(workoutData.userId) : null;
        
        const workout: any = {
          id: workoutDoc.id,
          ...workoutData,
          username: userData?.username || userData?.email?.split('@')[0] || 'User',
          avatar: userData?.avatar || null, // Only use Firebase avatar, no fallback
        };
        
        // Log workout data for debugging
        console.log('Workout from Firebase:', {
          id: workout.id,
          title: workout.title,
          userId: workout.userId,
          username: workout.username,
          avatar: workout.avatar,
          userDataAvatar: userData?.avatar,
          userDataExists: !!userData,
          userDataKeys: userData ? Object.keys(userData) : [],
          visibility: workout.visibility,
          duration: workout.duration,
          volume: workout.volume,
          sets: workout.sets,
          exercisesCount: workout.exercises?.length || 0,
          likesCount: workout.likes?.length || 0,
          commentsCount: workout.comments?.length || 0,
          createdAt: workout.createdAt,
        });
        
        workouts.push(workout);
      });
      
      console.log(`Total workouts fetched from Firebase: ${workouts.length}`);
      return workouts;
    } catch (indexError: any) {
      // If index error, fall back to simpler query without orderBy
      if (indexError.code === 'failed-precondition' || indexError.message?.includes('index')) {
        // Only warn once per app session
        if (!hasWarnedAboutPublicWorkoutIndex) {
          console.warn('Firestore index required for public workouts query. Using fallback query without ordering.');
          console.warn('To create the index, go to Firebase Console > Firestore > Indexes and create:');
          console.warn('Collection: workouts, Fields: visibility (Ascending), createdAt (Descending)');
          hasWarnedAboutPublicWorkoutIndex = true;
        }
        
        const q = query(
          workoutsRef,
          where('visibility', '==', 'Everyone'),
          limit(limitCount)
        );
        
        const querySnapshot = await getDocs(q);
        const workouts: any[] = [];
        const userIds = new Set<string>();
        
        // Collect all unique user IDs
        querySnapshot.docs.forEach((workoutDoc) => {
          const workoutData = workoutDoc.data();
          if (workoutData.userId) {
            userIds.add(workoutData.userId);
          }
        });
        
        // Batch fetch all user data
        const userDataMap = new Map<string, any>();
        await Promise.all(
          Array.from(userIds).map(async (userId) => {
            try {
              const userDoc = await getDoc(doc(db, 'users', userId));
              if (userDoc.exists()) {
                userDataMap.set(userId, userDoc.data());
              }
            } catch (error) {
              console.error(`Error fetching user data for ${userId}:`, error);
            }
          })
        );
        
        // Map workouts with user data
        querySnapshot.docs.forEach((workoutDoc) => {
          const workoutData = workoutDoc.data();
          const userData = workoutData.userId ? userDataMap.get(workoutData.userId) : null;
          
          const workout: any = {
            id: workoutDoc.id,
            ...workoutData,
            username: userData?.username || userData?.email?.split('@')[0] || 'User',
            avatar: userData?.avatar || null, // Only use Firebase avatar, no fallback
          };
          
          // Log workout data for debugging
          console.log('Workout from Firebase (fallback):', {
            id: workout.id,
            title: workout.title,
            userId: workout.userId,
            username: workout.username,
            avatar: workout.avatar,
            userDataAvatar: userData?.avatar,
            userDataExists: !!userData,
            userDataKeys: userData ? Object.keys(userData) : [],
            visibility: workout.visibility,
            duration: workout.duration,
            volume: workout.volume,
            sets: workout.sets,
            exercisesCount: workout.exercises?.length || 0,
            likesCount: workout.likes?.length || 0,
            commentsCount: workout.comments?.length || 0,
            createdAt: workout.createdAt,
          });
          
          workouts.push(workout);
        });
        
        // Sort in memory by createdAt
        workouts.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        
        console.log(`Total workouts fetched from Firebase (fallback): ${workouts.length}`);
        return workouts;
      }
      throw indexError;
    }
  } catch (error) {
    console.error('Error fetching public workouts:', error);
    return [];
  }
};

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
    const [displayedWorkouts, setDisplayedWorkouts] = useState([]);
  const [completedWorkouts, setCompletedWorkouts] = useState<any[]>([]);
  const [suggestedAthletes, setSuggestedAthletes] = useState<Array<{ id: string; username: string; avatar: string }>>([]);

  // Load completed workouts and suggested athletes once when screen mounts
  useEffect(() => {
    loadCompletedWorkouts();
    loadSuggestedAthletes();
    // We intentionally fetch only once on mount; user must pull-to-refresh or reopen app to refresh feed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSuggestedAthletes = async () => {
    try {
      if (!auth.currentUser) {
        setSuggestedAthletes([]);
        return;
      }
      
      const athletes = await fetchSuggestedAthletes(auth.currentUser.uid, 10);
      setSuggestedAthletes(athletes);
    } catch (error) {
      console.error('Error loading suggested athletes:', error);
    }
  };

  const loadCompletedWorkouts = async () => {
    try {
      if (!auth.currentUser) {
        setDisplayedWorkouts([]);
        return;
      }

      // Fetch public workouts from all users
      const workouts = await fetchPublicWorkouts(50);
      
      if (workouts.length === 0) {
        console.log('No public workouts found in Firebase');
        setDisplayedWorkouts([]);
        return;
      }

      console.log(`Fetched ${workouts.length} public workouts from Firebase`);
      console.log('Raw workout data from Firebase:', JSON.stringify(workouts.slice(0, 2), null, 2));
      
      // Convert workouts to feed format - preserve all Firebase data
      const formattedWorkouts = workouts.map((workout: any) => {
        const completedSetsCount = (workout.exercises || []).reduce((total: number, ex: any) => {
          return total + ((ex.sets || []).filter((s: any) => s.completed).length);
        }, 0);
        
        // Use the avatar that was already set from Firebase user data
        console.log('Formatting workout:', {
          id: workout.id,
          username: workout.username,
          avatarFromWorkout: workout.avatar,
        });
        
        return {
          id: workout.id,
          username: workout.username || 'User',
          avatar: workout.avatar || null, // Only use Firebase avatar, no fallback
          timeAgo: formatTimeAgo(workout.createdAt || workout.date),
          isPrivate: workout.visibility === 'Private' || workout.visibility === 'Only me',
          title: workout.title || 'Untitled Workout',
          description: workout.description || '',
          stats: {
            time: formatDuration(workout.duration || 0),
            volume: `${workout.volume || 0} kg`,
            records: workout.stats?.records || 0
          },
          exercises: (workout.exercises || []).slice(0, 3).map((ex: any) => ({
            name: ex.name || 'Exercise',
            sets: (ex.sets || []).filter((s: any) => s.completed).length,
            icon: '🏋️'
          })),
          totalExercises: (workout.exercises || []).length,
          totalSets: workout.sets || completedSetsCount,
          totalVolume: workout.volume || 0,
          likes: workout.likes?.length || 0,
          comments: workout.comments?.length || 0,
          shares: 0,
          // Preserve all original Firebase data
          rawData: workout
        };
      });
      
      setDisplayedWorkouts(formattedWorkouts as any);
      console.log(`Displayed ${formattedWorkouts.length} workouts in feed`);
      console.log('Sample formatted workout:', JSON.stringify(formattedWorkouts[0], null, 2));
    } catch (error) {
      console.error('Error loading completed workouts:', error);
      setDisplayedWorkouts([]);
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
    loadCompletedWorkouts();
  }, [selectedFeed]);

  // Component for like button with state
  const WorkoutLikeButton = ({ workoutId }: { workoutId: string }) => {
    const [isLiked, setIsLiked] = useState(false);
    const [likesCount, setLikesCount] = useState(0);

    useEffect(() => {
      const loadLikeStatus = async () => {
        try {
          const likesData = await getWorkoutLikes(workoutId);
          setIsLiked(likesData.liked);
          setLikesCount(likesData.likesCount);
        } catch (error) {
          console.error('Error loading like status:', error);
        }
      };
      if (workoutId) {
        loadLikeStatus();
      }
    }, [workoutId]);

    const handleLike = async (e: any) => {
      e.stopPropagation();
      try {
        const result = await toggleLike(workoutId);
        setIsLiked(result.liked);
        setLikesCount(result.likesCount);
      } catch (error) {
        console.error('Error toggling like:', error);
      }
    };

    return (
      <Pressable className="flex-row items-center mr-6" onPress={handleLike}>
        <ThumbsUp 
          size={20} 
          color={isLiked ? '#3B82F6' : (isDark ? '#94A3B8' : '#64748B')} 
          fill={isLiked ? '#3B82F6' : 'none'}
        />
        <Text className={`ml-2 ${isLiked ? 'text-primary' : (isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground')}`}>
          {likesCount}
        </Text>
      </Pressable>
    );
  };

  // Component for comment button with count from Firebase
  const WorkoutCommentButton = ({ workoutId }: { workoutId: string }) => {
    const [commentsCount, setCommentsCount] = useState(0);

    useEffect(() => {
      const loadCommentCount = async () => {
        try {
          const comments = await getWorkoutComments(workoutId);
          setCommentsCount(comments.length);
        } catch (error) {
          console.error('Error loading comment count:', error);
        }
      };
      if (workoutId) {
        loadCommentCount();
      }
    }, [workoutId]);

    return (
      <Pressable 
        className="flex-row items-center mr-6"
        onPress={() => {
          if (workoutId) {
            router.push(`/workout-detail?id=${workoutId}`);
          }
        }}
      >
        <MessageCircle size={20} color={isDark ? '#94A3B8' : '#64748B'} />
        <Text className={`ml-2 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
          {commentsCount}
        </Text>
      </Pressable>
    );
  };

  const renderWorkoutCard = ({ item }: { item: any }) => (
    <Pressable 
      className={`mb-4 mx-4 p-4 rounded-2xl ${isDark ? 'bg-card-dark' : 'bg-card'}`}
      onPress={() => {
        // Only navigate if it's a saved workout (has valid id)
        if (item.id) {
          console.log('Navigating to workout detail with ID:', item.id);
          router.push(`/workout-detail?id=${item.id}`);
        } else {
          console.error('Cannot navigate: workout has no ID');
        }
      }}
    >
      {/* User Header */}
      <View className="flex-row items-center mb-3">
        <Image
          source={{ uri: item.avatar || 'https://i.pravatar.cc/150?img=12' }}
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
      <Text className={`text-2xl font-bold mb-2 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
        {item.title}
      </Text>
      
      {/* Description - Show if available */}
      {((item as any).description && (item as any).description.trim()) && (
        <Text className={`text-sm mb-4 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
          {(item as any).description}
        </Text>
      )}

      {/* Stats */}
      <View className="flex-row mb-4">
        <View className="mr-6">
          <Text className={`text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
            Time
          </Text>
          <Text className={`text-base font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
            {item.stats?.time || formatDuration((item as any).rawData?.duration || 0)}
          </Text>
        </View>
        <View className="mr-6">
          <Text className={`text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
            Volume
          </Text>
          <Text className={`text-base font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
            {item.stats?.volume || `${(item as any).rawData?.volume || (item as any).totalVolume || 0} kg`}
          </Text>
        </View>
        <View className="mr-6">
          <Text className={`text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
            Sets
          </Text>
          <Text className={`text-base font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
            {(item as any).rawData?.sets || (item as any).totalSets || 0}
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
        {item.exercises && item.exercises.length > 0 ? (
          <>
            {item.exercises.map((exercise: any, index: number) => (
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
          </>
        ) : (
          <Text className={`text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
            No exercises in this workout
          </Text>
        )}
      </View>

      {/* Interaction Buttons */}
      <View className={`flex-row items-center pt-3 ${isDark ? 'border-t border-border-dark' : 'border-t border-border'}`}>
        <WorkoutLikeButton workoutId={item.id} />
        <WorkoutCommentButton workoutId={item.id} />
      </View>
    </Pressable>
  );

  const renderSuggestedAthlete = ({ item }: { item: typeof suggestedAthletes[0] }) => (
    <View className="mr-3 items-center">
      <View className="relative">
        <Image
          source={{ uri: item.avatar || 'https://i.pravatar.cc/150?img=12' }}
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
