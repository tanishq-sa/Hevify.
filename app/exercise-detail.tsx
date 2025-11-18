import { auth, db } from '@/config/firebase';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, getDocs, orderBy, query, where } from 'firebase/firestore';
import { ChevronLeft, Dumbbell, MoreVertical, Share2 } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../global.css';

const API_BASE_URL = 'https://musclegroup-image-generator-main-production.up.railway.app';

export default function ExerciseDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const exerciseName = params.name as string || 'Exercise';
  const primaryMuscle = params.primaryMuscle as string || '';
  const secondaryMuscles = (params.secondaryMuscles as string)?.split(',') || [];
  
  const [selectedTab, setSelectedTab] = useState<'summary' | 'history' | 'howto'>('summary');
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [workoutHistory, setWorkoutHistory] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [showMenuModal, setShowMenuModal] = useState(false);

  // Map muscle names to API format (using exact API muscle group names)
  const mapMuscleToAPI = (muscle: string): string => {
    const muscleMap: { [key: string]: string } = {
      'Lats': 'latissimus',
      'Chest': 'chest',
      'Upper Chest': 'chest',
      'Quads': 'quadriceps',
      'Hamstrings': 'hamstring',
      'Lower Back': 'back_lower',
      'Back': 'back',
      'Front Delts': 'shoulders_front',
      'Side Delts': 'shoulders',
      'Rear Delts': 'shoulders_back',
      'Shoulders': 'shoulders',
      'Biceps': 'biceps',
      'Triceps': 'triceps',
      'Calves': 'calfs',
      'Glutes': 'gluteus',
      'Rhomboids': 'back_upper',
      'Middle Traps': 'back_upper',
      'Upper Traps': 'back_upper',
      'Traps': 'back_upper',
      'Core': 'abs',
      'Forearms': 'forearms',
      'Brachialis': 'biceps',
      'Soleus': 'calfs',
    };
    return muscleMap[muscle] || muscle.toLowerCase().replace(/\s+/g, '_');
  };

  // Fetch muscle group image
  useEffect(() => {
    const fetchMuscleImage = async () => {
      if (!primaryMuscle) {
        setImageLoading(false);
        return;
      }
      
      setImageLoading(true);
      try {
        const primaryGroups = mapMuscleToAPI(primaryMuscle);
        const secondaryGroups = secondaryMuscles
          .filter(m => m.trim())
          .map(m => mapMuscleToAPI(m.trim()))
          .join(',');
        const primaryColor = '240,100,80'; // Red for primary
        const secondaryColor = '200,100,80'; // Lighter red for secondary
        const transparentBackground = 1;

        const url = `${API_BASE_URL}/getMulticolorImage?primaryMuscleGroups=${encodeURIComponent(primaryGroups)}&secondaryMuscleGroups=${encodeURIComponent(secondaryGroups)}&primaryColor=${primaryColor}&secondaryColor=${secondaryColor}&transparentBackground=${transparentBackground}`;
        
        console.log('Fetching image from:', url);
        setImageUrl(url);
        setImageLoading(false);
      } catch (error) {
        console.error('Error fetching muscle image:', error);
        setImageLoading(false);
      }
    };

    fetchMuscleImage();
  }, [primaryMuscle, secondaryMuscles.join(',')]);

  // Fetch workout history for this exercise
  useEffect(() => {
    const fetchWorkoutHistory = async () => {
      if (!auth.currentUser || !exerciseName) {
        setWorkoutHistory([]);
        setHistoryLoading(false);
        return;
      }
      
      setHistoryLoading(true);
      try {
        const workoutsRef = collection(db, 'workouts');
        let querySnapshot;
        
        try {
          // Try query with orderBy
          const q = query(
            workoutsRef,
            where('userId', '==', auth.currentUser.uid),
            orderBy('createdAt', 'desc')
          );
          querySnapshot = await getDocs(q);
        } catch (indexError: any) {
          // Fallback to query without orderBy if index is missing
          if (indexError.code === 'failed-precondition' || indexError.message?.includes('index')) {
            console.log('Using fallback query without orderBy');
            const q = query(
              workoutsRef,
              where('userId', '==', auth.currentUser.uid)
            );
            querySnapshot = await getDocs(q);
          } else {
            throw indexError;
          }
        }
        
        const workouts: any[] = [];
        
        console.log(`Found ${querySnapshot.size} total workouts for user`);
        
        querySnapshot.forEach((doc) => {
          const workoutData = doc.data();
          
          // Check if exercises array exists and has items
          if (!workoutData.exercises || !Array.isArray(workoutData.exercises)) {
            return;
          }
          
          // Filter workouts that contain this exercise (case-insensitive match)
          const hasExercise = workoutData.exercises.some((ex: any) => 
            ex && ex.name && ex.name.trim().toLowerCase() === exerciseName.trim().toLowerCase()
          );
          
          if (hasExercise) {
            // Find the exercise data in this workout
            const exerciseData = workoutData.exercises.find((ex: any) => 
              ex && ex.name && ex.name.trim().toLowerCase() === exerciseName.trim().toLowerCase()
            );
            
            if (exerciseData) {
              workouts.push({
                id: doc.id,
                title: workoutData.title || 'Untitled Workout',
                createdAt: workoutData.createdAt || workoutData.date,
                exerciseData: exerciseData,
                volume: workoutData.volume || 0,
                sets: workoutData.sets || 0,
              });
            }
          }
        });
        
        // Sort by date (always sort, even if we got orderBy from query)
        workouts.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        
        console.log(`Found ${workouts.length} workouts with exercise "${exerciseName}"`);
        setWorkoutHistory(workouts);
      } catch (error) {
        console.error('Error fetching workout history:', error);
        setWorkoutHistory([]);
      } finally {
        setHistoryLoading(false);
      }
    };

    if (selectedTab === 'history') {
      fetchWorkoutHistory();
    }
  }, [selectedTab, exerciseName]);

  // Format date for display
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Format duration
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}min`;
    }
    return `${minutes}min`;
  };

  // Get exercise instructions
  const getExerciseInstructions = (exerciseName: string) => {
    const instructions: { [key: string]: string[] } = {
      'Bench Press': [
        'Lie flat on the bench with your feet firmly on the ground',
        'Grip the bar slightly wider than shoulder-width',
        'Lower the bar to your chest with control',
        'Press the bar up explosively until your arms are fully extended',
        'Keep your core tight and maintain proper form throughout'
      ],
      'Squat': [
        'Stand with feet shoulder-width apart, toes slightly pointed out',
        'Keep your chest up and core engaged',
        'Lower your body by bending at the knees and hips',
        'Descend until your thighs are parallel to the floor',
        'Drive through your heels to return to the starting position'
      ],
      'Deadlift': [
        'Stand with feet hip-width apart, bar over mid-foot',
        'Bend at hips and knees to grip the bar',
        'Keep your back straight and chest up',
        'Drive through your heels and extend hips and knees',
        'Stand tall with the bar, then lower with control'
      ],
      'Pull Up': [
        'Hang from the bar with palms facing away, hands shoulder-width apart',
        'Engage your lats and pull your body up',
        'Pull until your chin clears the bar',
        'Lower yourself with control to full arm extension',
        'Keep your core tight throughout the movement'
      ],
      'Overhead Press': [
        'Stand with feet shoulder-width apart',
        'Hold the bar at shoulder height with palms facing forward',
        'Press the bar straight up overhead',
        'Fully extend your arms at the top',
        'Lower the bar back to shoulder height with control'
      ],
      'Barbell Row': [
        'Bend at the hips with a slight knee bend',
        'Grip the bar with hands slightly wider than shoulder-width',
        'Pull the bar to your lower chest/upper abdomen',
        'Squeeze your back muscles at the top',
        'Lower the bar with control to full arm extension'
      ],
      'Dumbbell Curl': [
        'Stand with feet shoulder-width apart, holding dumbbells at your sides',
        'Keep your elbows close to your body',
        'Curl the weights up by contracting your biceps',
        'Squeeze at the top of the movement',
        'Lower the weights with control'
      ],
      'Tricep Dip': [
        'Position your hands on parallel bars or bench',
        'Lower your body by bending your arms',
        'Descend until your elbows are at 90 degrees',
        'Push up through your triceps to return to start',
        'Keep your body upright throughout'
      ]
    };

    return instructions[exerciseName] || [
      'Start with proper form and posture',
      'Control the weight throughout the entire range of motion',
      'Focus on the target muscle group',
      'Breathe properly - exhale on exertion, inhale on return',
      'Use a weight that allows you to maintain proper form'
    ];
  };

  const handleShare = async () => {
    try {
      let shareText = `${exerciseName}\n\n`;
      
      if (primaryMuscle) {
        shareText += `Primary Muscle: ${primaryMuscle}\n`;
      }
      
      if (secondaryMuscles.length > 0) {
        shareText += `Secondary Muscles: ${secondaryMuscles.join(', ')}\n`;
      }
      
      shareText += `\nHow to perform ${exerciseName}:\n\n`;
      const instructions = getExerciseInstructions(exerciseName);
      instructions.forEach((instruction, index) => {
        shareText += `${index + 1}. ${instruction}\n`;
      });
      
      await Share.share({
        message: shareText,
      });
      setShowMenuModal(false);
    } catch (error) {
      console.error('Error sharing exercise:', error);
    }
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
        <Text className={`text-lg font-semibold flex-1 text-center ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
          {exerciseName}
        </Text>
        <View className="flex-row items-center">
          <Pressable className="mr-3" onPress={handleShare}>
            <Share2 size={20} color={isDark ? '#F5F5F5' : '#11181C'} />
          </Pressable>
          <Pressable onPress={() => setShowMenuModal(true)}>
            <MoreVertical size={20} color={isDark ? '#F5F5F5' : '#11181C'} />
          </Pressable>
        </View>
      </View>

      {/* Tabs */}
      <View className={`flex-row border-b ${isDark ? 'border-border-dark' : 'border-border'}`}>
        {(['summary', 'history', 'howto'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setSelectedTab(tab)}
            className="flex-1 py-3 items-center"
          >
            <Text
              className={`text-sm font-medium capitalize ${
                selectedTab === tab
                  ? (isDark ? 'text-primary-dark' : 'text-primary')
                  : (isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground')
              }`}
            >
              {tab === 'howto' ? 'How to' : tab}
            </Text>
            {selectedTab === tab && (
              <View className={`absolute bottom-0 h-0.5 w-full ${isDark ? 'bg-primary-dark' : 'bg-primary'}`} />
            )}
          </Pressable>
        ))}
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {selectedTab === 'summary' && (
          <>
            {/* Exercise Illustration */}
            <View className={`items-center justify-center py-8 ${isDark ? 'bg-background-dark' : 'bg-background'}`}>
              {imageLoading ? (
                <View className="w-full h-64 items-center justify-center">
                  <ActivityIndicator size="large" color={isDark ? '#60A5FA' : '#3B82F6'} />
                </View>
              ) : imageUrl ? (
                <Image
                  source={{ uri: imageUrl }}
                  style={{ width: '100%', height: 300 }}
                  resizeMode="contain"
                  onError={(error) => {
                    console.error('Image load error:', error);
                    setImageLoading(false);
                  }}
                  onLoad={() => {
                    console.log('Image loaded successfully');
                    setImageLoading(false);
                  }}
                />
              ) : (
                <View className={`w-full h-64 items-center justify-center ${isDark ? 'bg-card-dark' : 'bg-card'} rounded-lg`}>
                  <Text className={isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}>
                    Image not available
                  </Text>
                </View>
              )}
            </View>

            {/* Exercise Summary */}
            <View className={`px-4 py-4 ${isDark ? 'bg-background-dark' : 'bg-background'}`}>
              <View className="flex-row items-center mb-3">
                <View className={`w-12 h-12 rounded-full items-center justify-center mr-3 ${isDark ? 'bg-card-dark' : 'bg-card'}`}>
                  <Dumbbell size={24} color={isDark ? '#9BA1A6' : '#687076'} />
                </View>
                <View className="flex-1">
                  <Text className={`text-2xl font-bold mb-2 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                    {exerciseName}
                  </Text>
                </View>
              </View>
              <View className={`rounded-lg p-3 ${isDark ? 'bg-card-dark' : 'bg-card'}`}>
                <View className="flex-row items-center mb-2">
                  <Text className={`text-sm font-semibold mr-2 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                    Primary:
                  </Text>
                  <Text className={`text-sm ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                    {primaryMuscle}
                  </Text>
                </View>
                {secondaryMuscles.length > 0 && (
                  <View className="flex-row items-center flex-wrap">
                    <Text className={`text-sm font-semibold mr-2 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                      Secondary:
                    </Text>
                    <Text className={`text-sm ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                      {secondaryMuscles.join(', ')}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </>
        )}

        {selectedTab === 'history' && (
          <View className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background'}`}>
            {historyLoading ? (
              <View className="flex-1 items-center justify-center py-8">
                <ActivityIndicator size="large" color={isDark ? '#3B82F6' : '#3B82F6'} />
                <Text className={`mt-4 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                  Loading history...
                </Text>
              </View>
            ) : workoutHistory.length === 0 ? (
              <View className="flex-1 items-center justify-center py-8 px-4">
                <Text className={`text-center ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                  No workout history found for this exercise
                </Text>
              </View>
            ) : (
              <View className="px-4 py-4">
                <Text className={`text-lg font-semibold mb-4 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                  Workout History ({workoutHistory.length})
                </Text>
                <FlatList
                  data={workoutHistory}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({ item }) => {
                    const completedSets = item.exerciseData?.sets?.filter((s: any) => s && s.completed) || [];
                    const weights = completedSets.map((s: any) => s.weight || 0).filter((w: number) => w > 0);
                    const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;
                    const totalVolume = completedSets.reduce((sum: number, s: any) => {
                      const weight = s.weight || 0;
                      const reps = s.reps || 0;
                      return sum + (weight * reps);
                    }, 0);

                    return (
                      <Pressable
                        className={`mb-3 p-4 rounded-xl ${isDark ? 'bg-card-dark' : 'bg-card'}`}
                        onPress={() => router.push(`/workout-detail?id=${item.id}`)}
                      >
                        <View className="flex-row items-center justify-between mb-2">
                          <Text className={`text-base font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                            {item.title || 'Untitled Workout'}
                          </Text>
                          <Text className={`text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                            {formatDate(item.createdAt)}
                          </Text>
                        </View>
                        <View className="flex-row items-center gap-4 mt-2">
                          <View>
                            <Text className={`text-xs ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                              Sets
                            </Text>
                            <Text className={`text-sm font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                              {completedSets.length}
                            </Text>
                          </View>
                          {maxWeight > 0 && (
                            <View>
                              <Text className={`text-xs ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                                Max Weight
                              </Text>
                              <Text className={`text-sm font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                                {maxWeight} kg
                              </Text>
                            </View>
                          )}
                          {totalVolume > 0 && (
                            <View>
                              <Text className={`text-xs ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                                Volume
                              </Text>
                              <Text className={`text-sm font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                                {totalVolume} kg
                              </Text>
                            </View>
                          )}
                        </View>
                      </Pressable>
                    );
                  }}
                />
              </View>
            )}
          </View>
        )}

        {selectedTab === 'howto' && (
          <View className={`px-4 py-6 ${isDark ? 'bg-background-dark' : 'bg-background'}`}>
            <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              How to Perform {exerciseName}
            </Text>
            <View className={`rounded-xl p-4 mb-4 ${isDark ? 'bg-card-dark' : 'bg-card'}`}>
              <Text className={`text-base font-semibold mb-3 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                Step-by-Step Instructions
              </Text>
              {getExerciseInstructions(exerciseName).map((instruction, index) => (
                <View key={index} className="flex-row mb-3">
                  <View className={`w-6 h-6 rounded-full items-center justify-center mr-3 ${isDark ? 'bg-primary-dark' : 'bg-primary'}`}>
                    <Text className="text-white text-xs font-bold">{index + 1}</Text>
                  </View>
                  <Text className={`flex-1 text-sm ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                    {instruction}
                  </Text>
                </View>
              ))}
            </View>
            <View className={`rounded-xl p-4 ${isDark ? 'bg-card-dark' : 'bg-card'}`}>
              <Text className={`text-base font-semibold mb-3 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                Tips
              </Text>
              <View className="mb-2">
                <Text className={`text-sm ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                  • Focus on proper form over heavy weight
                </Text>
              </View>
              <View className="mb-2">
                <Text className={`text-sm ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                  • Control the weight throughout the entire movement
                </Text>
              </View>
              <View className="mb-2">
                <Text className={`text-sm ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                  • Breathe properly - exhale on exertion
                </Text>
              </View>
              <View className="mb-2">
                <Text className={`text-sm ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                  • Warm up before lifting heavy weights
                </Text>
              </View>
              <View>
                <Text className={`text-sm ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                  • Rest adequately between sets
                </Text>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Menu Modal */}
      <Modal
        visible={showMenuModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowMenuModal(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onPress={() => setShowMenuModal(false)}
        >
          <Pressable
            className={`rounded-2xl p-4 w-11/12 max-w-sm ${isDark ? 'bg-card-dark' : 'bg-card'}`}
            onPress={(e) => e.stopPropagation()}
          >
            <Pressable
              className="flex-row items-center py-3 px-4 rounded-lg active:opacity-70"
              onPress={handleShare}
            >
              <Share2 size={20} color={isDark ? '#F5F5F5' : '#11181C'} />
              <Text className={`ml-3 text-base ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                Share Exercise
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

