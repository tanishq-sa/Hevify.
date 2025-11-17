import { useColorScheme } from '@/hooks/use-color-scheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChevronLeft, MoreVertical, Share2, Trophy } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, ScrollView, Text, View } from 'react-native';
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
  const [timeRange, setTimeRange] = useState<'3 months' | 'Year' | 'All time'>('3 months');
  const [isTimeRangeDropdownOpen, setIsTimeRangeDropdownOpen] = useState(false);

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
          <Pressable className="mr-3">
            <Share2 size={20} color={isDark ? '#F5F5F5' : '#11181C'} />
          </Pressable>
          <Pressable>
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
              <Text className={`text-2xl font-bold mb-2 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                {exerciseName}
              </Text>
              <Text className={`text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                Primary: {primaryMuscle}
              </Text>
              {secondaryMuscles.length > 0 && (
                <Text className={`text-sm mt-1 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                  Secondary: {secondaryMuscles.join(', ')}
                </Text>
              )}
            </View>

            {/* Progress Section */}
            <View className={`px-4 py-4 ${isDark ? 'bg-background-dark' : 'bg-background'}`}>
              <View className="flex-row items-center justify-between mb-4">
                <Text className={`text-base font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                  Current Progress
                </Text>
                <View className="relative">
                  <Pressable 
                    className="flex-row items-center"
                    onPress={() => setIsTimeRangeDropdownOpen(!isTimeRangeDropdownOpen)}
                  >
                    <Text className={`text-sm mr-1 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                      Last {timeRange}
                    </Text>
                    <ChevronLeft 
                      size={16} 
                      color={isDark ? '#9BA1A6' : '#687076'} 
                      style={{ transform: [{ rotate: isTimeRangeDropdownOpen ? '90deg' : '-90deg' }] }} 
                    />
                  </Pressable>
                  
                  {isTimeRangeDropdownOpen && (
                    <View 
                      className={`absolute top-8 right-0 z-50 rounded-lg shadow-lg min-w-[120px] ${isDark ? 'bg-card-dark' : 'bg-card'}`}
                      style={{
                        shadowColor: '#000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.25,
                        shadowRadius: 3.84,
                        elevation: 5,
                      }}
                    >
                      {(['3 months', 'Year', 'All time'] as const).map((option) => (
                        <Pressable
                          key={option}
                          onPress={() => {
                            setTimeRange(option);
                            setIsTimeRangeDropdownOpen(false);
                          }}
                          className={`px-4 py-3 ${timeRange === option ? (isDark ? 'bg-muted-dark' : 'bg-muted') : ''}`}
                        >
                          <Text className={`font-medium ${timeRange === option 
                            ? (isDark ? 'text-primary-dark' : 'text-primary')
                            : (isDark ? 'text-foreground-dark' : 'text-foreground')
                          }`}>
                            {option === '3 months' ? 'Last 3 months' : option === 'Year' ? 'Last Year' : 'All time'}
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  )}
                </View>
              </View>

              {/* Progress Graph Placeholder */}
              <View className={`h-48 rounded-lg mb-4 ${isDark ? 'bg-card-dark' : 'bg-card'} items-center justify-center`}>
                <Text className={isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}>
                  Progress graph will be displayed here
                </Text>
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-2 mb-6">
                <Pressable className={`flex-1 py-3 px-4 rounded-lg ${isDark ? 'bg-primary-dark' : 'bg-primary'}`}>
                  <Text className={`text-center font-medium ${isDark ? 'text-primary-foreground-dark' : 'text-primary-foreground'}`}>
                    Heaviest Weight
                  </Text>
                </Pressable>
                <Pressable className={`flex-1 py-3 px-4 rounded-lg ${isDark ? 'bg-card-dark' : 'bg-card'}`}>
                  <Text className={`text-center font-medium ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                    One Rep Max
                  </Text>
                </Pressable>
                <Pressable className={`flex-1 py-3 px-4 rounded-lg ${isDark ? 'bg-card-dark' : 'bg-card'}`}>
                  <Text className={`text-center font-medium ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                    Best Set
                  </Text>
                </Pressable>
              </View>

              {/* Personal Records */}
              <View className={`rounded-lg p-4 ${isDark ? 'bg-card-dark' : 'bg-card'}`}>
                <View className="flex-row items-center justify-between mb-4">
                  <View className="flex-row items-center">
                    <Trophy size={20} color="#FCD34D" />
                    <Text className={`text-base font-semibold ml-2 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                      Personal Records
                    </Text>
                  </View>
                  <Pressable>
                    <Text className={isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}>?</Text>
                  </Pressable>
                </View>
                <View className="flex-row items-center justify-between py-2">
                  <Text className={isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}>
                    Heaviest Weight
                  </Text>
                  <Text className={`font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                    -- kg
                  </Text>
                </View>
                <View className="flex-row items-center justify-between py-2">
                  <Text className={isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}>
                    Best 1RM
                  </Text>
                  <Text className={`font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                    -- kg
                  </Text>
                </View>
              </View>
            </View>
          </>
        )}

        {selectedTab === 'history' && (
          <View className={`px-4 py-8 ${isDark ? 'bg-background-dark' : 'bg-background'}`}>
            <Text className={`text-center ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
              Workout history will be displayed here
            </Text>
          </View>
        )}

        {selectedTab === 'howto' && (
          <View className={`px-4 py-8 ${isDark ? 'bg-background-dark' : 'bg-background'}`}>
            <Text className={`text-center ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
              Exercise instructions will be displayed here
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

