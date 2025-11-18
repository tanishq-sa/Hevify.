import { auth, db } from '@/config/firebase';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { getUserStats, updateUserProfile } from '@/utils/firestore-init';
import { useRouter } from 'expo-router';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { Camera, LogOut, Pencil, UserRound, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../../global.css';

export default function ProfileScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [editAvatar, setEditAvatar] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        // Load user data from Firestore
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            // Load stats separately
            const stats = await getUserStats(firebaseUser.uid);
            setUserStats(stats);
          }
        } catch (error) {
          console.error('Error loading user data:', error);
        }
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleEditProfile = () => {
    setEditUsername(userData?.username || user?.email?.split('@')[0] || '');
    setEditAvatar(userData?.avatar || '');
    setShowEditModal(true);
  };

  const handleSaveProfile = async () => {
    try {
      if (!user) return;
      
      await updateUserProfile(user.uid, {
        username: editUsername.trim() || undefined,
        avatar: editAvatar.trim() || undefined,
      });
      
      // Reload user data
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
      
      setShowEditModal(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.replace('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

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
            <View className="relative">
              <Image
                source={{ uri: userData?.avatar || 'https://i.pravatar.cc/150?img=12' }}
                className="w-20 h-20 rounded-full mr-4"
              />
              <Pressable
                onPress={handleEditProfile}
                className="absolute bottom-0 right-4 w-6 h-6 rounded-full items-center justify-center"
                style={{ backgroundColor: '#3B82F6' }}
              >
                <Pencil size={12} color="#FFFFFF" />
              </Pressable>
            </View>
            <View className="flex-1">
              <Text className={`text-xl font-bold mb-1 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                {userData?.username || user.email?.split('@')[0] || 'User'}
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

        {/* Settings Section */}
        <View className="px-4 mb-6">
          <Text className={`text-lg font-semibold mb-3 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
            Settings
          </Text>
          
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

      {/* Edit Profile Modal */}
      <Modal
        visible={showEditModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowEditModal(false)}
      >
        <Pressable
          className="flex-1 justify-end"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onPress={() => setShowEditModal(false)}
        >
          <Pressable
            className={`${isDark ? 'bg-card-dark' : 'bg-card'} rounded-t-3xl p-6`}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="flex-row items-center justify-between mb-6">
              <Text className={`text-xl font-bold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                Edit Profile
              </Text>
              <Pressable onPress={() => setShowEditModal(false)}>
                <X size={24} color={isDark ? '#F5F5F5' : '#11181C'} />
              </Pressable>
            </View>

            {/* Profile Picture */}
            <View className="items-center mb-6">
              <View className="relative">
                <Image
                  source={{ uri: editAvatar || 'https://i.pravatar.cc/150?img=12' }}
                  className="w-24 h-24 rounded-full"
                />
                <View className="absolute bottom-0 right-0 w-8 h-8 rounded-full items-center justify-center"
                  style={{ backgroundColor: '#3B82F6' }}>
                  <Camera size={16} color="#FFFFFF" />
                </View>
              </View>
            </View>

            {/* Username Input */}
            <View className="mb-4">
              <Text className={`text-sm mb-2 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                Username
              </Text>
              <TextInput
                className={`p-4 rounded-xl ${isDark ? 'bg-muted-dark text-foreground-dark' : 'bg-muted text-foreground'}`}
                placeholder="Enter username"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                value={editUsername}
                onChangeText={setEditUsername}
              />
            </View>

            {/* Avatar URL Input */}
            <View className="mb-6">
              <Text className={`text-sm mb-2 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                Avatar URL
              </Text>
              <TextInput
                className={`p-4 rounded-xl ${isDark ? 'bg-muted-dark text-foreground-dark' : 'bg-muted text-foreground'}`}
                placeholder="Enter avatar URL"
                placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
                value={editAvatar}
                onChangeText={setEditAvatar}
              />
            </View>

            {/* Save Button */}
            <Pressable
              className="py-4 rounded-xl items-center"
              style={{ backgroundColor: '#3B82F6' }}
              onPress={handleSaveProfile}
            >
              <Text className="text-white font-semibold text-base">
                Save Changes
              </Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}
