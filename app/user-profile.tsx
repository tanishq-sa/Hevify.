import { auth, db } from '@/config/firebase';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getUserStats, getUserDocument } from '@/utils/firestore-init';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { ChevronLeft } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  Text,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../global.css';

export default function UserProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  
  const [userData, setUserData] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserProfile = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // Load user data and stats
        const [userDoc, stats] = await Promise.all([
          getUserDocument(userId),
          getUserStats(userId)
        ]);
        
        if (userDoc) {
          setUserData(userDoc);
          setUserStats(stats);
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, [userId]);

  if (loading) {
    return (
      <SafeAreaView 
        className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background'}`} 
        edges={['top', 'left', 'right']}
      >
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={isDark ? '#3B82F6' : '#3B82F6'} />
          <Text className={`mt-4 text-base ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView 
        className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background'}`} 
        edges={['top', 'left', 'right']}
      >
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable onPress={() => router.back()}>
            <ChevronLeft size={24} color={isDark ? '#F5F5F5' : '#11181C'} />
          </Pressable>
          <Text className={`text-lg font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
            Profile
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View className="flex-1 items-center justify-center px-4">
          <Text className={`text-center ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
            User not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isOwnProfile = auth.currentUser?.uid === userId;

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
          Profile
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* User Info Section */}
        <View className="px-4 mb-6 mt-4">
          <View className="flex-row items-center mb-4">
            <Image
              source={{ uri: userData.avatar || 'https://i.pravatar.cc/150?img=12' }}
              className="w-20 h-20 rounded-full mr-4"
            />
            <View className="flex-1">
              <Text className={`text-xl font-bold mb-1 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                {userData.username || userData.email?.split('@')[0] || 'User'}
              </Text>
              {userData.email && (
                <Text className={`text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                  {userData.email}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View className="px-4 mb-6">
          <Text className={`text-lg font-semibold mb-3 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
            Statistics
          </Text>
          <View className={`rounded-xl p-4 ${isDark ? 'bg-card-dark' : 'bg-card'}`}>
            <View className="flex-row justify-between mb-4">
              <View className="flex-1">
                <Text className={`text-xs mb-1 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                  Total Workouts
                </Text>
                <Text className={`text-2xl font-bold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                  {userStats?.totalWorkouts || 0}
                </Text>
              </View>
              <View className="flex-1">
                <Text className={`text-xs mb-1 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                  Total Volume
                </Text>
                <Text className={`text-2xl font-bold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                  {userStats?.totalVolume ? `${userStats.totalVolume.toLocaleString()} kg` : '0 kg'}
                </Text>
              </View>
            </View>
            <View className="flex-row justify-between">
              <View className="flex-1">
                <Text className={`text-xs mb-1 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                  Total Sets
                </Text>
                <Text className={`text-2xl font-bold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                  {userStats?.totalSets || 0}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

