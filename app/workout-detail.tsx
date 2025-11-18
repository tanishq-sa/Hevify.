import { auth, db } from '@/config/firebase';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { addComment, getWorkoutComments, getWorkoutLikes, toggleLike } from '@/utils/workout-interactions';
import { getWorkoutById } from '@/utils/workout-storage';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { deleteDoc, doc, getDoc } from 'firebase/firestore';
import { ChevronLeft, Lock, MessageCircle, MoreVertical, Send, Share2, ThumbsUp, Trash2, X } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  Share,
  Text,
  TextInput,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import '../global.css';

export default function WorkoutDetailScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const router = useRouter();
  const params = useLocalSearchParams();
  const [workout, setWorkout] = useState<any>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [comments, setComments] = useState<any[]>([]);
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [userInfo, setUserInfo] = useState<{ username: string; avatar: string } | null>(null);
  const [showMenuModal, setShowMenuModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    loadWorkout();
  }, []);

  useEffect(() => {
    if (workout?.id) {
      loadLikesAndComments();
      loadUserInfo();
    }
  }, [workout?.id]);

  const loadUserInfo = async () => {
    try {
      if (workout?.userId) {
        const userDoc = await getDoc(doc(db, 'users', workout.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserInfo({
            username: userData.username || userData.email?.split('@')[0] || 'User',
            avatar: userData.avatar || 'https://i.pravatar.cc/150?img=12'
          });
        }
      }
    } catch (error) {
      console.error('Error loading user info:', error);
    }
  };

  const loadWorkout = async () => {
    try {
      const workoutId = params.id as string;
      console.log('Loading workout with ID:', workoutId);
      if (workoutId) {
        const foundWorkout = await getWorkoutById(workoutId);
        console.log('Found workout:', foundWorkout ? 'Yes' : 'No');
        if (foundWorkout) {
          setWorkout(foundWorkout);
        } else {
          console.error('Workout not found with ID:', workoutId);
        }
      } else {
        console.error('No workout ID provided in params');
      }
    } catch (error) {
      console.error('Error loading workout:', error);
    }
  };

  const loadLikesAndComments = async () => {
    try {
      const workoutId = params.id as string;
      if (workoutId) {
        const likesData = await getWorkoutLikes(workoutId);
        setIsLiked(likesData.liked);
        setLikesCount(likesData.likesCount);

        const commentsData = await getWorkoutComments(workoutId);
        setComments(commentsData);
      }
    } catch (error) {
      console.error('Error loading likes and comments:', error);
    }
  };

  const handleLike = async () => {
    try {
      const workoutId = params.id as string;
      if (workoutId) {
        const result = await toggleLike(workoutId);
        setIsLiked(result.liked);
        setLikesCount(result.likesCount);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleAddComment = async () => {
    try {
      if (!commentText.trim()) return;

      const workoutId = params.id as string;
      if (workoutId) {
        await addComment(workoutId, commentText.trim());
        setCommentText('');
        setShowCommentModal(false);
        await loadLikesAndComments(); // Reload comments
      }
    } catch (error) {
      console.error('Error adding comment:', error);
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
      return `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInDays === 1) {
      return '1d ago';
    } else {
      return `${diffInDays}d ago`;
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

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
    }) + ' - ' + date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateMuscleDistribution = (exercises: any[]) => {
    const muscleGroups: { [key: string]: number } = {};
    let totalSets = 0;

    exercises.forEach((exercise) => {
      const completedSets = exercise.sets.filter((set: any) => set.completed).length;
      totalSets += completedSets;

      // Count primary muscle
      if (exercise.primaryMuscle) {
        muscleGroups[exercise.primaryMuscle] = (muscleGroups[exercise.primaryMuscle] || 0) + completedSets;
      }

      // Count secondary muscles (with less weight)
      if (exercise.secondaryMuscles && exercise.secondaryMuscles.length > 0) {
        exercise.secondaryMuscles.forEach((muscle: string) => {
          muscleGroups[muscle] = (muscleGroups[muscle] || 0) + (completedSets * 0.5);
        });
      }
    });

    // Calculate percentages
    const distribution = Object.entries(muscleGroups)
      .map(([muscle, count]) => ({
        muscle,
        percentage: Math.round((count / totalSets) * 100)
      }))
      .sort((a, b) => b.percentage - a.percentage);

    return distribution;
  };

  const getSetTypeLabel = (setType?: string) => {
    switch (setType) {
      case 'W': return 'Warm-up';
      case 'F': return 'Failure';
      case 'D': return 'Drop';
      default: return null;
    }
  };

  const formatDateForShare = (dateString: string) => {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    const dayName = days[date.getDay()];
    const month = months[date.getMonth()];
    const day = date.getDate();
    const year = date.getFullYear();
    
    let hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
    
    return `${dayName}, ${month} ${day}, ${year} at ${hours}:${minutesStr}${ampm}`;
  };

  const formatWorkoutForShare = () => {
    if (!workout) return '';
    
    let shareText = `${workout.title || 'Workout'}\n\n`;
    shareText += `${formatDateForShare(workout.createdAt || workout.date)}\n\n\n`;
    
    workout.exercises.forEach((exercise: any) => {
      shareText += `${exercise.name}\n\n`;
      
      let setNumber = 1;
      exercise.sets.forEach((set: any) => {
        if (!set.completed) return;
        
        shareText += `Set ${setNumber}: `;
        
        if (set.weight !== undefined && set.weight > 0) {
          shareText += `${set.weight} kg x ${set.reps}`;
        } else if (set.reps !== undefined && set.reps > 0) {
          shareText += `${set.reps} reps`;
        } else if (set.duration) {
          shareText += `${set.duration}s`;
        }
        
        if (set.rpe) {
          shareText += ` @ ${set.rpe} rpe`;
        }
        
        const setTypeLabel = getSetTypeLabel(set.setType);
        if (setTypeLabel) {
          shareText += ` [${setTypeLabel}]`;
        }
        
        shareText += '\n';
        setNumber++;
      });
      
      shareText += '\n';
    });
    
    
    return shareText;
  };

  const handleShare = async () => {
    try {
      const shareText = formatWorkoutForShare();
      await Share.share({
        message: shareText,
      });
      setShowMenuModal(false);
    } catch (error) {
      console.error('Error sharing workout:', error);
    }
  };

  const handleDelete = async () => {
    try {
      const workoutId = params.id as string;
      if (workoutId && auth.currentUser) {
        const workoutRef = doc(db, 'workouts', workoutId);
        await deleteDoc(workoutRef);
        setShowDeleteModal(false);
        setShowMenuModal(false);
        router.back();
      }
    } catch (error) {
      console.error('Error deleting workout:', error);
      Alert.alert('Error', 'Failed to delete workout. Please try again.');
    }
  };

  const isOwner = auth.currentUser && workout?.userId === auth.currentUser.uid;

  if (!workout) {
    return (
      <SafeAreaView className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background'}`}>
        <View className="flex-1 items-center justify-center">
          <Text className={isDark ? 'text-foreground-dark' : 'text-foreground'}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const muscleDistribution = calculateMuscleDistribution(workout.exercises);

  return (
    <SafeAreaView className={`flex-1 ${isDark ? 'bg-background-dark' : 'bg-background'}`}>
      {/* Header */}
      <View className={`flex-row items-center justify-between px-4 py-3 border-b ${isDark ? 'border-border-dark' : 'border-border'}`}>
        <Pressable onPress={() => router.back()}>
          <ChevronLeft size={24} color={isDark ? '#F5F5F5' : '#11181C'} />
        </Pressable>
        <Text className={`text-lg font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
          Workout Detail
        </Text>
        <Pressable onPress={() => setShowMenuModal(true)}>
          <MoreVertical size={24} color={isDark ? '#F5F5F5' : '#11181C'} />
        </Pressable>
      </View>

      <ScrollView className="flex-1">
        {/* User Info */}
        <View className="p-4">
          <View className="flex-row items-center mb-3">
            <Image
              source={{ uri: userInfo?.avatar || 'https://i.pravatar.cc/150?img=12' }}
              className="w-12 h-12 rounded-full mr-3"
            />
            <View className="flex-1">
              <Text className={`text-base font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                {userInfo?.username || 'User'}
              </Text>
              <View className="flex-row items-center">
                <Text className={`text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                  {formatDate(workout.createdAt || workout.date)}
                </Text>
                {workout.visibility === 'Only me' && (
                  <>
                    <Text className={`text-sm mx-2 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>•</Text>
                    <Lock size={12} color={isDark ? '#9BA1A6' : '#687076'} />
                    <Text className={`text-sm ml-1 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                      Only you
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* Title */}
          <Text className={`text-xl font-bold mb-4 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
            {workout.title}
          </Text>

          {/* Stats */}
          <View className="flex-row mb-4">
            <View className="flex-1">
              <Text className={`text-xs ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                Time
              </Text>
              <Text className={`text-lg font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                {formatDuration(workout.duration)}
              </Text>
            </View>
            <View className="flex-1">
              <Text className={`text-xs ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                Volume
              </Text>
              <Text className={`text-lg font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                {workout.volume.toLocaleString()} kg
              </Text>
            </View>
            <View className="flex-1">
              <Text className={`text-xs ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                Sets
              </Text>
              <Text className={`text-lg font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                {workout.sets}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row items-center gap-4 pt-3 border-t" style={{ borderTopColor: isDark ? '#27272A' : '#E4E4E7' }}>
            <Pressable className="flex-row items-center" onPress={handleLike}>
              <ThumbsUp 
                size={20} 
                color={isLiked ? '#3B82F6' : (isDark ? '#9BA1A6' : '#687076')} 
                fill={isLiked ? '#3B82F6' : 'none'}
              />
              <Text className={`ml-2 text-sm ${isLiked ? 'text-primary' : (isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground')}`}>
                {likesCount}
              </Text>
            </Pressable>
            <Pressable className="flex-row items-center" onPress={() => setShowCommentModal(true)}>
              <MessageCircle size={20} color={isDark ? '#9BA1A6' : '#687076'} />
              <Text className={`ml-2 text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                {comments.length}
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Muscle Split */}
        {muscleDistribution.length > 0 && (
          <View className="mt-4 p-4">
            <Text className={`text-base font-semibold mb-3 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              Muscle Split
            </Text>
            {muscleDistribution.map((item, index) => (
              <View key={index} className="mb-3">
                <Text className={`text-sm mb-1 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                  {item.muscle}
                </Text>
                <View className="flex-row items-center">
                  <View className={`h-2 rounded-full ${isDark ? 'bg-muted-dark' : 'bg-muted'}`} style={{ flex: 1 }}>
                    <View 
                      className="h-2 rounded-full"
                      style={{ 
                        width: `${item.percentage}%`,
                        backgroundColor: '#3B82F6'
                      }}
                    />
                  </View>
                  <Text className={`ml-2 text-sm ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                    {item.percentage}%
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Workout Exercises */}
        <View className="mt-4 p-4">
          <View className="flex-row items-center justify-between mb-3">
            <Text className={`text-base font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              Workout
            </Text>
          </View>

          {workout.exercises.map((exercise: any, exerciseIndex: number) => (
            <View key={exerciseIndex} className="mb-6">
              {/* Exercise Header */}
              <View className="flex-row items-center mb-3">
                <View className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${isDark ? 'bg-muted-dark' : 'bg-muted'}`}>
                  <Text className="text-lg">🏋️</Text>
                </View>
                <Pressable
                  onPress={() => {
                    router.push({
                      pathname: '/exercise-detail',
                      params: {
                        name: exercise.name,
                        primaryMuscle: exercise.primaryMuscle || '',
                        secondaryMuscles: exercise.secondaryMuscles?.join(',') || '',
                      },
                    } as any);
                  }}
                >
                  <Text className={`text-base font-semibold ${isDark ? 'text-primary-dark' : 'text-primary'}`}>
                    {exercise.name}
                  </Text>
                </Pressable>
              </View>

              {/* Sets Header */}
              <View className="flex-row px-2 mb-2">
                <Text className={`w-12 text-xs ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                  SET
                </Text>
                <Text className={`flex-1 text-xs ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                  {exercise.sets[0]?.weight !== undefined ? 'WEIGHT & REPS' : (exercise.sets[0]?.reps !== undefined ? 'REPS' : 'DURATION')}
                </Text>
              </View>

              {/* Sets */}
              {exercise.sets.map((set: any, setIndex: number) => {
                if (!set.completed) return null;
                
                const setTypeLabel = getSetTypeLabel(set.setType);
                const isEven = setIndex % 2 === 0;
                
                return (
                  <View 
                    key={setIndex} 
                    className={`flex-row items-center px-2 py-3 mb-1 ${isEven ? '' : (isDark ? 'bg-muted-dark/30' : 'bg-muted/30')}`}
                  >
                    <View className="w-12 flex-row items-center">
                      <Text className={`text-sm ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                        {setIndex + 1}
                      </Text>
                      {setTypeLabel && (
                        <Text className={`ml-1 text-xs font-semibold ${setTypeLabel === 'Warm-up' ? 'text-yellow-500' : 'text-orange-500'}`}>
                          {setTypeLabel}
                        </Text>
                      )}
                    </View>
                    <View className="flex-1">
                      {set.weight !== undefined && set.weight > 0 ? (
                        <Text className={`text-sm ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                          {set.weight}kg x {set.reps} reps
                          {set.rpe && (
                            <Text className={`text-xs ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                              {' '}@ {set.rpe} rpe
                            </Text>
                          )}
                        </Text>
                      ) : set.reps !== undefined && set.reps > 0 ? (
                        <Text className={`text-sm ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                          {set.reps} reps
                        </Text>
                      ) : (
                        <Text className={`text-sm ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                          {set.duration || 0}s
                        </Text>
                      )}
                    </View>
                    {/* Show badge for PR */}
                    {set.rpe && set.rpe >= 9 && (
                      <View className="ml-2">
                        <Text className="text-lg">🏅</Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Comments Section */}
        {comments.length > 0 && (
          <View className="mt-4 p-4">
            <Text className={`text-base font-semibold mb-3 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              Comments ({comments.length})
            </Text>
            {comments.map((comment) => (
              <View key={comment.id} className="mb-4">
                <View className="flex-row items-start">
                  <View className={`w-8 h-8 rounded-full items-center justify-center mr-2 ${isDark ? 'bg-muted-dark' : 'bg-muted'}`}>
                    <Text className="text-xs">
                      {comment.username?.[0]?.toUpperCase() || 'U'}
                    </Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center mb-1">
                      <Text className={`text-sm font-semibold mr-2 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                        {comment.username}
                      </Text>
                      <Text className={`text-xs ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
                        {formatTimeAgo(comment.createdAt)}
                      </Text>
                    </View>
                    <Text className={`text-sm ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                      {comment.text}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Comment Modal */}
      <Modal
        visible={showCommentModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCommentModal(false)}
      >
        <Pressable
          className="flex-1"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onPress={() => setShowCommentModal(false)}
        >
          <Pressable
            className={`absolute bottom-0 left-0 right-0 ${isDark ? 'bg-card-dark' : 'bg-card'}`}
            style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20 }}
            onPress={(e) => e.stopPropagation()}
          >
            <View className="p-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className={`text-lg font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                  Add Comment
                </Text>
                <Pressable onPress={() => setShowCommentModal(false)}>
                  <X size={24} color={isDark ? '#F5F5F5' : '#11181C'} />
                </Pressable>
              </View>

              <TextInput
                className={`${isDark ? 'bg-muted-dark text-foreground-dark' : 'bg-muted text-foreground'} rounded-lg p-3 mb-4`}
                placeholder="Write a comment..."
                placeholderTextColor={isDark ? '#9BA1A6' : '#687076'}
                value={commentText}
                onChangeText={setCommentText}
                multiline
                numberOfLines={4}
                style={{ minHeight: 100, textAlignVertical: 'top' }}
              />

              <Pressable
                className={`flex-row items-center justify-center py-3 rounded-lg ${commentText.trim() ? 'bg-primary' : (isDark ? 'bg-muted-dark' : 'bg-muted')}`}
                onPress={handleAddComment}
                disabled={!commentText.trim()}
              >
                <Send size={18} color={commentText.trim() ? '#FFFFFF' : (isDark ? '#9BA1A6' : '#687076')} />
                <Text className={`ml-2 font-semibold ${commentText.trim() ? 'text-white' : (isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground')}`}>
                  Post Comment
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

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
                Share Workout
              </Text>
            </Pressable>
            
            {isOwner && (
              <Pressable
                className="flex-row items-center py-3 px-4 rounded-lg active:opacity-70 mt-2"
                onPress={() => {
                  setShowMenuModal(false);
                  setShowDeleteModal(true);
                }}
              >
                <Trash2 size={20} color="#EF4444" />
                <Text className="ml-3 text-base text-destructive">
                  Remove Workout
                </Text>
              </Pressable>
            )}
          </Pressable>
        </Pressable>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <Pressable
          className="flex-1 items-center justify-center"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          onPress={() => setShowDeleteModal(false)}
        >
          <Pressable
            className={`rounded-2xl p-6 w-11/12 max-w-sm ${isDark ? 'bg-card-dark' : 'bg-card'}`}
            onPress={(e) => e.stopPropagation()}
          >
            <Text className={`text-xl font-bold mb-2 ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
              Remove Workout
            </Text>
            <Text className={`text-base mb-6 ${isDark ? 'text-muted-foreground-dark' : 'text-muted-foreground'}`}>
              Are you sure you want to remove this workout? This action cannot be undone.
            </Text>
            
            <View className="flex-row gap-3">
              <Pressable
                className={`flex-1 py-3 rounded-lg items-center ${isDark ? 'bg-muted-dark' : 'bg-muted'}`}
                onPress={() => setShowDeleteModal(false)}
              >
                <Text className={`font-semibold ${isDark ? 'text-foreground-dark' : 'text-foreground'}`}>
                  Cancel
                </Text>
              </Pressable>
              
              <Pressable
                className="flex-1 py-3 rounded-lg items-center bg-destructive active:opacity-90"
                onPress={handleDelete}
              >
                <Text className="text-white font-semibold">
                  Remove
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

