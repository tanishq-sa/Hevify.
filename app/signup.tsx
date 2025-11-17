import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { ChevronLeft } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import '../global.css';

export default function SignupScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSignup = async () => {
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    try {
      // Check if user already exists
      const usersData = await AsyncStorage.getItem('@users');
      const users = usersData ? JSON.parse(usersData) : [];
      
      const existingUser = users.find((u: any) => u.email === email || u.username === username);
      
      if (existingUser) {
        setError('Email or username already exists');
        return;
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        username,
        email,
        password, // In production, this should be hashed
      };

      users.push(newUser);
      await AsyncStorage.setItem('@users', JSON.stringify(users));

      // Save current user session
      await AsyncStorage.setItem('@current_user', JSON.stringify({
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
      }));

      router.replace('/(tabs)');
    } catch (error) {
      console.error('Error signing up:', error);
      setError('An error occurred. Please try again.');
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background'}`}>
      {/* Header */}
      <View className={`flex-row items-center justify-between px-4 py-3 border-b ${isDark ? 'border-border-dark' : 'border-border'}`}>
        <Pressable onPress={() => router.back()}>
          <ChevronLeft size={24} color={isDark ? '#F5F5F5' : '#11181C'} />
        </Pressable>
        <Text className={`text-lg font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
          Sign Up
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1 px-4">
        <View className="py-8">
          <Text className={`text-3xl font-bold mb-2 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
            Create account
          </Text>
          <Text className={`text-base mb-8 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
            Sign up to get started
          </Text>

          {error && (
            <View className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-red-900/30' : 'bg-red-100'}`}>
              <Text className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                {error}
              </Text>
            </View>
          )}

          {/* Username Input */}
          <View className="mb-4">
            <Text className={`text-sm mb-2 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              Username
            </Text>
            <TextInput
              className={`px-4 py-3 rounded-xl border ${isDark ? 'bg-card-dark border-border-dark text-foreground-dark' : 'bg-card border-border text-foreground'}`}
              placeholder="Choose a username"
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              value={username}
              onChangeText={(text) => {
                setUsername(text);
                setError('');
              }}
              autoCapitalize="none"
              autoComplete="username"
            />
          </View>

          {/* Email Input */}
          <View className="mb-4">
            <Text className={`text-sm mb-2 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              Email
            </Text>
            <TextInput
              className={`px-4 py-3 rounded-xl border ${isDark ? 'bg-card-dark border-border-dark text-foreground-dark' : 'bg-card border-border text-foreground'}`}
              placeholder="Enter your email"
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {/* Password Input */}
          <View className="mb-4">
            <Text className={`text-sm mb-2 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              Password
            </Text>
            <TextInput
              className={`px-4 py-3 rounded-xl border ${isDark ? 'bg-card-dark border-border-dark text-foreground-dark' : 'bg-card border-border text-foreground'}`}
              placeholder="Create a password"
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError('');
              }}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
            />
          </View>

          {/* Confirm Password Input */}
          <View className="mb-6">
            <Text className={`text-sm mb-2 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              Confirm Password
            </Text>
            <TextInput
              className={`px-4 py-3 rounded-xl border ${isDark ? 'bg-card-dark border-border-dark text-foreground-dark' : 'bg-card border-border text-foreground'}`}
              placeholder="Confirm your password"
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                setError('');
              }}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password-new"
            />
          </View>

          {/* Sign Up Button */}
          <Pressable
            className="py-4 rounded-xl items-center mb-4"
            style={{ backgroundColor: '#3B82F6' }}
            onPress={handleSignup}
          >
            <Text className="text-base font-semibold text-white">
              Sign Up
            </Text>
          </Pressable>

          {/* Login Link */}
          <View className="flex-row items-center justify-center">
            <Text className={`text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
              Already have an account?{' '}
            </Text>
            <Pressable onPress={() => router.push('/login')}>
              <Text className="text-sm font-semibold" style={{ color: '#3B82F6' }}>
                Login
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

