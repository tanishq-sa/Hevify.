import { auth, db } from '@/config/firebase';
import { arrayRemove, arrayUnion, doc, getDoc, updateDoc } from 'firebase/firestore';

/**
 * Like or unlike a workout
 */
export const toggleLike = async (workoutId: string): Promise<{ liked: boolean; likesCount: number }> => {
  try {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    const workoutRef = doc(db, 'workouts', workoutId);
    const workoutDoc = await getDoc(workoutRef);

    if (!workoutDoc.exists()) {
      throw new Error('Workout not found');
    }

    const workoutData = workoutDoc.data();
    const likes = workoutData.likes || [];
    const userId = auth.currentUser.uid;
    const isLiked = likes.includes(userId);

    if (isLiked) {
      // Unlike: remove user from likes array
      await updateDoc(workoutRef, {
        likes: arrayRemove(userId),
      });
      return { liked: false, likesCount: likes.length - 1 };
    } else {
      // Like: add user to likes array
      await updateDoc(workoutRef, {
        likes: arrayUnion(userId),
      });
      return { liked: true, likesCount: likes.length + 1 };
    }
  } catch (error) {
    console.error('Error toggling like:', error);
    throw error;
  }
};

/**
 * Get like status and count for a workout
 */
export const getWorkoutLikes = async (workoutId: string): Promise<{ liked: boolean; likesCount: number }> => {
  try {
    if (!auth.currentUser) {
      return { liked: false, likesCount: 0 };
    }

    const workoutRef = doc(db, 'workouts', workoutId);
    const workoutDoc = await getDoc(workoutRef);

    if (!workoutDoc.exists()) {
      return { liked: false, likesCount: 0 };
    }

    const workoutData = workoutDoc.data();
    const likes = workoutData.likes || [];
    const userId = auth.currentUser.uid;
    const isLiked = likes.includes(userId);

    return { liked: isLiked, likesCount: likes.length };
  } catch (error) {
    console.error('Error getting workout likes:', error);
    return { liked: false, likesCount: 0 };
  }
};

/**
 * Add a comment to a workout
 */
export const addComment = async (
  workoutId: string,
  text: string
): Promise<void> => {
  try {
    if (!auth.currentUser) {
      throw new Error('User not authenticated');
    }

    // Fetch user document to get username
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userDoc = await getDoc(userRef);
    const userData = userDoc.exists() ? userDoc.data() : null;
    const username = userData?.username || auth.currentUser.email?.split('@')[0] || 'User';

    const workoutRef = doc(db, 'workouts', workoutId);
    const workoutDoc = await getDoc(workoutRef);

    if (!workoutDoc.exists()) {
      throw new Error('Workout not found');
    }

    const comments = workoutDoc.data().comments || [];
    const newComment = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      userId: auth.currentUser.uid,
      username: username,
      text,
      createdAt: new Date().toISOString(),
    };

    await updateDoc(workoutRef, {
      comments: [...comments, newComment],
    });
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

/**
 * Get comments for a workout
 */
export const getWorkoutComments = async (workoutId: string): Promise<any[]> => {
  try {
    const workoutRef = doc(db, 'workouts', workoutId);
    const workoutDoc = await getDoc(workoutRef);

    if (!workoutDoc.exists()) {
      return [];
    }

    const workoutData = workoutDoc.data();
    const comments = workoutData.comments || [];
    
    // Sort comments by date (newest first)
    return comments.sort((a: any, b: any) => {
      const dateA = new Date(a.createdAt || 0).getTime();
      const dateB = new Date(b.createdAt || 0).getTime();
      return dateB - dateA;
    });
  } catch (error) {
    console.error('Error getting workout comments:', error);
    return [];
  }
};

