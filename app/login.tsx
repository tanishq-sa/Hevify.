import { auth } from '@/config/firebase';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
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
import '../global.css';

export default function LoginScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    // Try to go back, if it fails, navigate to signup
    try {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/signup');
      }
    } catch {
      router.replace('/signup');
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.replace('/(tabs)');
    } catch (error: any) {
      console.error('Error logging in:', error);
      if (error.code === 'auth/invalid-email') {
        setError('Invalid email address');
      } else if (error.code === 'auth/user-not-found') {
        setError('No account found with this email');
      } else if (error.code === 'auth/wrong-password') {
        setError('Incorrect password');
      } else if (error.code === 'auth/invalid-credential') {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (error.code === 'auth/invalid-login-credentials') {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else {
        setError(error.message || 'An error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background'}`}>
      {/* Header */}
      <View className={`flex-row items-center justify-between px-4 py-3 border-b ${isDark ? 'border-border-dark' : 'border-border'}`}>
        <Pressable onPress={handleBack}>
          <ChevronLeft size={24} color={isDark ? '#F5F5F5' : '#11181C'} />
        </Pressable>
        <Text className={`text-lg font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
          Login
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView className="flex-1 px-4">
        <View className="py-8">
          <Text className={`text-3xl font-bold mb-2 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
            Welcome back
          </Text>
          <Text className={`text-base mb-8 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
            Sign in to continue
          </Text>

          {error && (
            <View className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-red-900/30' : 'bg-red-100'}`}>
              <Text className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                {error}
              </Text>
            </View>
          )}

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
          <View className="mb-6">
            <Text className={`text-sm mb-2 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              Password
            </Text>
            <TextInput
              className={`px-4 py-3 rounded-xl border ${isDark ? 'bg-card-dark border-border-dark text-foreground-dark' : 'bg-card border-border text-foreground'}`}
              placeholder="Enter your password"
              placeholderTextColor={isDark ? '#6B7280' : '#9CA3AF'}
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setError('');
              }}
              secureTextEntry
              autoCapitalize="none"
              autoComplete="password"
            />
          </View>

          {/* Login Button */}
          <Pressable
            className="py-4 rounded-xl items-center mb-4"
            style={{ backgroundColor: loading ? '#9CA3AF' : '#3B82F6' }}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text className="text-base font-semibold text-white">
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </Pressable>

          {/* Sign Up Link */}
          <View className="flex-row items-center justify-center">
            <Text className={`text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
              Don't have an account?{' '}
            </Text>
            <Pressable onPress={() => router.replace('/signup')}>
              <Text className="text-sm font-semibold" style={{ color: '#3B82F6' }}>
                Sign up
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

