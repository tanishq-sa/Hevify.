import { HapticTab } from '@/components/haptic-tab';
import { WorkoutOverlay } from '@/components/workout-overlay';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Tabs } from 'expo-router';
import { Dumbbell, House, UserRound } from 'lucide-react-native';
import React from 'react';
import { View } from 'react-native';
import '../../global.css';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <House color={color || (isDark ? '#F5F5F5' : '#11181C')} />,
          }}
        />
        <Tabs.Screen
          name="workout"
          options={{
            title: 'Workout',
            tabBarIcon: ({ color }) => <Dumbbell color={color || (isDark ? '#F5F5F5' : '#11181C')} />,
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: 'Profile',
            tabBarIcon: ({ color }) => <UserRound color={color || (isDark ? '#F5F5F5' : '#11181C')} />,
          }}
        />
      </Tabs>
      <WorkoutOverlay />
    </View>
  );
}
