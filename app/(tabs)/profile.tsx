import { useColorScheme } from '@/hooks/use-color-scheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect, useRouter } from 'expo-router';
import { LogOut, Settings, UserRound } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Image,
    Pressable,
    ScrollView,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../../global.css';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [user, setUser] = useState<any>(null);

  useFocusEffect(
    React.useCallback(() => {
      loadUser();
    }, [])
  );

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem('@current_user');
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem('@current_user');
      setUser(null);
      router.replace('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  if (!user) {
    return (
      <SafeAreaView 
        className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background'}`} 
        edges={['top', 'left', 'right']}
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          <View className="flex-row items-center justify-between px-4 py-3">
            <Text className={`text-2xl font-bold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              Profile
            </Text>
          </View>

          <View className="flex-1 items-center justify-center px-4 py-16">
            <View className={`w-24 h-24 rounded-full items-center justify-center mb-6 ${isDark ? 'bg-card-dark' : 'bg-card'}`}>
              <UserRound size={48} color={isDark ? '#9BA1A6' : '#687076'} />
            </View>
            
            <Text className={`text-xl font-semibold mb-2 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              Not signed in
            </Text>
            <Text className={`text-sm mb-8 text-center ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
              Sign in to view your profile and track your workouts
            </Text>

            <Pressable
              className="w-full py-4 rounded-xl items-center mb-3"
              style={{ backgroundColor: '#3B82F6' }}
              onPress={() => router.push('/login')}
            >
              <Text className="text-base font-semibold text-white">
                Login
              </Text>
            </Pressable>

            <Pressable
              className="w-full py-4 rounded-xl items-center border-2"
              style={{
                borderColor: isDark ? '#404040' : '#D4D4D4',
              }}
              onPress={() => router.push('/signup')}
            >
              <Text className={`text-base font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                Sign Up
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView 
      className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background'}`} 
      edges={['top', 'left', 'right']}
    >
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="flex-row items-center justify-between px-4 py-3">
          <Text className={`text-2xl font-bold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
            Profile
          </Text>
        </View>

        {/* User Info Section */}
        <View className="px-4 mb-6">
          <View className="flex-row items-center mb-4">
            <Image
              source={{ uri: 'https://i.pravatar.cc/150?img=12' }}
              className="w-20 h-20 rounded-full mr-4"
            />
            <View className="flex-1">
              <Text className={`text-xl font-bold mb-1 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                {user.username}
              </Text>
              <Text className={`text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                {user.email}
              </Text>
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
                  0
                </Text>
              </View>
              <View className="flex-1">
                <Text className={`text-xs mb-1 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                  Total Volume
                </Text>
                <Text className={`text-2xl font-bold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                  0 kg
                </Text>
              </View>
            </View>
            <View className="flex-row justify-between">
              <View className="flex-1">
                <Text className={`text-xs mb-1 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                  Total Sets
                </Text>
                <Text className={`text-2xl font-bold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                  0
                </Text>
              </View>
              <View className="flex-1">
                <Text className={`text-xs mb-1 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                  Records
                </Text>
                <Text className={`text-2xl font-bold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                  0
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View className="px-4 mb-6">
          <Text className={`text-lg font-semibold mb-3 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
            Settings
          </Text>
          
          <Pressable className={`flex-row items-center justify-between p-4 rounded-xl mb-2 ${isDark ? 'bg-card-dark' : 'bg-card'}`}>
            <View className="flex-row items-center">
              <Settings size={20} color={isDark ? '#9BA1A6' : '#687076'} />
              <Text className={`ml-3 text-base ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                Settings
              </Text>
            </View>
          </Pressable>

          <Pressable 
            className={`flex-row items-center justify-between p-4 rounded-xl ${isDark ? 'bg-card-dark' : 'bg-card'}`}
            onPress={handleLogout}
          >
            <View className="flex-row items-center">
              <LogOut size={20} color={isDark ? '#EF4444' : '#DC2626'} />
              <Text className={`ml-3 text-base ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                Logout
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
